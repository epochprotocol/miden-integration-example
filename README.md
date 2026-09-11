# Miden ⇄ EVM Epoch Integration Example

Reference dapp showing how to use [`@epoch-protocol/epoch-intents-sdk`](https://www.npmjs.com/package/@epoch-protocol/epoch-intents-sdk) to move value between Epoch testnet EVM chains and Miden devnet or testnet via Epoch intents.

Two flows:

- **Cross-chain** — Miden → EVM. Lock a Miden note, receive tokens on the selected EVM testnet chain.
- **Withdraw** — EVM → Miden. Pay ERC-20 on a connected EVM testnet chain, receive a Miden note.

## Supported testnet chains

| Network          | Chain ID  |
| ---------------- | --------- |
| Ethereum Sepolia | 11155111  |
| Base Sepolia     | 84532     |
| Optimism Sepolia | 11155420  |
| Miden (virtual)  | 999999999 |

Testnet tokens (USDC, DAI, USDT, etc.) share the same contract addresses across all EVM testnet chains. See [Supported Chains & Tokens](../docs/docs-new/supported-chains-and-tokens.md).

## Stack

- React 19 + Vite + TypeScript + Tailwind v4
- EVM: wagmi + RainbowKit + viem
- Miden: `@miden-sdk/miden-sdk`, `@miden-sdk/miden-wallet-adapter-react`
- Intents: `@epoch-protocol/epoch-intents-sdk` against the Epoch testnet allocator

## Run Locally

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
   `.env`:
   ```
   # Run the devnet-compatible smallocator locally.
   VITE_DEVNET_ALLOCATOR_URL=http://localhost:3000

   # Testnet stays disabled until both endpoints are configured for the same
   # network. Do not point either value at a devnet service.
   # VITE_MIDEN_TESTNET_RPC_URL=https://your-testnet-rpc.example
   # VITE_TESTNET_ALLOCATOR_URL=https://your-testnet-allocator.example
   ```
2. Install + start:
   ```bash
   pnpm i
   pnpm run dev
   ```
3. Open `http://localhost:5173`.

## Wallets

- **EVM**: any RainbowKit-supported wallet (MetaMask etc.) on an Epoch testnet EVM chain. Pays gas + provides tokens for withdraw deposits.
- **Miden**: Miden wallet adapter. Required for Withdraw and for creating P2IDE notes in Cross-chain.

## Test Funds

- **Miden devnet tokens**: claim from the [official devnet faucet](https://faucet.devnet.miden.io/) in a devnet Miden wallet. Testnet becomes selectable only after its RPC and Epoch allocator have both been configured.
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
- Devnet allocator URL is configurable via `VITE_DEVNET_ALLOCATOR_URL` (with `VITE_ALLOCATOR_URL` retained as a compatibility fallback). Testnet requires both `VITE_MIDEN_TESTNET_RPC_URL` and `VITE_TESTNET_ALLOCATOR_URL`.
- Build: `pnpm build` (`tsc -b && vite build`). Lint: `pnpm lint`.
