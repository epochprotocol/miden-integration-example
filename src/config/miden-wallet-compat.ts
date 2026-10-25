import type { WalletAdapterNetwork } from "@miden-sdk/miden-wallet-adapter-base";

/**
 * @miden-sdk/miden-wallet-adapter-base@0.17.5 does not yet declare
 * WalletAdapterNetwork.Mainnet. Miden Wallet expects the documented wire value
 * "mainnet", so contain that temporary upstream type gap at this provider
 * boundary rather than spreading casts through application code.
 */
export const MIDEN_MAINNET_WALLET_PROVIDER_CONFIG = {
  network: "mainnet" as WalletAdapterNetwork,
} as const;
