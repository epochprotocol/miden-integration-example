import { useState, useEffect, useCallback, useRef } from 'react';

const ALLOCATOR_URL = import.meta.env.VITE_ALLOCATOR_URL || 'http://localhost:3000';
const POLL_INTERVAL = 5000;

export interface IntentFlowStatus {
  evmCompleted: boolean;
  evmTransactionHash?: string;
  midenConsumed: boolean;
  midenConsumeError?: string;
  retryCount?: number;
}

export function useIntentStatus(userAddress?: string, intentNonce?: string) {
  const [status, setStatus] = useState<IntentFlowStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!userAddress || !intentNonce) return;

    try {
      const res = await fetch(
        `${ALLOCATOR_URL}/miden/status/${encodeURIComponent(userAddress)}/${encodeURIComponent(intentNonce)}`,
      );
      if (!res.ok) return;
      const data: IntentFlowStatus = await res.json();
      setStatus(data);

      // Stop polling when both EVM succeeded and Miden consumed
      if (data.evmCompleted && data.midenConsumed) {
        stopPolling();
      }
    } catch {
      // Silently retry on next interval
    }
  }, [userAddress, intentNonce, stopPolling]);

  useEffect(() => {
    if (!userAddress || !intentNonce) {
      stopPolling();
      setStatus(null);
      return;
    }

    setIsPolling(true);
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => stopPolling();
  }, [userAddress, intentNonce, poll, stopPolling]);

  return {
    status,
    isPolling,
  };
}
