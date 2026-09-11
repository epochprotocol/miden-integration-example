import { normalizeMidenIdToHex } from "../services/epoch-bridge";
import type { MidenNetwork } from "../config/miden";

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
const MIDEN_FAUCET_DECIMALS: Record<MidenNetwork, Record<string, number>> = {
  devnet: {
    "157e8ac22390f771044593acdc153f": 6,
  },
  testnet: {
    "537c15a622074e91188aa894456c52": 6,
    "6500ca8c2dd69e9147ab7eafad162c": 6,
    d17976f0809a8191412f2a126625df: 6,
    "4a09f13153d9cd114c078bfb62a7ec": 6,
    "5fd2e6fd17712c51404d09c2b847f7": 6,
  },
};

function toMapKey(faucetId: string): string {
  const hex = normalizeMidenIdToHex(faucetId);
  const lower = hex.trim().toLowerCase();
  return lower.startsWith("0x") ? lower.slice(2) : lower;
}

/** Returns Miden faucet decimals, or `undefined` if the faucet is unknown. */
export function getMidenFaucetDecimals(
  faucetId: string,
  network: MidenNetwork,
): number | undefined {
  if (!faucetId) return undefined;
  try {
    return MIDEN_FAUCET_DECIMALS[network][toMapKey(faucetId)];
  } catch {
    return undefined;
  }
}
