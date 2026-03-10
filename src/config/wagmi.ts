import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'viem/chains';

const projectId = 'a3953ff16e6181e34fa7ead113ec1420';

import { defineChain } from 'viem'
 
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
  // blockExplorers: {
  //   default: { name: 'Explorer', url: 'https://explorer.zora.energy' },
  // },
  // contracts: {
  //   multicall3: {
  //     address: '0xcA11bde05977b3631167028862bE2a173976CA11',
  //     blockCreated: 5882,
  //   },
  // },
})


// Only include real EVM chains in wagmi config — Miden (id: 0, no RPC) is not
// a wagmi-compatible chain and breaks RainbowKit connector initialization.
export const chains = [sepolia] as const;

export const config = getDefaultConfig({
  appName: 'Miden x Epoch Bridge',
  projectId,
  chains,
});


import { createWalletClient, custom } from 'viem'
 
export const midenClient = createWalletClient({ 
  chain: miden,
  transport: custom({
    async request({ method, params }) {
      console.log({method, params});
      // const response = await customRpc.request(method, params)
      return true
    }
  })
})

