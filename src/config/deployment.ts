import { mainnetGraph } from "@epoch-protocol/epoch-commons-sdk";

export interface PublicDeploymentEnv {
  VITE_EPOCH_API_BASE_URL?: string;
  VITE_MIDEN_RPC_URL?: string;
}

interface MidenMainnetGraph {
  chains: { Miden: { chainId: number; explorer: string } };
  tokens: {
    USDCX: { contractAddress: { Miden: string }; decimals: number };
    WETH: { contractAddress: { Miden: string }; decimals: number };
  };
}

interface MidenAsset {
  symbol: "USDCX" | "ETH";
  faucetId: string;
  decimals: number;
}

export interface DeploymentProfile {
  network: "mainnet";
  evmChains: ReadonlyArray<{ id: number; name: "Base" }>;
  evmTokens: ReadonlyArray<{
    symbol: "USDC";
    address: string;
    decimals: number;
  }>;
  epoch: {
    apiBaseUrl: string;
  };
  miden: {
    chainId: number;
    rpcUrl: string;
    tokens: ReadonlyArray<MidenAsset>;
    midenscanBase: string;
    walletNetwork: "mainnet";
  };
}

const BASE_MAINNET = mainnetGraph.chains.Base;
const BASE_USDC = mainnetGraph.tokens.USDC;
const COMMONS_MIDEN_MAINNET = mainnetGraph as unknown as MidenMainnetGraph;
const MIDEN_MAINNET = COMMONS_MIDEN_MAINNET.chains.Miden;
const MIDEN_MAINNET_RPC_URL = "https://rpc.cedar.miden.io";
const MIDEN_ASSETS: ReadonlyArray<MidenAsset> = [
  {
    symbol: "USDCX",
    faucetId: COMMONS_MIDEN_MAINNET.tokens.USDCX.contractAddress.Miden,
    decimals: COMMONS_MIDEN_MAINNET.tokens.USDCX.decimals,
  },
  {
    symbol: "ETH",
    faucetId: COMMONS_MIDEN_MAINNET.tokens.WETH.contractAddress.Miden,
    decimals: COMMONS_MIDEN_MAINNET.tokens.WETH.decimals,
  },
];

function endpoint(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export function getDeploymentProfile(
  env: PublicDeploymentEnv = {},
): DeploymentProfile {
  return {
    network: "mainnet",
    // The Commons graph is the source of truth for Base mainnet identifiers.
    evmChains: [{ id: BASE_MAINNET.chainId, name: "Base" }],
    evmTokens: [
      {
        symbol: "USDC",
        address: BASE_USDC.contractAddress.Base,
        decimals: BASE_USDC.decimals,
      },
    ],
    epoch: {
      apiBaseUrl: endpoint(
        env.VITE_EPOCH_API_BASE_URL,
        "https://miden-integration-example.epochprotocol.xyz/allocator",
      ),
    },
    miden: {
      chainId: MIDEN_MAINNET.chainId,
      rpcUrl: endpoint(env.VITE_MIDEN_RPC_URL, MIDEN_MAINNET_RPC_URL),
      tokens: MIDEN_ASSETS,
      midenscanBase: MIDEN_MAINNET.explorer,
      walletNetwork: "mainnet",
    },
  };
}

export const DEPLOYMENT_PROFILE = getDeploymentProfile({
  VITE_EPOCH_API_BASE_URL: import.meta.env?.VITE_EPOCH_API_BASE_URL,
  VITE_MIDEN_RPC_URL: import.meta.env?.VITE_MIDEN_RPC_URL,
});
