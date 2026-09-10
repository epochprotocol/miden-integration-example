export type MidenNetwork = "devnet" | "testnet";

export const DEFAULT_MIDEN_NETWORK: MidenNetwork = "testnet";

export interface MidenNetworkConfig {
  rpcUrl: string;
  allocatorUrl: string | null;
  defaultFaucetId: string;
  midenscanBase: string;
  enabled: boolean;
  unavailableReason?: string;
}

const devnetRpcUrl = import.meta.env.VITE_MIDEN_DEVNET_RPC_URL?.trim();
const devnetAllocatorUrl = import.meta.env.VITE_DEVNET_ALLOCATOR_URL?.trim();
const testnetRpcUrl = import.meta.env.VITE_MIDEN_TESTNET_RPC_URL?.trim();
const testnetAllocatorUrl = import.meta.env.VITE_TESTNET_ALLOCATOR_URL?.trim();

const networkConfigs: Record<MidenNetwork, MidenNetworkConfig> = {
  devnet: {
    rpcUrl: devnetRpcUrl ?? "",
    allocatorUrl: devnetAllocatorUrl ?? null,
    defaultFaucetId: "0x157e8ac22390f771044593acdc153f",
    midenscanBase: "https://devnet.midenscan.com",
    enabled: Boolean(devnetRpcUrl && devnetAllocatorUrl),
    unavailableReason:
      "Configure VITE_MIDEN_DEVNET_RPC_URL and VITE_DEVNET_ALLOCATOR_URL.",
  },
  testnet: {
    rpcUrl: testnetRpcUrl ?? "",
    allocatorUrl: testnetAllocatorUrl ?? null,
    defaultFaucetId: "0x18101fa522c174b165efd4f70a0385",
    midenscanBase: "https://testnet.midenscan.com",
    enabled: Boolean(testnetRpcUrl && testnetAllocatorUrl),
    unavailableReason:
      "Configure VITE_MIDEN_TESTNET_RPC_URL and VITE_TESTNET_ALLOCATOR_URL.",
  },
};

export function getMidenNetworkConfig(
  network: MidenNetwork,
): MidenNetworkConfig {
  return networkConfigs[network];
}
