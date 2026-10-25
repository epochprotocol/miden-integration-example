import { DEPLOYMENT_PROFILE } from "../config/deployment";

/** EVM networks enabled by this deployment. */
export const EPOCH_EVM_CHAINS = DEPLOYMENT_PROFILE.evmChains;

export type EpochEvmChainId = (typeof EPOCH_EVM_CHAINS)[number]["id"];

/** Default destination chain for Miden→EVM and source chain for EVM→Miden. */
export const DEFAULT_EVM_CHAIN_ID = EPOCH_EVM_CHAINS[0].id;
export const DEFAULT_EVM_CHAIN_ID_STR = String(DEFAULT_EVM_CHAIN_ID);

export function getEvmChainName(chainId: number | string): string {
  const id =
    typeof chainId === "string" ? Number.parseInt(chainId, 10) : chainId;
  const chain = EPOCH_EVM_CHAINS.find((candidate) => candidate.id === id);
  return chain?.name ?? `Chain ${id}`;
}

export function isSupportedEvmChain(chainId: number): boolean {
  return EPOCH_EVM_CHAINS.some((chain) => chain.id === chainId);
}
