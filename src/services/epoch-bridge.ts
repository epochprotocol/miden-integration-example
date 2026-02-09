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
export const ALLOCATOR_MIDEN_ACCOUNT_ID = '0x0000000000000000'; // placeholder

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function buildEpochTaskDataParams(params: CrossChainIntentParams) {
  return {
    taskType: 'gettokenout' as const,
    intentData: {
      isNative: true,
      // On the EVM side, the deposit token is native ETH (the allocator bridges value)
      depositTokenAddress: ZERO_ADDRESS,
      tokenInAmount: params.midenAmount,
      outputTokenAddress: params.outputTokenAddress || ZERO_ADDRESS,
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
}

export async function buildCrossChainIntent(
  sdk: any,
  params: CrossChainIntentParams,
): Promise<IntentResult> {
  const taskDataParams = buildEpochTaskDataParams(params);
  const result = await sdk.getTaskData(taskDataParams);
  return result;
}
