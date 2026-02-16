import type { CrossChainIntentParams, IntentResult } from '../types/miden';

/**
 * Cross-chain bridge architecture using P2ID notes:
 *
 * 1. User creates a P2ID note on Miden targeting the trusted allocator service
 * 2. The allocator service (holding the P2ID note) builds an Epoch intent via SIO
 * 3. SIO solver fulfills the intent on the destination EVM chain
 * 4. On successful execution, the allocator consumes the P2ID note (claiming the Miden funds)
 * 5. If the intent fails/expires, the P2ID note can be recalled by the user
 *
 * This keeps funds locked in a P2ID note (not custodied) until the cross-chain
 * intent is fulfilled — privacy-preserving on the Miden side, trustless on EVM side.
 */

// The allocator's Miden account ID — in production this would be a known trusted service
// Note: This is a placeholder. For demo purposes, you can use one of your wallet IDs,
// or in production this would be the allocator service's actual Miden account.
export const ALLOCATOR_MIDEN_ACCOUNT_ID = '0x875c92a52466351061e4a89278aec9'; // placeholder - replace with real account ID

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function buildEpochTaskDataParams(params: CrossChainIntentParams) {
  console.log('[EpochBridge] Building task data params from:', {
    midenAccountId: params.midenAccountId,
    midenFaucetId: params.midenFaucetId.slice(0, 16) + '...',
    midenAmount: params.midenAmount,
    evmRecipient: params.evmRecipient,
    destinationChainId: params.destinationChainId,
  });

  // Determine the output token address — must be a valid EVM token on the destination chain
  const outputToken = params.outputTokenAddress || ZERO_ADDRESS;
  // isNative=true forces tokenIn AND tokenOut to zero address in the SDK.
  // For Miden cross-chain, we need tokenOut to be a real EVM token, so set isNative=false
  // and pass the actual addresses directly.
  const hasValidOutputToken = outputToken !== ZERO_ADDRESS;

  const taskDataParams = {
    taskType: 'gettokenout' as const,
    intentData: {
      isNative: !hasValidOutputToken,
      depositTokenAddress: ZERO_ADDRESS, // tokenIn is always zero (Miden-sourced)
      tokenInAmount: params.midenAmount,
      outputTokenAddress: outputToken,
      minTokenOut: params.minTokenOut,
      destinationChainId: String(params.destinationChainId),
      protocolHashIdentifier: ZERO_HASH,
      recipient: params.evmRecipient,
    },
    extraDataTypestring: 'string midenSourceAccount,string midenFaucetId,string midenNoteType',
    extraData: {
      midenSourceAccount: params.midenAccountId,
      midenFaucetId: params.midenFaucetId,
      midenNoteType: 'P2ID',
    },
  };

  console.log('[EpochBridge] Task data params built:', taskDataParams);
  return taskDataParams;
}

export async function buildCrossChainIntent(
  sdk: any,
  params: CrossChainIntentParams,
): Promise<IntentResult> {
  console.log('[EpochBridge] Starting cross-chain intent build via Epoch SDK...');
  const taskDataParams = buildEpochTaskDataParams(params);

  console.log('[EpochBridge] Step 1: Calling SDK.getTaskData()...');
  const { taskTypeString, intentData } = await sdk.getTaskData(taskDataParams);
  console.log('[EpochBridge] SDK.getTaskData() response:', { taskTypeString, intentData });

  // Step 2: Solve the intent (submits to smallocator and executes on-chain)
  console.log('[EpochBridge] Step 2: Calling SDK.solveIntent()...');
  console.log('[EpochBridge] solveIntent params:', {
    isNative: taskDataParams.intentData.isNative,
    sponsorAddress: params.evmRecipient,
    taskTypeString,
    intentData,
  });

  try {
    const solveResult = await sdk.solveIntent({
      isNative: taskDataParams.intentData.isNative,
      sponsorAddress: params.evmRecipient,
      taskTypeString,
      intentData,
    });

    console.log('[EpochBridge] SDK.solveIntent() response:', solveResult);

    return {
      taskTypeString,
      intentData,
      solveResult, // Include the full execution result
    };
  } catch (err) {
    console.error('[EpochBridge] solveIntent failed:', err);
    // Still return the task data even if solve fails
    return {
      taskTypeString,
      intentData,
      error: err instanceof Error ? err.message : 'Failed to solve intent',
    };
  }
}
