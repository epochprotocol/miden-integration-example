import { useIntentStatusQuery } from "./useIntentStatusQuery";
import { selectDestinationSettlement } from "../lib/intent-settlement";
import { explorerTxUrl } from "../lib/explorers";

export interface IntentSettlementView {
  latestStatusLabel?: string;
  /** Only set once no destination row is pending. */
  evmTransactionHash?: string;
  explorerLink?: string;
  showPollingSpinner: boolean;
}

export function useIntentSettlementView(
  userAddress: string | undefined,
  nonce: string | undefined,
  destinationChainId: number | undefined,
): IntentSettlementView {
  const { statuses, isPolling } = useIntentStatusQuery(
    userAddress,
    nonce,
    destinationChainId,
  );

  const latestStatus = statuses[statuses.length - 1];
  const { completed, hasPending } = selectDestinationSettlement(
    statuses,
    destinationChainId,
  );
  const evmTransactionHash = completed?.transactionHash;

  return {
    latestStatusLabel: latestStatus?.status
      ? String(latestStatus.status)
      : undefined,
    evmTransactionHash,
    explorerLink:
      evmTransactionHash !== undefined
        ? (explorerTxUrl(
            Number(completed?.chainId ?? destinationChainId),
            evmTransactionHash,
          ) ?? undefined)
        : undefined,
    // Also on hasPending: polling can exit between updates.
    showPollingSpinner: (isPolling || hasPending) && !evmTransactionHash,
  };
}
