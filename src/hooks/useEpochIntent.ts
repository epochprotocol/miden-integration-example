import { useState, useCallback, useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { buildCrossChainIntent, buildEpochTaskDataParams, ALLOCATOR_MIDEN_ACCOUNT_ID } from '../services/epoch-bridge';
import type { CrossChainIntentParams, IntentResult } from '../types/miden';

export function useEpochIntent() {
  const { data: walletClient } = useWalletClient();
  const [intentResult, setIntentResult] = useState<IntentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sdk, setSdk] = useState<any>(null);

  useMemo(() => {
    if (!walletClient) {
      console.log('[CrossChain] No wallet client, SDK not available');
      setSdk(null);
      return;
    }
    console.log('[CrossChain] Initializing Epoch SDK...');
    import('@epoch-protocol/epoch-intents-sdk').then(({ EpochIntentSDK }) => {
      // Use local smallocator in development, production allocator in prod
      const apiBaseUrl = import.meta.env.VITE_ALLOCATOR_URL || 'http://localhost:3000';
      console.log('[CrossChain] Epoch SDK loaded, creating instance with API:', apiBaseUrl);
      // Cast walletClient to any — the SDK symlink uses its own viem types
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
      if (sdk) {
        console.log('[CrossChain] Using Epoch SDK to build intent...');
        const result = await buildCrossChainIntent(sdk, params);
        console.log('[CrossChain] Intent created via SDK:', result);
        setIntentResult(result);
        return result;
      } else {
        console.log('[CrossChain] SDK not available, generating mock intent data...');
        const taskDataParams = buildEpochTaskDataParams(params);
        console.log('[CrossChain] Task data params:', taskDataParams);
        const mockResult: IntentResult = {
          taskTypeString: 'address tokenIn,uint256 tokenInAmount,address tokenOut,uint256 minTokenOut,uint256 destinationChainId,bytes4 taskType,bytes32 protocolHashIdentifier,address recipient,string midenSourceAccount,string midenFaucetId,string midenNoteType',
          intentData: taskDataParams.intentData as unknown as Record<string, unknown>,
        };
        console.log('[CrossChain] Mock intent result:', mockResult);
        setIntentResult(mockResult);
        return mockResult;
      }
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
    allocatorAccountId: ALLOCATOR_MIDEN_ACCOUNT_ID,
  };
}
