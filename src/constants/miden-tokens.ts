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
  "8ddb61e056105cf119634d919be743": 6,
  d162796b525d6c517a0d2a332413d4: 6,
  d2f049a23e9068715a2def9842673f: 6,
  d4510f4a85b542b144b84b04670ae6: 6,
  b7856af9c04fd3b124308caf69c9f4: 6,
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
