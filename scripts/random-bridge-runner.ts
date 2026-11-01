import { randomInt } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  AccountId,
  AuthSecretKey,
  FungibleAsset,
  MidenClient,
  Note,
  NoteArray,
  NoteAssets,
  NoteAttachment,
  NoteAttachmentScheme,
  NoteType,
  Word,
} from "@miden-sdk/miden-sdk";
import {
  CollateralType,
  EpochIntentSDK,
  MIDEN_VIRTUAL_CHAIN_ID,
  type SolveIntentParams,
} from "@epoch-protocol/epoch-intents-sdk";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  parseUnits,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { isNativeEvmTokenAddress } from "../src/constants/evm-tokens.ts";
import {
  buildCrossChainIntent,
  buildEVMToMidenIntent,
  formatQuoteTokenIn,
  getCrossChainQuote,
  getEVMToMidenQuote,
  normalizeMidenIdToHex,
} from "../src/services/epoch-bridge.ts";

interface Config {
  runs: number;
  intervalSeconds: number;
  apiUrl: string;
  evmPrivateKey: `0x${string}`;
  evmRpcUrl: string;
  evmChainId: number;
  evmTokenAddress: `0x${string}`;
  evmTokenDecimals: number;
  evmRecipient: `0x${string}`;
  midenRpcUrl?: string;
  midenAccountId: string;
  midenSecretKey: Uint8Array;
  midenFaucetId: string;
  midenDecimals: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required .env value: ${name}`);
  return value;
}

function requiredAny(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  throw new Error(`Set one of these .env values: ${names.join(", ")}`);
}

function positiveInteger(name: string, fallback?: number): number {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (!Number.isSafeInteger(value) || value === undefined || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function nonNegativeInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  const value = raw ? Number(raw) : fallback;
  if (!Number.isSafeInteger(value) || value === undefined || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
}

function hexBytes(name: string): Uint8Array {
  const raw = required(name).replace(/^0x/i, "");
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(raw)) {
    throw new Error(`${name} must be an even-length hex string`);
  }
  return Uint8Array.from(Buffer.from(raw, "hex"));
}

function loadConfig(): Config {
  const runs = positiveInteger("RUNS");
  const evmPrivateKey = `0x${required("EVM_PRIVATE_KEY").replace(/^0x/i, "")}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(evmPrivateKey)) {
    throw new Error(
      "EVM_PRIVATE_KEY must be a 32-byte 0x-prefixed private key",
    );
  }

  const evmRecipient = getAddress(
    process.env.EVM_RECIPIENT_ADDRESS?.trim() ||
      privateKeyToAccount(evmPrivateKey as `0x${string}`).address,
  );
  const evmTokenAddress = getAddress(required("EVM_TOKEN_ADDRESS"));

  return {
    runs,
    intervalSeconds: positiveInteger("INTERVAL_SECONDS", 5),
    apiUrl: requiredAny("EPOCH_API_URL", "VITE_TESTNET_ALLOCATOR_URL"),
    evmPrivateKey: evmPrivateKey as `0x${string}`,
    evmRpcUrl: required("EVM_RPC_URL"),
    evmChainId: positiveInteger("EVM_CHAIN_ID"),
    evmTokenAddress,
    evmTokenDecimals: nonNegativeInteger("EVM_TOKEN_DECIMALS", 18),
    evmRecipient,
    midenRpcUrl:
      process.env.MIDEN_RPC_URL?.trim() ||
      process.env.VITE_MIDEN_RPC_URL?.trim() ||
      undefined,
    midenAccountId: toAccountId(required("MIDEN_ACCOUNT_ID")).toString(),
    midenSecretKey: hexBytes("MIDEN_AUTH_SECRET_KEY"),
    midenFaucetId: toAccountId(required("MIDEN_FAUCET_ID")).toString(),
    midenDecimals: nonNegativeInteger("MIDEN_TOKEN_DECIMALS", 6),
  };
}

function toAccountId(id: string): AccountId {
  return AccountId.fromHex(normalizeMidenIdToHex(id));
}

function createEvmClients(config: Config) {
  const account = privateKeyToAccount(config.evmPrivateKey);
  const chain = defineChain({
    id: config.evmChainId,
    name: `EVM chain ${config.evmChainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [config.evmRpcUrl] } },
  });
  const transport = http(config.evmRpcUrl);
  const walletClient = createWalletClient({ account, chain, transport });
  const publicClient = createPublicClient({ chain, transport });

  return { account, chain, walletClient, publicClient };
}

function sdkFor(
  walletClient: WalletClient,
  apiUrl: string,
  midenDirection: boolean,
) {
  const client = midenDirection
    ? ({
        ...walletClient,
        chain: { ...walletClient.chain!, id: MIDEN_VIRTUAL_CHAIN_ID },
      } as WalletClient)
    : walletClient;
  return new EpochIntentSDK({ apiBaseUrl: apiUrl, walletClient: client });
}

function bindingAttachment(felts: bigint[]): NoteAttachment {
  // The native Node binding requires word arrays; its NoteAttachment
  // constructor cannot receive the browser SDK's BigUint64Array argument.
  // Preserve the SDK's mandate-binding felts in their original order.
  const words: Word[] = [];
  for (let offset = 0; offset < felts.length; offset += 4) {
    const values = felts.slice(offset, offset + 4);
    while (values.length < 4) values.push(0n);
    words.push(new Word(BigUint64Array.from(values)));
  }
  return NoteAttachment.fromWords(NoteAttachmentScheme.none(), words);
}

function makeP2IDENoteFactory(
  midenClient: MidenClient,
  midenAccountId: AccountId,
): SolveIntentParams["createMidenP2IDENote"] {
  return async (
    faucetId,
    amount,
    allocatorId,
    recallBlocks,
    attachmentFelts,
  ) => {
    try {
      if (!attachmentFelts?.length) {
        throw new Error(
          "Epoch SDK did not provide the mandate-binding note attachment",
        );
      }

      await midenClient.sync();
      const currentHeight = await midenClient.getSyncHeight();
      if (!Number.isFinite(currentHeight) || currentHeight <= 0) {
        throw new Error("Miden client has no current sync height");
      }

      const note = Note.createP2IDENote(
        midenAccountId,
        toAccountId(allocatorId),
        new NoteAssets([
          new FungibleAsset(toAccountId(faucetId), BigInt(amount)),
        ]),
        currentHeight + recallBlocks,
        undefined,
        NoteType.Public,
        bindingAttachment(attachmentFelts),
      );
      const noteId = note.id().toString();
      const requestBuilder =
        await midenClient.feeAwareTransactionRequestBuilder(midenAccountId);
      const request = requestBuilder
        .withOwnOutputNotes(new NoteArray([note]))
        .build();
      const { txId } = await midenClient.transactions.submit(
        midenAccountId,
        request,
      );
      console.info("Miden collateral note submitted:", {
        txId: txId.toHex(),
        noteId,
        reclaimHeight: currentHeight + recallBlocks,
      });
      await midenClient.transactions.waitFor(txId, { timeout: 120_000 });

      return { success: true, noteId };
    } catch (error) {
      console.error(
        "Failed to create or submit the Miden P2IDE note:",
        error instanceof Error ? error.message : error,
      );
      return {
        success: false,
      };
    }
  };
}

async function prepareBridge(
  config: Config,
  evm: ReturnType<typeof createEvmClients>,
  midenToEvm: boolean,
  amount: number,
) {
  const onChainId = await evm.publicClient.getChainId();
  if (onChainId !== config.evmChainId) {
    throw new Error(
      `EVM_RPC_URL reports chain ${onChainId}; EVM_CHAIN_ID is ${config.evmChainId}`,
    );
  }
  const sdk = sdkFor(evm.walletClient, config.apiUrl, midenToEvm);
  if (midenToEvm) {
    const quote = await getCrossChainQuote(
      sdk,
      {
        midenAccountId: config.midenAccountId,
        midenFaucetId: config.midenFaucetId,
        evmRecipient: config.evmRecipient,
        destinationChainId: config.evmChainId,
        outputTokenAddress: config.evmTokenAddress,
        minTokenOut: parseUnits(
          String(amount),
          config.evmTokenDecimals,
        ).toString(),
      },
      config.evmRecipient,
    );
    return { direction: "miden-to-evm" as const, sdk, quote };
  }
  const quote = await getEVMToMidenQuote(
    sdk,
    {
      sourceChainId: config.evmChainId,
      destinationChainId: MIDEN_VIRTUAL_CHAIN_ID,
      evmSourceAddress: evm.account.address,
      evmTokenAddress: config.evmTokenAddress,
      evmTokenDecimals: config.evmTokenDecimals,
      midenRecipientId: config.midenAccountId,
      midenFaucetId: config.midenFaucetId,
      minTokenOut: parseUnits(String(amount), config.midenDecimals).toString(),
    },
    evm.account.address,
  );
  return { direction: "evm-to-miden" as const, sdk, quote };
}

async function runOne(
  index: number,
  config: Config,
  evm: ReturnType<typeof createEvmClients>,
  noteFactory: SolveIntentParams["createMidenP2IDENote"],
) {
  const amount = randomInt(1, 11);
  const midenToEvm = randomInt(0, 2) === 0;
  const direction = midenToEvm ? "Miden → EVM" : "EVM → Miden";
  console.info(
    `\n[${index}/${config.runs}] ${direction}, target receive ${amount} tokens`,
  );
  const prepared = await prepareBridge(config, evm, midenToEvm, amount);
  const input = prepared.quote.quoteResult.tokenIn;
  if (!input || input === "0")
    throw new Error("Quote returned no required input amount");
  console.info(
    "Quoted input:",
    formatQuoteTokenIn(
      input,
      midenToEvm ? config.midenDecimals : config.evmTokenDecimals,
    ),
  );
  const result =
    prepared.direction === "miden-to-evm"
      ? await buildCrossChainIntent(prepared.sdk, {
          ...prepared.quote.params,
          collateralType: CollateralType.Miden,
          midenSourceAccount: config.midenAccountId,
          createMidenP2IDENote: noteFactory,
          preFetchedQuote: prepared.quote,
        })
      : await buildEVMToMidenIntent(prepared.sdk, {
          ...prepared.quote.params,
          preFetchedQuote: prepared.quote,
        });

  if (result.error) throw new Error(result.error);
  if (!result.solveResult)
    throw new Error("Bridge call returned no solve result");
  console.info(
    `[${index}/${config.runs}] ${direction} submitted`,
    result.solveResult,
  );
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const unknownArgs = process.argv.slice(2).filter((arg) => arg !== "--check");
  if (unknownArgs.length) throw new Error(`Unknown option: ${unknownArgs[0]}`);
  const config = loadConfig();
  const evm = createEvmClients(config);
  const midenAccountId = toAccountId(config.midenAccountId);
  const midenSecretKey = AuthSecretKey.deserialize(config.midenSecretKey);
  const midenClient = await MidenClient.createTestnet({
    ...(config.midenRpcUrl ? { rpcUrl: config.midenRpcUrl } : {}),
    ...(process.env.MIDEN_FEE_FAUCET_ID?.trim()
      ? { feeFaucetId: process.env.MIDEN_FEE_FAUCET_ID.trim() }
      : {}),
    storeName:
      process.env.MIDEN_STORE_NAME?.trim() ||
      `epoch-bridge-${midenAccountId.toString().replace(/^0x/, "")}`,
    autoSync: false,
  });

  try {
    console.info("Syncing Miden testnet…");
    await midenClient.sync();
    await midenClient.accounts.getOrImport(midenAccountId);
    const publicKeyCommitment = midenSecretKey.getPublicKeyAsWord();
    try {
      const knownCommitments =
        await midenClient.keystore.getCommitments(midenAccountId);
      const keyIsInstalled = knownCommitments.some(
        (commitment) =>
          commitment.toHex().toLowerCase() ===
          publicKeyCommitment.toHex().toLowerCase(),
      );
      if (!keyIsInstalled) {
        await midenClient.keystore.insert(midenAccountId, midenSecretKey);
      }
    } finally {
      publicKeyCommitment.free?.();
    }

    if (checkOnly) {
      const chainId = await evm.publicClient.getChainId();
      if (chainId !== config.evmChainId) {
        throw new Error(
          `EVM RPC chain ${chainId} differs from EVM_CHAIN_ID ${config.evmChainId}`,
        );
      }
      const gasBalance = await evm.publicClient.getBalance({
        address: evm.account.address,
      });
      const [tokenBalance, tokenDecimals] = isNativeEvmTokenAddress(
        config.evmTokenAddress,
      )
        ? [gasBalance, 18]
        : await Promise.all([
            evm.publicClient.readContract({
              address: config.evmTokenAddress,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [evm.account.address],
            }),
            evm.publicClient.readContract({
              address: config.evmTokenAddress,
              abi: erc20Abi,
              functionName: "decimals",
            }),
          ]);
      if (tokenDecimals !== config.evmTokenDecimals) {
        throw new Error(
          `EVM token uses ${tokenDecimals} decimals; configure EVM_TOKEN_DECIMALS accordingly`,
        );
      }
      const midenBalance = await midenClient.accounts.getBalance(
        midenAccountId,
        config.midenFaucetId,
      );
      const healthResponse = await fetch(
        `${config.apiUrl.replace(/\/$/, "")}/health`,
        {
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (!healthResponse.ok)
        throw new Error(
          `Allocator /health returned HTTP ${healthResponse.status}`,
        );
      const health = (await healthResponse.json()) as { status?: string };
      if (health.status !== "healthy")
        throw new Error("Allocator is not healthy");
      console.info(`EVM signer: ${evm.account.address}`);
      console.info(`EVM gas balance: ${formatUnits(gasBalance, 18)} ETH`);
      console.info(
        `EVM token balance: ${formatUnits(tokenBalance, config.evmTokenDecimals)}`,
      );
      console.info(`Miden account: ${config.midenAccountId}`);
      console.info(
        `Miden token balance: ${formatUnits(BigInt(midenBalance), config.midenDecimals)}`,
      );
      console.info(
        `Miden fee faucet: ${(await midenClient.feeFaucetId()).toString()}`,
      );
      const failedQuotes: string[] = [];
      for (const midenToEvm of [true, false]) {
        const direction = midenToEvm ? "Miden → EVM" : "EVM → Miden";
        try {
          const prepared = await prepareBridge(config, evm, midenToEvm, 1);
          console.info(
            `${direction} quote for 1 destination token: input ${formatQuoteTokenIn(prepared.quote.quoteResult.tokenIn, midenToEvm ? config.midenDecimals : config.evmTokenDecimals)}`,
          );
        } catch (error) {
          const detail = `${direction}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(detail);
          failedQuotes.push(detail);
        }
      }
      if (failedQuotes.length) {
        throw new Error(
          `Wallet connections are valid, but bridge quotes are unavailable at ${config.apiUrl}. Check the allocator's bridge solver. ${failedQuotes.join("; ")}`,
        );
      }
      console.info(
        `Configuration and connections checked. RUNS=${config.runs}; no transactions submitted.`,
      );
      return;
    }

    const noteFactory = makeP2IDENoteFactory(midenClient, midenAccountId);
    let failed = 0;

    for (let index = 1; index <= config.runs; index += 1) {
      try {
        await runOne(index, config, evm, noteFactory);
      } catch (error) {
        failed += 1;
        console.error(
          `[${index}/${config.runs}] failed:`,
          error instanceof Error ? error.message : error,
        );
      }

      if (index < config.runs) {
        console.info(
          `Waiting ${config.intervalSeconds} seconds before the next bridge call…`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, config.intervalSeconds * 1000),
        );
      }
    }

    console.info(`\nFinished ${config.runs} run(s); ${failed} failed.`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    midenSecretKey.free?.();
    midenClient.terminate();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    process.exitCode = 1;
  });
}
