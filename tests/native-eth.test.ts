import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  EpochIntentSDK,
  EVM_ZERO_ADDRESS,
  MIDEN_VIRTUAL_CHAIN_ID,
  type GetTaskDataParams,
} from "@epoch-protocol/epoch-intents-sdk";
import {
  EPOCH_TESTNET_TOKENS,
  findEvmToken,
  getEvmTokenDecimals,
} from "../src/constants/evm-tokens.ts";
import { WITHDRAW_TOKENS } from "../src/components/crosschain/withdraw/withdraw-tokens.ts";
import {
  buildCrossChainIntent,
  buildEVMToMidenIntent,
  buildEVMToMidenTaskDataParams,
  getCrossChainQuote,
  getEVMToMidenQuote,
} from "../src/services/epoch-bridge.ts";

const user = "0x1111111111111111111111111111111111111111";
const weth = EPOCH_TESTNET_TOKENS.find((token) => token.symbol === "WETH")!;
const evmParams = {
  sourceChainId: 11155111,
  destinationChainId: MIDEN_VIRTUAL_CHAIN_ID,
  evmSourceAddress: user,
  evmTokenAddress: EVM_ZERO_ADDRESS,
  midenRecipientId: "0x537c15a622074e91188aa894456c52",
  midenFaucetId: "0x4cbdcaffe75f0a317482224dae6436",
  minTokenOut: "1000000",
};
const midenParams = {
  midenAccountId: evmParams.midenRecipientId,
  midenFaucetId: evmParams.midenFaucetId,
  evmRecipient: user,
  destinationChainId: 11155111,
  outputTokenAddress: EVM_ZERO_ADDRESS,
  minTokenOut: "1000000000000000",
};

function sdkFixture() {
  // Use the real SDK task encoder; only the network/wallet boundaries are stubbed.
  const getTaskData = mock.fn((params: GetTaskDataParams) =>
    EpochIntentSDK.prototype.getTaskData(params),
  );
  const getIntentQuote = mock.fn(async (_params: unknown) => ({
    success: true,
    tokenIn: "2000000000000000",
  }));
  const solveIntent = mock.fn(async (_params: unknown) => ({ hash: "0x123" }));
  return {
    sdk: {
      getTaskData,
      getIntentQuote,
      solveIntent,
    } as unknown as EpochIntentSDK,
    getTaskData,
    getIntentQuote,
    solveIntent,
  };
}

test("ETH is selectable in both directions with 18 decimals, distinct from WETH", () => {
  assert.equal(findEvmToken(EVM_ZERO_ADDRESS)?.symbol, "ETH");
  assert.equal(getEvmTokenDecimals(EVM_ZERO_ADDRESS), 18);
  assert.ok(
    WITHDRAW_TOKENS.some((token) => token.address === EVM_ZERO_ADDRESS),
  );
  assert.notEqual(weth.address, EVM_ZERO_ADDRESS);
  assert.equal(findEvmToken(weth.address.toLowerCase())?.symbol, "WETH");
});

test("fixed ETH input uses native funding and wei", () => {
  const task = buildEVMToMidenTaskDataParams({
    ...evmParams,
    evmAmount: "0.002",
  });
  assert.equal(task.intentData.isNative, true);
  assert.equal(task.intentData.depositTokenAddress, EVM_ZERO_ADDRESS);
  assert.equal(task.intentData.tokenInAmount, "2000000000000000");
  assert.equal(task.intentData.outputTokenAddress, EVM_ZERO_ADDRESS);
});

for (const evmTokenAddress of [EVM_ZERO_ADDRESS, weth.address]) {
  const native = evmTokenAddress === EVM_ZERO_ADDRESS;
  test(`${native ? "ETH" : "WETH"} reverse quote and confirmation preserve the funding type`, async () => {
    const fixture = sdkFixture();
    const quote = await getEVMToMidenQuote(
      fixture.sdk,
      { ...evmParams, evmTokenAddress, evmAmount: "1" },
      user,
    );
    assert.equal(
      fixture.getTaskData.mock.calls[0].arguments[0].intentData.isNative,
      native,
    );
    assert.equal(
      fixture.getTaskData.mock.calls[0].arguments[0].intentData.tokenInAmount,
      "0",
    );
    assert.equal(
      (quote.intentData as { tokenIn: string }).tokenIn,
      evmTokenAddress,
    );
    assert.equal(
      (quote.intentData as { tokenOut: string }).tokenOut,
      EVM_ZERO_ADDRESS,
    );
    assert.equal(
      (
        fixture.getIntentQuote.mock.calls[0].arguments[0] as {
          isNative: boolean;
        }
      ).isNative,
      native,
    );

    const result = await buildEVMToMidenIntent(fixture.sdk, {
      ...quote.params,
      preFetchedQuote: quote,
    });
    assert.equal(result.error, undefined);
    assert.equal(fixture.getTaskData.mock.callCount(), 1);
    const solve = fixture.solveIntent.mock.calls[0].arguments[0] as {
      isNative: boolean;
      collateralType: string;
      quoteResult: unknown;
    };
    assert.equal(solve.isNative, native);
    assert.equal(solve.collateralType, "evm");
    assert.equal(solve.quoteResult, quote.quoteResult);
  });
}

test("ETH confirmation without a prefetched quote uses native funding", async () => {
  const fixture = sdkFixture();
  await buildEVMToMidenIntent(fixture.sdk, {
    ...evmParams,
    evmAmount: "0.002",
  });
  assert.equal(
    (fixture.solveIntent.mock.calls[0].arguments[0] as { isNative: boolean })
      .isNative,
    true,
  );
});

test("Miden to ETH keeps Miden note collateral through quote and confirmation", async () => {
  const fixture = sdkFixture();
  const quote = await getCrossChainQuote(fixture.sdk, midenParams, user);
  assert.equal(
    (quote.intentData as { tokenOut: string }).tokenOut,
    EVM_ZERO_ADDRESS,
  );
  assert.equal(
    (fixture.getIntentQuote.mock.calls[0].arguments[0] as { isNative: boolean })
      .isNative,
    false,
  );
  const createNote = async () => {
    throw new Error("should be passed to SDK only");
  };
  await buildCrossChainIntent(fixture.sdk, {
    ...midenParams,
    preFetchedQuote: quote,
    createMidenP2IDENote: createNote,
  });
  const solve = fixture.solveIntent.mock.calls[0].arguments[0] as {
    isNative: boolean;
    collateralType: string;
    createMidenP2IDENote: unknown;
  };
  assert.equal(solve.isNative, false);
  assert.equal(solve.collateralType, "miden");
  assert.equal(solve.createMidenP2IDENote, createNote);
});
