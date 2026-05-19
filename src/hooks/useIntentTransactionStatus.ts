import { useCallback, useEffect, useRef, useState } from 'react';
import { useWalletClient } from 'wagmi';
import type { IntentTransactionStatus } from '@epoch-protocol/epoch-intents-sdk/dist/types';

const POLL_INTERVAL = 5000;

const TERMINAL_STATUSES = new Set(['success', 'completed', 'failed', 'reverted']);

function isTerminal(
  statuses: IntentTransactionStatus[],
  destinationChainId?: number,
): boolean {
  if (statuses.length === 0) return false;
  // When destinationChainId is provided, only stop polling once ALL
  // destination-chain rows are terminal. SIO can list a prior-step success
  // alongside a pending user-settlement row on the same chain — stopping at
  // the first success would hide the in-flight tx. Internal rows on other
  // chains (e.g. Compact-claim on Base Sepolia 84532) are ignored.
  if (destinationChainId != null) {
    const destRows = statuses.filter((s) => Number(s.chainId) === destinationChainId);
    if (destRows.length === 0) return false;
    return destRows.every((s) => TERMINAL_STATUSES.has(String(s.status).toLowerCase()));
  }
  return statuses.every((s) => TERMINAL_STATUSES.has(String(s.status).toLowerCase()));
}

export function useIntentTransactionStatus(
  userAddress?: string,
  intentNonce?: string,
  destinationChainId?: number,
) {
  const [statuses, setStatuses] = useState<IntentTransactionStatus[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdk, setSdk] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (!walletClient) {
      setSdk(null);
      return;
    }
    let cancelled = false;
    const apiBaseUrl = import.meta.env.VITE_ALLOCATOR_URL || 'http://localhost:3000';
    import('@epoch-protocol/epoch-intents-sdk')
      .then(({ EpochIntentSDK }) => {
        if (cancelled) return;
        setSdk(new EpochIntentSDK({ apiBaseUrl, walletClient: walletClient as any }));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[useIntentTransactionStatus] SDK load failed:', err);
        setSdk(null);
      });
    return () => {
      cancelled = true;
    };
  }, [walletClient]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!sdk || !userAddress || !intentNonce) return;
    try {
      const result: IntentTransactionStatus[] = await sdk.getIntentStatus(userAddress, intentNonce);
      const arr = Array.isArray(result) ? result : [];
      setStatuses(arr);
      setError(null);
      if (isTerminal(arr, destinationChainId)) stopPolling();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch intent status';
      console.error('[useIntentTransactionStatus] poll error:', err);
      setError(msg);
    }
  }, [sdk, userAddress, intentNonce, destinationChainId, stopPolling]);

  useEffect(() => {
    if (!sdk || !userAddress || !intentNonce) {
      stopPolling();
      setStatuses([]);
      return;
    }
    setIsPolling(true);
    void poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => stopPolling();
  }, [sdk, userAddress, intentNonce, poll, stopPolling]);

  return { statuses, isPolling, error, refetch: poll };
}
