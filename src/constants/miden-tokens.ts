import { normalizeMidenIdToHex } from "../services/epoch-bridge";

/**
 * Hardcoded Miden faucet → decimals map.
 *
 * Backend (sio/dex-solver/inventory) does not surface faucet decimals to the
 * frontend; relying on the wallet adapter's reported `decimals` is unreliable
 * (some adapters return 8 by default which silently mis-scales 6-decimal
 * tokens by 100x). Frontends must look up decimals here.
 *
 * Keys are normalized to lowercase hex without `0x` prefix. Lookups go through
 * `normalizeMidenIdToHex` first so bech32 faucet ids from the wallet adapter
 * (e.g. `mtst1qxxxxxxxxxxxxx_xxxxxx`) resolve correctly.
 */
const MIDEN_FAUCET_DECIMALS: Record<string, number> = {
  // USDC on Miden testnet
  "2458e5446128e6b150b75b8ebd9ce1": 6,
};

function toMapKey(faucetId: string): string {
  const hex = normalizeMidenIdToHex(faucetId);
  const lower = hex.trim().toLowerCase();
  return lower.startsWith("0x") ? lower.slice(2) : lower;
}

/** Returns Miden faucet decimals, or `undefined` if the faucet is unknown. */
export function getMidenFaucetDecimals(faucetId: string): number | undefined {
  if (!faucetId) return undefined;
  try {
    return MIDEN_FAUCET_DECIMALS[toMapKey(faucetId)];
  } catch {
    return undefined;
  }
}
