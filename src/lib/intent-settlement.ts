import type { IntentTransactionStatus } from "@epoch-protocol/epoch-intents-sdk";

const TERMINAL_STATUSES = new Set([
  "success",
  "completed",
  "failed",
  "reverted",
]);

// No destination rows yet means "not yet" — the settlement row may not exist
// so far, and stopping here would strand the UI before the tx ever appears.
export function isTerminal(
  statuses: IntentTransactionStatus[],
  destinationChainId?: number,
): boolean {
  if (statuses.length === 0) return false;
  if (destinationChainId != null) {
    const destRows = statuses.filter(
      (s) => Number(s.chainId) === destinationChainId,
    );
    if (destRows.length === 0) return false;
    return destRows.every((s) =>
      TERMINAL_STATUSES.has(String(s.status).toLowerCase()),
    );
  }
  return statuses.every((s) =>
    TERMINAL_STATUSES.has(String(s.status).toLowerCase()),
  );
}

export interface DestinationSettlement {
  /** The final destination-chain success row — only set once nothing is pending. */
  completed?: IntentTransactionStatus;
  /** True while any destination-chain row is still pending. */
  hasPending: boolean;
}

/**
 * Has the user's tx settled on the destination chain?
 *
 * SIO can list a prior-step success next to the user's still-pending tx, so any
 * pending destination row means nothing has settled yet. Rows on other chains
 * (the Compact claim on the dispatcher chain) are not the user's tx.
 */
export function selectDestinationSettlement(
  statuses: IntentTransactionStatus[],
  destinationChainId?: number,
): DestinationSettlement {
  if (destinationChainId == null) return { hasPending: false };

  const destRows = statuses.filter(
    (s) => Number(s.chainId) === destinationChainId,
  );
  if (destRows.some((s) => String(s.status).toLowerCase() === "pending")) {
    return { hasPending: true };
  }

  const successes = destRows.filter(
    (s) =>
      String(s.status).toLowerCase() === "success" &&
      typeof s.transactionHash === "string" &&
      s.transactionHash.length > 0,
  );
  return { completed: successes[successes.length - 1], hasPending: false };
}
