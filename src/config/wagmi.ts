import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseSepolia, optimismSepolia, sepolia } from "viem/chains";

// Public WalletConnect identifier, not a secret — it is sent to the client and
// is scoped by domain allowlist in the WalletConnect dashboard.
const projectId = "a3953ff16e6181e34fa7ead113ec1420";

/** All Epoch testnet EVM chains — see docs/docs-new/supported-chains-and-tokens.md */
const chains = [sepolia, baseSepolia, optimismSepolia] as const;

// Only real EVM chains belong here. Miden has no RPC and chain id 0, which
// breaks RainbowKit connector initialization; it is addressed through the Epoch
// SDK's MIDEN_VIRTUAL_CHAIN_ID instead of through wagmi.
export const config = getDefaultConfig({
  appName: "Miden x Epoch Bridge",
  projectId,
  chains,
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});
