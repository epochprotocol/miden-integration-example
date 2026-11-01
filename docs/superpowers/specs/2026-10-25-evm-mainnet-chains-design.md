# EVM Mainnet Chains Design

## Intent

Add Base, Arbitrum One, Polygon, and Robinhood Chain mainnet support to the Miden integration example while keeping its existing EVM and Miden testnet setup available. The app should select the matching EVM chain set, Miden wallet network, and Epoch allocator environment together.

## Goals

- Offer Base (8453), Arbitrum One (42161), Polygon (137), and Robinhood Chain (4663) on mainnet.
- Preserve Ethereum Sepolia, Base Sepolia, and Optimism Sepolia testnet support.
- Use each chain's correct token addresses and decimals from the Epoch graph data.
- Keep mainnet and testnet Miden RPC, wallet, and allocator configuration paired with the selected environment.
- Make Robinhood selectable while treating quote execution as dependent on Epoch allocator support.

## Non-goals

- Add mainnet Optimism or Ethereum to this demo's EVM choices.
- Change the protocol or allocator's supported-chain set.
- Submit transactions or add new contract deployments.

## Approaches

1. **Replace testnet with mainnet.** Smallest change, but removes the current testnet workflows; not selected.
2. **Add a coordinated Mainnet/Testnet switch and graph-driven chain/token configs.** Preserves existing workflows and avoids mismatching EVM, Miden, and allocator networks; selected.
3. **Add mainnet chains to the wallet list only.** Rejected because app flows could send testnet allocator requests with mainnet chain IDs and wrong token addresses.

## Implementation calls

- The existing testnet setup remains available and remains the initial environment unless its current startup behavior requires a safer explicit choice.
- Mainnet EVM chain IDs and token maps come from the Epoch commons mainnet graph; testnet data remains sourced from the testnet graph.
- Robinhood Chain uses chain ID 4663 and its viem chain definition.
- Network changes update the Miden context, Miden provider/wallet network, and allocator URL together.
- Unsupported quote execution should surface the allocator's response; this UI change does not claim to add backend support.

## Constraints

- Miden network is currently fixed in `MidenNetworkApp`; exposing both environments requires making that provider configuration respond to the app's network selection.
- The working tree already contains in-progress testnet edits. Implementation must preserve those unrelated changes and build on the current testnet configuration.
