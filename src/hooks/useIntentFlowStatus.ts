import { useMemo } from "react";
import { useIntentStatusQuery } from "./useIntentStatusQuery";
import { selectDestinationSettlement } from "../lib/intent-settlement";
import { readMidenNoteId } from "../lib/intent-result";
import type { IntentFlowStatus } from "../components/crosschain/IntentStatus";
import { MIDEN_VIRTUAL_CHAIN_ID } from "@epoch-protocol/epoch-intents-sdk";

export function useIntentFlowStatus(
  userAddress?: string,
  intentNonce?: string,
  destinationChainId?: number,
) {
  const { statuses, isPolling, error } = useIntentStatusQuery(
    userAddress,
    intentNonce,
    destinationChainId,
  );

  const status = useMemo<IntentFlowStatus | null>(() => {
    if (!userAddress || !intentNonce) return null;

    const midenRow = statuses.find(
      (s) => Number(s.chainId) === MIDEN_VIRTUAL_CHAIN_ID,
    );

    const { completed: completedEvm } = selectDestinationSettlement(
      statuses,
      destinationChainId,
    );
    const latest = statuses[statuses.length - 1];

    const midenNoteId =
      readMidenNoteId(midenRow) ?? readMidenNoteId(completedEvm);

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
      // Only the Miden row carries it, and only for a private payout.
      midenNoteBytes: midenRow?.midenNoteBytes,
      latestStatusLabel:
        latest?.status != null ? String(latest.status) : undefined,
      latestChainId:
        latest?.chainId != null ? String(latest.chainId) : undefined,
      statusCount: statuses.length,
    };
  }, [statuses, userAddress, intentNonce, destinationChainId]);

  return { status, statuses, isPolling, error };
}
