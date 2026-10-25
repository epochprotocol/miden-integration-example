import { DEPLOYMENT_PROFILE } from "../config/deployment";
import type { MidenNetwork } from "../config/miden";
import { normalizeMidenIdToHex } from "../services/epoch-bridge";

function toMapKey(faucetId: string): string {
  const hex = normalizeMidenIdToHex(faucetId);
  const lower = hex.trim().toLowerCase();
  return lower.startsWith("0x") ? lower.slice(2) : lower;
}

// Miden asset decimals are public deployment metadata. The wallet adapter can
// report a default precision before it has loaded faucet metadata, so derive the
// lookup from the deployment profile instead of duplicating network-specific ids.
const MIDEN_FAUCET_DECIMALS: Record<MidenNetwork, Record<string, number>> = {
  mainnet: Object.fromEntries(
    DEPLOYMENT_PROFILE.miden.tokens.map(({ faucetId, decimals }) => [
      toMapKey(faucetId),
      decimals,
    ]),
  ),
};

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

/** Returns whether the solver has a Pragma price feed for this wallet asset. */
export function isPragmaSupportedMidenAsset(
  asset: { assetId: string; symbol?: string },
  network: MidenNetwork,
): boolean {
  return getMidenFaucetDecimals(asset.assetId, network) !== undefined;
}
