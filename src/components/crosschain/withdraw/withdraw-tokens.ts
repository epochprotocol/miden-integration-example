import {
  EPOCH_TESTNET_TOKENS,
  type EvmToken,
} from "../../../constants/evm-tokens";

// Native ETH and SIO testnet mocks use 18 decimals — even
// tokens that have 6 decimals on mainnet (USDC/USDT). See `constants/evm-tokens.ts`.
export const WITHDRAW_TOKENS: EvmToken[] = [
  ...EPOCH_TESTNET_TOKENS,
  { symbol: "Custom", address: "", decimals: 18 },
];

/** Radix Select rejects empty values, so the Custom row needs a sentinel. */
export const TOKEN_CUSTOM = "__custom__";

export const CUSTOM_TOKEN_DEFAULT_DECIMALS = 18;
