import { useMemo } from "react";
import { useIntentTransactionStatus } from "./useIntentTransactionStatus";
import type { IntentFlowStatus } from "../components/crosschain/IntentStatus";
import { MIDEN_CHAIN_ID } from "../lib/explorers";

export function useIntentFlowStatus(
  userAddress?: string,
  intentNonce?: string,
  destinationChainId?: number,
) {
  const { statuses, isPolling, error } = useIntentTransactionStatus(
    userAddress,
    intentNonce,
    destinationChainId,
  );

  const status = useMemo<IntentFlowStatus | null>(() => {
    if (!userAddress || !intentNonce) return null;

    const midenRow = statuses.find((s) => Number(s.chainId) === MIDEN_CHAIN_ID);

    // Strict: only the destination-chain settlement.
    //   - Hide while any destination-chain row is still pending (SIO can list
    //     a prior-step success alongside the in-flight user tx).
    //   - Once no pending remains, take the LAST destination-chain success.
    //   - Other EVM rows (e.g. Compact claim on dispatcher chain) ignored.
    let completedEvm: (typeof statuses)[number] | undefined;
    if (destinationChainId != null) {
      const destRows = statuses.filter(
        (s) => Number(s.chainId) === destinationChainId,
      );
      const anyPending = destRows.some(
        (s) => String(s.status).toLowerCase() === "pending",
      );
      if (!anyPending) {
        const successes = destRows.filter(
          (s) =>
            String(s.status).toLowerCase() === "success" &&
            typeof s.transactionHash === "string" &&
            s.transactionHash.length > 0,
        );
        completedEvm = successes[successes.length - 1];
      }
    }
    const latest = statuses[statuses.length - 1];

    const midenNoteId =
      (midenRow as any)?.midenNoteId ??
      (completedEvm as any)?.midenNoteId ??
      undefined;

    return {
      evmCompleted: !!completedEvm,
      evmTransactionHash: completedEvm?.transactionHash ?? undefined,
      evmChainId:
        completedEvm?.chainId != null
          ? Number(completedEvm.chainId)
          : destinationChainId,
      midenTxId: midenRow?.transactionHash ?? undefined,
      midenStatus:
        midenRow?.status != null ? String(midenRow.status) : undefined,
      midenNoteId,
      latestStatusLabel:
        latest?.status != null ? String(latest.status) : undefined,
      latestChainId:
        latest?.chainId != null ? String(latest.chainId) : undefined,
      statusCount: statuses.length,
    };
  }, [statuses, userAddress, intentNonce, destinationChainId]);

  return { status, statuses, isPolling, error };
}
