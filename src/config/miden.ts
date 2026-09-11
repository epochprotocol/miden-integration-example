export type MidenNetwork = "testnet";

export const DEFAULT_MIDEN_NETWORK: MidenNetwork = "testnet";

export interface MidenNetworkConfig {
  rpcUrl: string;
  allocatorUrl: string;
  defaultFaucetId: string;
  midenscanBase: string;
}

const TESTNET_RPC_URL =
  import.meta.env.VITE_MIDEN_RPC_URL?.trim() ?? "https://rpc.testnet.miden.io";
const TESTNET_ALLOCATOR_URL = "https://testnet-dev.epochprotocol.xyz";

const testnetConfig: MidenNetworkConfig = {
  rpcUrl: TESTNET_RPC_URL,
  allocatorUrl: TESTNET_ALLOCATOR_URL,
  defaultFaucetId: "0x537c15a622074e91188aa894456c52",
  midenscanBase: "https://testnet.midenscan.com",
};

export function getMidenNetworkConfig(): MidenNetworkConfig {
  return testnetConfig;
}
