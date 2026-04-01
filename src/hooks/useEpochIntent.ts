import { useState, useCallback, useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { buildCrossChainIntent } from '../services/epoch-bridge';
import type { CrossChainIntentParams, IntentResult } from '../types/miden';

export function useEpochIntent() {

  const [intentResult, setIntentResult] = useState<IntentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [sdk, setSdk] = useState<any>(null);

  const { data: walletClient } = useWalletClient();

  useMemo(() => {
    if (!walletClient) {
      console.log('[CrossChain] No EVM wallet client, SDK not available');
      setSdk(null);
      return;
    }
    console.log('[CrossChain] Initializing Epoch SDK...');
    import('@epoch-protocol/epoch-intents-sdk').then(({ EpochIntentSDK }) => {
      const apiBaseUrl = import.meta.env.VITE_ALLOCATOR_URL || 'http://localhost:3000';
      console.log('[CrossChain] Epoch SDK loaded, creating instance with API:', apiBaseUrl);
      // Cast walletClient to any — the SDK symlink uses its own viem types.
      setSdk(new EpochIntentSDK({
        apiBaseUrl,
        walletClient: walletClient as any,
      }));
      console.log('[CrossChain] Epoch SDK ready');
    }).catch((err) => {
      console.error('[CrossChain] Failed to load Epoch SDK:', err);
      setSdk(null);
    });
  }, [walletClient]);

  const createIntent = useCallback(async (params: CrossChainIntentParams) => {
    setIsLoading(true);
    setError(null);
    setIntentResult(null);

    console.log('[CrossChain] Creating intent with params:', {
      midenAccountId: params.midenAccountId,
      midenFaucetId: params.midenFaucetId.slice(0, 16) + '...',
      midenAmount: params.midenAmount,
      evmRecipient: params.evmRecipient,
      destinationChainId: params.destinationChainId,
      outputTokenAddress: params.outputTokenAddress,
      minTokenOut: params.minTokenOut,
    });

    try {
      if (!sdk) {
        throw new Error(
          'Epoch SDK is not ready. Connect your EVM wallet above, wait for it to initialize, or check the console if the SDK failed to load.',
        );
      }
      console.log('[CrossChain] Using Epoch SDK to build intent...');
      const result = await buildCrossChainIntent(sdk, params);
      console.log('[CrossChain] Intent created via SDK:', result);
      setIntentResult(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create cross-chain intent';
      console.error('[CrossChain] Intent creation failed:', err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  return {
    createIntent,
    intentResult,
    isLoading,
    error,
    isSDKReady: !!sdk,
  };
}
