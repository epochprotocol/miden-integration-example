export type MidenNetwork = "devnet" | "testnet";

// Keep this in lockstep with the pinned @miden-sdk/* packages in package.json.
export const MIDEN_SDK_VERSION = "0.16.0-rc.5";
export const DEFAULT_MIDEN_NETWORK: MidenNetwork = "devnet";
export const MIDEN_NETWORK_STORAGE_KEY = "miden-integration-network";

export interface MidenNetworkConfig {
  rpcUrl: string;
  allocatorUrl: string | null;
  defaultFaucetId: string;
  midenscanBase: string;
  enabled: boolean;
  unavailableReason?: string;
}

const devnetAllocatorUrl =
  import.meta.env.VITE_DEVNET_ALLOCATOR_URL ??
  import.meta.env.VITE_ALLOCATOR_URL ??
  "http://localhost:3000";
const testnetRpcUrl = import.meta.env.VITE_MIDEN_TESTNET_RPC_URL?.trim();
const testnetAllocatorUrl = import.meta.env.VITE_TESTNET_ALLOCATOR_URL?.trim();

const networkConfigs: Record<MidenNetwork, MidenNetworkConfig> = {
  devnet: {
    rpcUrl: "devnet",
    allocatorUrl: devnetAllocatorUrl,
    defaultFaucetId: "0x157e8ac22390f771044593acdc153f",
    midenscanBase: "https://devnet.midenscan.com",
    enabled: true,
  },
  testnet: {
    // Testnet must be configured as a complete pair. Using its SDK alias with
    // a devnet allocator would create a note the allocator cannot consume.
    rpcUrl: testnetRpcUrl ?? "testnet",
    allocatorUrl: testnetAllocatorUrl ?? null,
    defaultFaucetId: "0xfc90f0f4da30e51168453b60eafed7",
    midenscanBase: "https://testnet.midenscan.com",
    enabled: Boolean(testnetRpcUrl && testnetAllocatorUrl),
    unavailableReason:
      "Configure VITE_MIDEN_TESTNET_RPC_URL and VITE_TESTNET_ALLOCATOR_URL to enable Testnet.",
  },
};

export function getMidenNetworkConfig(
  network: MidenNetwork,
): MidenNetworkConfig {
  return networkConfigs[network];
}
