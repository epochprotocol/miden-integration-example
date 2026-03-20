import { parseUnits } from 'viem';
import type { CrossChainIntentParams, EVMToMidenIntentParams, IntentResult } from '../types/miden';
import type { EpochIntentSDK } from '@epoch-protocol/epoch-intents-sdk';
import type {
  CollateralType,
  GetTaskDataParams,
  SolveIntentParams,
  TaskType,
} from '@epoch-protocol/epoch-intents-sdk/dist/types';

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

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function buildEpochTaskDataParams(params: CrossChainIntentParams): GetTaskDataParams {
  console.log('[EpochBridge] Building task data params from:', {
    midenAccountId: params.midenAccountId,
    midenFaucetId: params.midenFaucetId.slice(0, 16) + '...',
    midenAmount: params.midenAmount,
    evmRecipient: params.evmRecipient,
    destinationChainId: params.destinationChainId,
    midenReclaimHeight: params.midenReclaimHeight,
  });

  // Determine the output token address — must be a valid EVM token on the destination chain
  const outputToken = params.outputTokenAddress || ZERO_ADDRESS;
  // isNative=true forces tokenIn AND tokenOut to zero address in the SDK.
  // For Miden cross-chain, we need tokenOut to be a real EVM token, so set isNative=false
  // and pass the actual addresses directly.
  const hasValidOutputToken = outputToken !== ZERO_ADDRESS;

  // Convert human-readable Miden amount to smallest unit (e.g. "1" with 12 decimals → "1000000000000")
  const midenDecimals = params.midenDecimals ?? 8;
  const amountInSmallestUnit = parseUnits(params.midenAmount, midenDecimals).toString();

  console.log('[EpochBridge] Miden amount conversion:', {
    humanAmount: params.midenAmount,
    decimals: midenDecimals,
    amountInSmallestUnit,
  });

  const taskDataParams = {
    taskType: 'gettokenout' as TaskType,
    intentData: {
      isNative: !hasValidOutputToken,
      depositTokenAddress: ZERO_ADDRESS, // tokenIn is always zero (Miden-sourced)
      tokenInAmount: amountInSmallestUnit,
      outputTokenAddress: outputToken,
      minTokenOut: params.minTokenOut,
      destinationChainId: String(params.destinationChainId),
      protocolHashIdentifier: ZERO_HASH,
      recipient: params.evmRecipient,
    },
    extraDataTypestring: 'string midenSourceAccount,string midenFaucetId,string midenNoteType,string midenNoteId,uint256 midenDecimals,uint256 midenReclaimHeight',
    extraData: {
      midenSourceAccount: params.midenAccountId,
      midenFaucetId: params.midenFaucetId,
      midenNoteType: 'P2IDE',
      midenNoteId: '',
      midenDecimals: String(params.midenDecimals ?? 8),
      midenReclaimHeight: params.midenReclaimHeight != null
        ? String(params.midenReclaimHeight)
        : '0',
    },
  };

  console.log('[EpochBridge] Task data params built:', taskDataParams);
  return taskDataParams;
}

export function buildEVMToMidenTaskDataParams(params: EVMToMidenIntentParams) {
  console.log('[EpochBridge] Building EVM→Miden task data params from:', {
    evmSourceAddress: params.evmSourceAddress,
    evmTokenAddress: params.evmTokenAddress,
    evmAmount: params.evmAmount,
    sourceChainId: params.sourceChainId,
    midenRecipientId: params.midenRecipientId,
    midenFaucetId: params.midenFaucetId.slice(0, 16) + '...',
  });

  // Convert human-readable amount to wei (e.g. "1" USDT → "1000000000000000000" for 18 decimals)
  const evmDecimals = params.evmTokenDecimals ?? 18;
  const amountInWei = parseUnits(params.evmAmount, evmDecimals).toString();

  console.log('[EpochBridge] Amount conversion:', {
    humanAmount: params.evmAmount,
    decimals: evmDecimals,
    amountInWei,
  });

  const taskDataParams = {
    taskType: 'gettokenout' as TaskType,
    intentData: {
      isNative: false,
      depositTokenAddress: params.evmTokenAddress,
      tokenInAmount: amountInWei,
      outputTokenAddress: ZERO_ADDRESS,
      minTokenOut: '0',
      destinationChainId: '0',
      protocolHashIdentifier: ZERO_HASH,
      recipient: params.evmSourceAddress,
    },
    extraDataTypestring: 'string midenRecipientAccount,string midenFaucetId,string midenNoteType,uint256 midenDecimals',
    extraData: {
      midenRecipientAccount: params.midenRecipientId,
      midenFaucetId: params.midenFaucetId,
      midenNoteType: 'P2ID',
      midenDecimals: String(params.midenDecimals ?? 8),
    },
  };

  console.log('[EpochBridge] EVM→Miden task data params built:', taskDataParams);
  return taskDataParams;
}

export async function buildEVMToMidenIntent(
  sdk: EpochIntentSDK,
  params: EVMToMidenIntentParams,
): Promise<IntentResult> {
  const taskDataParams = buildEVMToMidenTaskDataParams(params);
  const { taskTypeString, intentData } = await sdk.getTaskData(taskDataParams);
  console.log('[EpochBridge] SDK.getTaskData() response:', { taskTypeString, intentData });

  try {
    const solveResult = await sdk.solveIntent({
      isNative: false,
      sponsorAddress: params.evmSourceAddress as `0x${string}`,
      taskTypeString,
      intentData,
      collateralType: 'evm' as CollateralType,
    });

    console.log('[EpochBridge] SDK.solveIntent() response:', solveResult);
    return { taskTypeString, intentData, solveResult };
  } catch (err) {
    console.error('[EpochBridge] EVM→Miden solveIntent failed:', err);
    return {
      taskTypeString,
      intentData,
      error: err instanceof Error ? err.message : 'Failed to solve EVM→Miden intent',
    };
  }
}

export async function buildCrossChainIntent(
  sdk: EpochIntentSDK,
  params: CrossChainIntentParams & {
    collateralType?: CollateralType;
    midenSourceAccount?: string;
    createMidenP2IDNote?: SolveIntentParams['createMidenP2IDNote'];
  },
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
      sponsorAddress: params.evmRecipient as `0x${string}`,
      taskTypeString,
      intentData,
      collateralType: (params.collateralType ?? 'miden') as CollateralType,
      midenFaucetId: params.midenFaucetId,
      midenSourceAccount: params.midenSourceAccount || params.midenAccountId,
      createMidenP2IDNote: params.createMidenP2IDNote,
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
