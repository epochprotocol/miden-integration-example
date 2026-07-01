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
  fc90f0f4da30e51168453b60eafed7: 6, // USDC
  "176275876f2fd41103257e341832b9": 6, // DAI
  "7725b0e9bb9406912d2ebeaeb05f4d": 6, // USDT
  a54717f6bd3210d128aeeaa8a2b7f3: 6, // WETH
  "151823cde4b7bd91352617729d7614": 6, // WBTC
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
