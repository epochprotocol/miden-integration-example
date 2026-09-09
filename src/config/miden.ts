export type MidenNetwork = "devnet" | "testnet";

// Keep this in lockstep with the pinned @miden-sdk/* packages in package.json.
export const MIDEN_SDK_VERSION = "0.16.0-rc.5";
export const DEFAULT_MIDEN_NETWORK: MidenNetwork = "devnet";
export const MIDEN_NETWORK_STORAGE_KEY = "miden-integration-network";

export function getMidenNetworkConfig(network: MidenNetwork) {
  return {
    rpcUrl: network,
    defaultFaucetId:
      network === "devnet"
        ? "0x157e8ac22390f771044593acdc153f"
        : "0xfc90f0f4da30e51168453b60eafed7",
    midenscanBase: `https://${network}.midenscan.com`,
  };
}
