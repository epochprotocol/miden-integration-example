/**
 * Epoch testnet EVM chains — source of truth: docs/docs-new/supported-chains-and-tokens.md
 */
export const EPOCH_TESTNET_EVM_CHAINS = [
  { id: 11155111, name: 'Ethereum Sepolia' },
  { id: 84532, name: 'Base Sepolia' },
  { id: 11155420, name: 'Optimism Sepolia' },
  { id: 80002, name: 'Polygon Amoy' },
] as const;

export type EpochTestnetEvmChainId = (typeof EPOCH_TESTNET_EVM_CHAINS)[number]['id'];

/** Default destination chain for Cross-chain deposit and withdraw source chain. */
export const DEFAULT_TESTNET_CHAIN_ID = 11155111;
export const DEFAULT_TESTNET_CHAIN_ID_STR = String(DEFAULT_TESTNET_CHAIN_ID);

/** @deprecated Prefer `DEFAULT_TESTNET_CHAIN_ID_STR`. */
export const DEFAULT_SEPOLIA_CHAIN_ID_STR = DEFAULT_TESTNET_CHAIN_ID_STR;

/**
 * Virtual chain id for Miden as intent *output* in EVM→Miden (`gettokenout` with Miden extraData).
 * Allocator SIO uses this for `tokenOut.chainId` with `getTokenDataFromMidenFaucetId`; epoch-sio treats 0 as Miden
 * (`MIDEN_CHAIN_ID` in epoch-sio/src/services/web3/safe.ts). Do not set to an EVM chain id for this flow.
 */
export const MIDEN_DESTINATION_CHAIN_ID = 999999999;

export function getTestnetChainName(chainId: number | string): string {
  const id = typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;
  const chain = EPOCH_TESTNET_EVM_CHAINS.find((c) => c.id === id);
  return chain?.name ?? `Chain ${id}`;
}

export function isSupportedTestnetEvmChain(chainId: number): boolean {
  return EPOCH_TESTNET_EVM_CHAINS.some((c) => c.id === chainId);
}
