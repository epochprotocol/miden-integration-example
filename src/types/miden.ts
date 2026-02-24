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
  evmRecipient: string;
  destinationChainId: number;
  outputTokenAddress: string;
  minTokenOut: string;
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
