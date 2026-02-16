import { useState, useEffect, useCallback } from 'react';
import { initMiden, terminateMidenClient } from '../services/miden-client';
import type { TransactionProver, WebClient } from '@miden-sdk/miden-sdk';
// import type { WebClient, TransactionProver } from '../types/miden-sdk';

interface UseMidenClientReturn {
  client: WebClient | null;
  prover: TransactionProver | null;
  isInitializing: boolean;
  error: string | null;
  blockNum: number | null;
  retry: () => void;
}

/**
 * React hook for managing Miden WASM client lifecycle.
 * Initializes the client on mount and provides retry functionality.
 *
 * IMPORTANT: The client is a singleton that persists across React StrictMode
 * double-mounts. We do NOT terminate on unmount to avoid killing the WASM worker.
 */
export function useMidenClient(): UseMidenClientReturn {
  const [client, setClient] = useState<WebClient | null>(null);
  const [prover, setProver] = useState<TransactionProver | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockNum, setBlockNum] = useState<number | null>(null);

  const init = useCallback(async () => {
    setIsInitializing(true);
    setError(null);

    try {
      const result = await initMiden();
      setClient(result.client);
      setProver(result.prover);

      const state = await result.client.syncState();
      setBlockNum(state.blockNum());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Miden client';
      console.error('[Miden] Init error:', err);
      setError(message);
      terminateMidenClient();
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    init();
    // Don't terminate on unmount — singleton persists across StrictMode remounts
  }, [init]);

  const retry = useCallback(() => {
    terminateMidenClient();
    init();
  }, [init]);

  return { client, prover, isInitializing, error, blockNum, retry };
}
