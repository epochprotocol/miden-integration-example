import { normalizeMidenIdToHex } from "../services/epoch-bridge";

/**
 * Hardcoded Miden testnet/devnet faucet → decimals map.
 *
 * Backend (sio/dex-solver/inventory) does not surface faucet decimals to the
 * frontend; relying on the wallet adapter's reported `decimals` is unreliable
 * (some adapters return 8 by default which silently mis-scales 6-decimal
 * tokens by 100x). Frontends must look up decimals here.
 *
 * Keys are normalized to lowercase hex without `0x` prefix. Lookups go through
 * `normalizeMidenIdToHex` first so bech32 faucet ids from the wallet adapter
 * (e.g. `mtst1...` or `mdev1...`) resolve correctly.
 */
const MIDEN_FAUCET_DECIMALS: Record<string, number> = {
  // Devnet native faucet from https://faucet.devnet.miden.io/get_metadata.
  "157e8ac22390f771044593acdc153f": 6,
  // Testnet faucet.
  "18101fa522c174b165efd4f70a0385": 6,
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
