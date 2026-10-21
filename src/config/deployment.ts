import {
  MIDEN_VIRTUAL_CHAIN_ID,
  mainnetGraph,
} from "@epoch-protocol/epoch-intents-sdk";

export interface PublicDeploymentEnv {
  VITE_EPOCH_API_BASE_URL?: string;
  VITE_MIDEN_RPC_URL?: string;
}

interface MidenAsset {
  symbol: "USDCX" | "ETH";
  faucetId: string;
  decimals: 6 | 18;
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
    chainId: typeof MIDEN_VIRTUAL_CHAIN_ID;
    rpcUrl: string;
    tokens: ReadonlyArray<MidenAsset>;
    midenscanBase: "https://midenscan.com";
    walletNetwork: "mainnet";
  };
}

const BASE_MAINNET = mainnetGraph.chains.Base;
const BASE_USDC = mainnetGraph.tokens.USDC;
const MIDEN_ASSETS: ReadonlyArray<MidenAsset> = [
  {
    symbol: "USDCX",
    faucetId: "mm1arnfum9xuwwlrvgvrefejwvlavn3vk24_qr7qqq9wr6w",
    decimals: 6,
  },
  {
    symbol: "ETH",
    faucetId: "mm1apqelr6tlaeftyfj4f7w59dycysmtawe_qr7qqq9wr6w",
    decimals: 18,
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
      chainId: MIDEN_VIRTUAL_CHAIN_ID,
      rpcUrl: endpoint(env.VITE_MIDEN_RPC_URL, "https://rpc.cedar.miden.io"),
      tokens: MIDEN_ASSETS,
      midenscanBase: "https://midenscan.com",
      walletNetwork: "mainnet",
    },
  };
}

export const DEPLOYMENT_PROFILE = getDeploymentProfile({
  VITE_EPOCH_API_BASE_URL: import.meta.env?.VITE_EPOCH_API_BASE_URL,
  VITE_MIDEN_RPC_URL: import.meta.env?.VITE_MIDEN_RPC_URL,
});
