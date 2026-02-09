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
    if (!walletClient) { setSdk(null); return; }
    import('@epoch-protocol/epoch-intents-sdk').then(({ EpochIntentSDK }) => {
      // Cast walletClient to any — the SDK symlink uses its own viem types
      setSdk(new EpochIntentSDK({
        apiBaseUrl: 'https://the-compact-allocator-api.vercel.app',
        walletClient: walletClient as any,
      }));
    }).catch(() => setSdk(null));
  }, [walletClient]);

  const createIntent = useCallback(async (params: CrossChainIntentParams) => {
    setIsLoading(true);
    setError(null);
    setIntentResult(null);
    try {
      if (sdk) {
        // Real SDK path: build task data through Epoch SDK
        const result = await buildCrossChainIntent(sdk, params);
        setIntentResult(result);
        return result;
      } else {
        // Fallback: show what the intent data would look like without SDK
        const taskDataParams = buildEpochTaskDataParams(params);
        const mockResult: IntentResult = {
          taskTypeString: 'address tokenIn,uint256 tokenInAmount,address tokenOut,uint256 minTokenOut,uint256 destinationChainId,bytes4 taskType,bytes32 protocolHashIdentifier,address recipient,string midenSourceAccount,string midenFaucetId,string midenNoteType',
          intentData: taskDataParams.intentData as unknown as Record<string, unknown>,
        };
        setIntentResult(mockResult);
        return mockResult;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create cross-chain intent';
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
