import { useQuery } from "@tanstack/react-query";
import type { IntentTransactionStatus } from "@epoch-protocol/epoch-intents-sdk";
import { useEpochSdk } from "../lib/epoch-sdk";
import { isTerminal } from "../lib/intent-settlement";

const POLL_INTERVAL = 5000;

export interface IntentStatusQuery {
  statuses: IntentTransactionStatus[];
  isPolling: boolean;
  error: string | null;
}

/** Shared by every consumer, so N components cost one poll rather than N. */
export function useIntentStatusQuery(
  userAddress?: string,
  intentNonce?: string,
  destinationChainId?: number,
): IntentStatusQuery {
  const sdk = useEpochSdk();
  const enabled = !!sdk && !!userAddress && !!intentNonce;

  const { data, error } = useQuery({
    // destinationChainId is deliberately absent — it does not change the
    // request, and would split the cache between consumers, re-splitting the poll.
    queryKey: ["intentStatus", userAddress, intentNonce],
    queryFn: async () => {
      const result = await sdk!.getIntentStatus(userAddress!, intentNonce!);
      return Array.isArray(result) ? result : [];
    },
    enabled,
    refetchInterval: (query) =>
      isTerminal(query.state.data ?? [], destinationChainId)
        ? false
        : POLL_INTERVAL,
    // The user is watching a bridge settle; keep polling if they switch tabs.
    refetchIntervalInBackground: true,
  });

  const statuses = data ?? [];

  return {
    statuses,
    isPolling: enabled && !isTerminal(statuses, destinationChainId),
    error: error
      ? error instanceof Error
        ? error.message
        : "Failed to fetch intent status"
      : null,
  };
}
