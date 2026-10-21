import { DEPLOYMENT_PROFILE } from "../config/deployment";

export interface EvmToken {
  symbol: string;
  address: string;
  decimals: number;
}

/** Canonical EVM token list for this deployment. */
export const EPOCH_EVM_TOKENS: EvmToken[] = [...DEPLOYMENT_PROFILE.evmTokens];

const BY_ADDR: Map<string, EvmToken> = new Map(
  EPOCH_EVM_TOKENS.map((token) => [token.address.toLowerCase(), token]),
);

/** Look up token by address (case-insensitive). Returns undefined if unknown. */
export function findEvmToken(
  address: string | undefined,
): EvmToken | undefined {
  if (!address) return undefined;
  return BY_ADDR.get(address.trim().toLowerCase());
}

/** Decimals for a known token, or `undefined` if unknown (caller must handle). */
export function getEvmTokenDecimals(
  address: string | undefined,
): number | undefined {
  return findEvmToken(address)?.decimals;
}
