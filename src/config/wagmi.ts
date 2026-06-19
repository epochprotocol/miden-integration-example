import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import {
  baseSepolia,
  optimismSepolia,
  polygonAmoy,
  sepolia,
} from 'viem/chains';
import { defineChain, createWalletClient, custom } from 'viem';

const projectId = 'a3953ff16e6181e34fa7ead113ec1420';

export const miden = defineChain({
  id: 0,
  name: 'Miden',
  nativeCurrency: {
    decimals: 12,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [],
      webSocket: [],
    },
  },
});

/** All Epoch testnet EVM chains — see docs/docs-new/supported-chains-and-tokens.md */
export const chains = [sepolia, baseSepolia, optimismSepolia, polygonAmoy] as const;

// Only include real EVM chains in wagmi config — Miden (id: 0, no RPC) is not
// a wagmi-compatible chain and breaks RainbowKit connector initialization.
export const config = getDefaultConfig({
  appName: 'Miden x Epoch Bridge',
  projectId,
  chains,
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

export const midenClient = createWalletClient({
  chain: miden,
  transport: custom({
    async request(_args) {
      return true;
    },
  }),
});
