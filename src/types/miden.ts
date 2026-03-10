export interface MidenAccount {
  id: string;
  label: string;
  type: 'wallet' | 'faucet';
}

export interface MidenFaucetInfo extends MidenAccount {
  type: 'faucet';
  symbol: string;
  decimals: number;
  maxSupply: string;
}

export interface VaultAsset {
  faucetId: string;
  amount: string;
}

export interface CrossChainIntentParams {
  midenAccountId: string;
  midenFaucetId: string;
  midenAmount: string;
  midenDecimals?: number;
  /** Optional absolute reclaim height (block number) for P2IDE notes */
  midenReclaimHeight?: number;
  evmRecipient: string;
  destinationChainId: number;
  outputTokenAddress: string;
  minTokenOut: string;
}

export interface EVMToMidenIntentParams {
  evmSourceAddress: string;
  evmTokenAddress: string;
  evmAmount: string;
  evmTokenDecimals?: number;
  sourceChainId: number;
  midenRecipientId: string;
  midenFaucetId: string;
  midenDecimals?: number;
}

export interface IntentResult {
  taskTypeString: string;
  intentData: Record<string, unknown>;
  solveResult?: {
    resourceLockRequired?: boolean;
    transactions?: Array<{
      to: string;
      data: string;
      value?: string;
    }>;
    compact?: any;
    hash?: string;
    nonce?: string;
  };
  error?: string;
  /** The intent nonce used for status tracking (userAddress:intentNonce in SIO) */
  intentNonce?: string;
}
