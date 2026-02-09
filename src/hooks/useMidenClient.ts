import { useState, useEffect, useCallback } from 'react';
import { initMiden, terminateMidenClient } from '../services/miden-client';

export function useMidenClient() {
  const [client, setClient] = useState<any>(null);
  const [prover, setProver] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncHeight, setSyncHeight] = useState<number | null>(null);

  const init = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const result = await initMiden();
      setClient(result.client);
      setProver(result.prover);

      const state = await result.client.syncState();
      setSyncHeight(state.blockNum());
    } catch (err) {
      console.error('[Miden] Init failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Miden client');
      terminateMidenClient();
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    init();
    // Don't terminate on unmount — the singleton persists across StrictMode remounts
  }, [init]);

  const retry = useCallback(() => {
    terminateMidenClient();
    init();
  }, [init]);

  return { client, prover, isInitializing, error, syncHeight, retry };
}
