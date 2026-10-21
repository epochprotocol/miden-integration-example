import { EPOCH_EVM_TOKENS, type EvmToken } from "../../../constants/evm-tokens";

export const WITHDRAW_TOKENS: EvmToken[] = [
  ...EPOCH_EVM_TOKENS,
  { symbol: "Custom", address: "", decimals: 18 },
];

/** Radix Select rejects empty values, so the Custom row needs a sentinel. */
export const TOKEN_CUSTOM = "__custom__";

export const CUSTOM_TOKEN_DEFAULT_DECIMALS = 18;
