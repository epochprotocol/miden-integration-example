import { http } from 'wagmi';
import { sepolia } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = 'a3953ff16e6181e34fa7ead113ec1420';

export const chains = [sepolia] as const;

export const config = getDefaultConfig({
  appName: 'Miden x Epoch Bridge',
  projectId,
  chains,
  transports: {
    ...Object.fromEntries(
      chains.map((chain) => [chain.id, http(chain.rpcUrls.default.http[0])])
    ),
  },
});

export const CHAIN_IDS = {
  SEPOLIA: sepolia.id,
} as const;
