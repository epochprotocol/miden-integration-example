import { getDefaultConfig } from '@rainbow-me/rainbowkit';

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


export const chains = [miden] as const;

export const config = getDefaultConfig({
  appName: 'Miden x Epoch Bridge',
  projectId,
  chains,
  // transports: {
  //   ...Object.fromEntries(
  //     chains.map((chain) => [chain.id, http(chain.rpcUrls.default.http[0])])
  //   ),
  // },

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

