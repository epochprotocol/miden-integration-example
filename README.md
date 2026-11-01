# Miden ⇄ EVM Epoch Integration Example

Reference dapp showing how to use [`@epoch-protocol/epoch-intents-sdk`](https://www.npmjs.com/package/@epoch-protocol/epoch-intents-sdk) to move value between Epoch testnet EVM chains and Miden devnet or testnet via Epoch intents.

Two flows:

- **Cross-chain** — Miden → EVM. Lock a Miden note, receive tokens on the selected EVM testnet chain.
- **Withdraw** — EVM → Miden. Pay native ETH or an ERC-20 on a connected EVM testnet chain, receive a Miden note.

## Supported testnet chains

| Network          | Chain ID  |
| ---------------- | --------- |
| Ethereum Sepolia | 11155111  |
| Base Sepolia     | 84532     |
| Optimism Sepolia | 11155420  |
| Miden (virtual)  | 999999999 |

Testnet tokens (USDC, DAI, USDT, etc.) share the same contract addresses across all EVM testnet chains. See [Supported Chains & Tokens](../docs/docs-new/supported-chains-and-tokens.md).

Native ETH is available as **ETH · Native** in both EVM token selectors,
separately from WETH. ETH uses 18 decimals and the zero address
(`0x0000000000000000000000000000000000000000`). EVM → Miden uses the SDK's
native Compact deposit, with no ERC-20 approval. Miden → ETH uses Miden note
collateral and delivers native ETH to the EVM recipient. Quotes still depend
on solver liquidity for the selected pair.

When running the local stack, use the matching `smallocator`, `dex-solver`,
and `epoch-inventory-ts` changes. Native quotes use the Pragma ETH/USD feed
with the same freshness checks as Miden asset prices. Miden → ETH requires
native ETH in the inventory treasury on the selected EVM testnet; ERC-20
balances cannot fund a native payout.

## Stack

- React 19 + Vite + TypeScript + Tailwind v4
- EVM: wagmi + RainbowKit + viem
- Miden: `@miden-sdk/miden-sdk`, `@miden-sdk/miden-wallet-adapter-react`
- Intents: `@epoch-protocol/epoch-intents-sdk` against the Epoch testnet allocator

## Run Locally

1. Install + start:
   ```bash
   pnpm i
   pnpm run dev
   ```
2. Open `http://localhost:5173`.

## Wallets

- **EVM**: any RainbowKit-supported wallet (MetaMask etc.) on an Epoch testnet EVM chain. Pays gas + provides tokens for withdraw deposits.
- **Miden**: Miden wallet adapter. Required for Withdraw and for creating P2IDE notes in Cross-chain. The app is on Miden 0.17, so the wallet must be a 0.17 build: older wallets cannot read the transaction request it sends.

## Test Funds

- **Miden testnet tokens**: claim from a configured testnet faucet in a testnet Miden wallet.
- **Miden fees**: testnet charges transaction fees in USDCx (`0x4cbdcaffe75f0a317482224dae6436`), so the Miden account needs some USDCx to create the P2IDE note.
- **EVM testnet tokens**: ping Epoch team with your Ethereum address; team will send testnet USDC.

## Key Files

| Path                                   | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `src/services/epoch-bridge.ts`         | Epoch SDK wrapper (intent build / submit / poll)          |
| `src/hooks/useEpochIntent.ts`          | Miden→EVM intent submission flow                          |
| `src/hooks/useWithdrawIntent.ts`       | EVM→Miden withdraw flow                                   |
| `src/hooks/useMidenWalletAdapter.ts`   | Miden wallet connect/state                                |
| `src/hooks/useMidenP2IDNoteFactory.ts` | Wallet-submitted P2IDE collateral-note creation           |
| `src/hooks/useIntentFlowStatus.ts`     | Intent lifecycle polling                                  |
| `src/constants/chains.ts`              | Testnet EVM chains + Miden virtual chain id (`999999999`) |
| `src/config/wagmi.ts`                  | wagmi/RainbowKit config                                   |

## Notes

- `MIDEN_DESTINATION_CHAIN_ID = 999999999` is the virtual chain id used as `tokenOut.chainId` when Miden is the intent output. Do not set this to a real EVM chain id.
- The app uses Miden testnet and the Epoch testnet allocator by default. Set `VITE_MIDEN_RPC_URL` only to override the Miden RPC URL.
- Build: `pnpm build` (`tsc -b && vite build`). Lint: `pnpm lint`.
- Regression tests: `pnpm test`.

## Random bridge runner

The CLI runs a finite number of bridge attempts, immediately starts the first
one, then waits `INTERVAL_SECONDS` between attempts (5 seconds by default). Each
run picks Miden → EVM or EVM → Miden at random and requests a random whole-token
output from 1 to 10.
Both directions use the example's reverse-quote helpers: the allocator quotes
the required source amount before the runner signs or submits anything.
Both wallet keys are loaded from `.env`.

1. Copy `.env.example` to `.env` and set `RUNS`, `INTERVAL_SECONDS`, the EVM
   wallet/network/token fields, and the Miden account/faucet fields. `.env` is
   git-ignored.
2. Set `MIDEN_AUTH_SECRET_KEY` to the hex encoding of the Miden account's
   serialized `AuthSecretKey` (`AuthSecretKey.serialize()`). The key must match
   the auth component on `MIDEN_ACCOUNT_ID`.
3. Install dependencies with `pnpm install` (Node.js 22 or newer).
4. Run `pnpm bridge:check` to check the keys, account import, balances,
   token decimals, allocator health, and quotes for both directions. This
   command does not submit transactions.
5. Run `pnpm bridge:random` to start the configured number of attempts.

Miden token amounts use `MIDEN_TOKEN_DECIMALS`; EVM token amounts use
`EVM_TOKEN_DECIMALS`. Defaults are 6 and 18 for the example testnet tokens.
For native ETH, set `EVM_TOKEN_ADDRESS` to the zero address and
`EVM_TOKEN_DECIMALS=18`. The connection check reads the native ETH balance;
that balance also pays EVM gas.
`EVM_RECIPIENT_ADDRESS` defaults to the EVM signer; `MIDEN_ACCOUNT_ID` accepts
a hex account ID or the full wallet address, including its routing suffix.
The Miden account needs enough balance for every randomly chosen amount and
Miden transaction fees. Failed attempts are logged, counted, and the runner
continues until it reaches `RUNS`.

If both directions return `NO_QUOTE_AVAILABLE`, check the allocator's SIO and
bridge solver connections. A healthy allocator alone does not establish that
its bridge solver is reachable or has a quote for the requested token pair.
