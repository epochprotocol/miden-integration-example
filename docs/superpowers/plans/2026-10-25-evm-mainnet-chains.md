# EVM Mainnet Chains Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Base, Arbitrum, Polygon, and Robinhood mainnet flows while retaining the existing EVM and Miden testnet setup.

**Architecture:** Keep a selected Mainnet/Testnet environment in the Miden network context. Derive EVM chain and token choices from the matching Epoch commons graph, configure wagmi for the union of supported EVM networks, and use the selected environment for the Miden provider and Epoch allocator.

**Tech Stack:** React 19, TypeScript, wagmi, RainbowKit, viem, Epoch commons and intent SDKs.

**Spec:** `docs/superpowers/specs/2026-10-25-evm-mainnet-chains-design.md`

## Global Constraints

- Mainnet EVM choices: Base (8453), Arbitrum One (42161), Polygon (137), Robinhood Chain (4663).
- Preserve testnet choices: Ethereum Sepolia (11155111), Base Sepolia (84532), Optimism Sepolia (11155420).
- Keep the existing testnet environment as the initial selection.
- Read chain and token IDs, addresses, and decimals from the corresponding Epoch commons graph.
- Robinhood selection does not imply that the Epoch allocator will quote every route.
- Preserve unrelated working-tree edits.
- Do not add or run tests unless the user asks for testing or verification.

## Review Focus

- Switching environment while a wallet is connected can leave the wallet on a chain from the other environment; the flow must require/select a chain from the active environment.
- Changing the destination chain must not retain a token address from the previous chain.
- Robinhood token choices must only include tokens with graph addresses for Robinhood.
- Switching the Miden network must update RPC, wallet adapter, allocator, faucet, and explorer together.
- Existing testnet defaults and token choices must remain intact.

---

### Task 1: Environment-aware network context and providers

**Files:**

- Modify: `src/hooks/useMidenNetwork.ts`
- Modify: `src/components/providers/MidenNetworkApp.tsx`
- Modify: `src/App.tsx` or `src/components/layout/Header.tsx` (place the network selector beside existing wallet controls)
- Modify: `src/config/miden.ts`
- Modify: `src/lib/epoch-sdk.ts`
- Modify: `src/lib/explorers.ts`
- Modify: `src/hooks/useIntentSettlementView.ts`
- Modify: `src/components/crosschain/IntentForm.tsx`
- Modify: `src/components/crosschain/IntentStatus.tsx`

**Interfaces:**

- Context exposes the active `MidenNetwork` and a setter.
- `MidenNetworkApp` uses the active environment to choose Miden RPC, wallet adapter network, allocator endpoint, and explorer config.
- App starts on the existing testnet environment.

- [x] Add state and setter to the Miden network context; start from `DEFAULT_MIDEN_NETWORK` (`testnet`).
- [x] Render a Mainnet/Testnet selector and verify its selected state changes context state.
- [x] Configure `MidenProvider` and `useEpochSdk` from the active context, using mainnet and testnet RPC/allocator URLs separately; key the signer provider by environment so a switch resets stale network state.
- [x] For mainnet, pass the wire value `"mainnet" as WalletAdapterNetwork`; the installed 0.17.5 enum only declares Devnet, Testnet, and Localnet, while the existing baseline used this cast for Miden Wallet mainnet.
- [x] Pass the active environment to Miden explorer URL helpers and update their consumers.
- [x] Run `pnpm build` and confirm the provider/context types compile.

### Task 2: Chain and token registries for both environments

**Files:**

- Modify: `src/config/deployment.ts`
- Modify: `src/constants/chains.ts`
- Modify: `src/config/wagmi.ts`
- Modify: `src/constants/evm-tokens.ts`
- Modify: `src/lib/explorers.ts`

**Interfaces:**

- Export `getEvmChains(network: MidenNetwork): readonly EpochEvmChain[]`.
- Export `getEvmTokensForChain(chainId: number, network: MidenNetwork): EvmToken[]`.
- Wagmi supports the union of the seven requested mainnet and existing testnet chains; form choices remain scoped to the active environment.

- [x] Derive mainnet chain metadata and per-chain tokens from `mainnetGraph`; derive existing testnet metadata and tokens from `testnetGraph`.
- [x] Use viem's `robinhood` chain definition (ID 4663); add its RPC transport and block explorer mapping.
- [x] Keep current testnet mock-token values and chain choices associated with testnet.
- [x] Verify `getEvmTokensForChain` only returns tokens with a graph address for the requested chain.
- [x] Run `pnpm build` and confirm chain definitions and registry types compile.

### Task 3: Scope flow choices to the active environment and chain

**Files:**

- Modify: `src/components/crosschain/IntentForm.tsx`
- Modify: `src/components/crosschain/intent/IntentDestinationFields.tsx`
- Modify: `src/components/crosschain/WithdrawForm.tsx`
- Modify: `src/components/crosschain/withdraw/WithdrawTokenFields.tsx`
- Modify: `README.md`

**Interfaces:**

- Destination options receive the active environment's chains and the selected destination chain's token list.
- Withdraw token options receive the connected EVM chain and active environment.
- Flow defaults select an available token for the current chain and refresh that selection when the chain changes.

- [x] Use `getEvmChains` to constrain Miden→EVM destination choices to the active environment.
- [x] Use `getEvmTokensForChain` for destination and EVM→Miden source tokens; update stale token selections when chain/environment changes.
- [x] Keep custom source-token entry available for EVM→Miden.
- [x] Update README's supported-chain table and explain the environment selector plus Robinhood allocator limitation.
- [x] Run `pnpm build` and inspect the UI choices for the four mainnets and retained testnets.

## Self-review

- Spec coverage: environment pairing is Task 1; supported chains, token addresses, and Robinhood metadata are Task 2; flow behavior and user-facing explanation are Task 3.
- No test commands are included, per the explicit constraint above; build and UI inspection are the planned checks.
- Implementation order is required because Tasks 2 and 3 consume the environment context and chain/token helpers defined earlier.
- Review follow-up: withdraw quotes are cleared when the EVM chain or Miden environment changes, and in-flight responses are discarded if their captured network/chain context is stale.
- Verification: `pnpm typecheck` and `pnpm build` pass. Browser inspection showed Base, Arbitrum One, Polygon, and Robinhood Chain on mainnet; Sepolia, Base Sepolia, and Optimism Sepolia remain on testnet. Robinhood token selection displayed graph-backed WETH.
