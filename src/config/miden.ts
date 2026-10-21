import { DEPLOYMENT_PROFILE } from "./deployment";

export type MidenNetwork = "mainnet";

export const DEFAULT_MIDEN_NETWORK: MidenNetwork = "mainnet";

export interface MidenNetworkConfig {
  rpcUrl: string;
  apiBaseUrl: string;
  defaultFaucetId: string;
  midenscanBase: string;
}

const mainnetConfig: MidenNetworkConfig = {
  rpcUrl: DEPLOYMENT_PROFILE.miden.rpcUrl,
  apiBaseUrl: DEPLOYMENT_PROFILE.epoch.apiBaseUrl,
  defaultFaucetId: DEPLOYMENT_PROFILE.miden.tokens[0].faucetId,
  midenscanBase: DEPLOYMENT_PROFILE.miden.midenscanBase,
};

export function getMidenNetworkConfig(): MidenNetworkConfig {
  return mainnetConfig;
}
