# Miden ⇄ EVM Epoch Integration Example

Reference dapp showing how to use [`@epoch-protocol/epoch-intents-sdk`](https://www.npmjs.com/package/@epoch-protocol/epoch-intents-sdk) to move value between Epoch testnet EVM chains and Miden testnet via Epoch intents.

Two flows:

- **Cross-chain** — Miden → EVM. Lock a Miden note, receive tokens on the selected EVM testnet chain.
- **Withdraw** — EVM → Miden. Pay ERC-20 on a connected EVM testnet chain, receive a Miden note.

## Supported testnet chains

| Network | Chain ID |
| ------- | -------- |
| Ethereum Sepolia | 11155111 |
| Base Sepolia | 84532 |
| Optimism Sepolia | 11155420 |
| Miden (virtual) | 999999999 |

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
   VITE_ALLOCATOR_URL=https://testnet-dev.epochprotocol.xyz
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

- **Miden testnet tokens**: claim from official Miden faucet in Miden Wallet.
- **EVM testnet tokens**: ping Epoch team with your Ethereum address; team will send testnet USDC.

## Key Files

| Path | Purpose |
|------|---------|
| `src/services/epoch-bridge.ts` | Epoch SDK wrapper (intent build / submit / poll) |
| `src/hooks/useEpochIntent.ts` | Miden→EVM intent submission flow |
| `src/hooks/useWithdrawIntent.ts` | EVM→Miden withdraw flow |
| `src/hooks/useMidenWalletAdapter.ts` | Miden wallet connect/state |
| `src/hooks/useMidenTransfer.ts` | P2IDE note creation on Miden |
| `src/hooks/useIntentFlowStatus.ts` | Intent lifecycle polling |
| `src/constants/chains.ts` | Testnet EVM chains + Miden virtual chain id (`999999999`) |
| `src/config/wagmi.ts` | wagmi/RainbowKit config |

## Notes

- `MIDEN_DESTINATION_CHAIN_ID = 999999999` is the virtual chain id used as `tokenOut.chainId` when Miden is the intent output. Do not set this to a real EVM chain id.
- Allocator URL is configurable via `VITE_ALLOCATOR_URL`. Default points at Epoch testnet-dev.
- Build: `pnpm build` (`tsc -b && vite build`). Lint: `pnpm lint`.
