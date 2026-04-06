import { useState, useCallback, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { buildEVMToMidenIntent } from '../services/epoch-bridge';
import type { EVMToMidenIntentParams, IntentResult } from '../types/miden';

export function useWithdrawIntent() {
  const [withdrawResult, setWithdrawResult] = useState<IntentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const [sdk, setSdk] = useState<any>(null);

  useEffect(() => {
    if (!walletClient) {
      console.log('[Withdraw] No wallet client, SDK not available');
      setSdk(null);
      return;
    }
    let cancelled = false;
    console.log('[Withdraw] Initializing Epoch SDK with real walletClient...');
    import('@epoch-protocol/epoch-intents-sdk').then(({ EpochIntentSDK }) => {
      if (cancelled) return;
      const apiBaseUrl = import.meta.env.VITE_ALLOCATOR_URL || 'http://localhost:3000';
      console.log('[Withdraw] Epoch SDK loaded, creating instance with API:', apiBaseUrl);
      setSdk(new EpochIntentSDK({
        apiBaseUrl,
        walletClient: walletClient as any,
      }));
      console.log('[Withdraw] Epoch SDK ready');
    }).catch((err) => {
      if (cancelled) return;
      console.error('[Withdraw] Failed to load Epoch SDK:', err);
      setSdk(null);
    });
    return () => { cancelled = true; };
  }, [walletClient]);

  const createWithdrawIntent = useCallback(async (params: EVMToMidenIntentParams) => {
    setIsLoading(true);
    setError(null);
    setWithdrawResult(null);

    console.log('[Withdraw] Creating EVM→Miden intent with params:', {
      evmSourceAddress: params.evmSourceAddress,
      evmTokenAddress: params.evmTokenAddress,
      evmAmount: params.evmAmount,
      sourceChainId: params.sourceChainId,
      midenRecipientId: params.midenRecipientId,
      midenFaucetId: params.midenFaucetId.slice(0, 16) + '...',
    });

    try {
      if (!sdk) {
        const msg = 'Epoch SDK not available — connect your wallet';
        setError(msg);
        throw new Error(msg);
      }
      const result = await buildEVMToMidenIntent(sdk, params);
      setWithdrawResult(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create EVM→Miden intent';
      console.error('[Withdraw] Intent creation failed:', err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  return {
    createWithdrawIntent,
    withdrawResult,
    isLoading,
    error,
    isSDKReady: !!sdk,
  };
}
