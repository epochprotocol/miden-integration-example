/**
 * Canonical EVM testnet token list for Sepolia (chainId 11155111).
 *
 * NOTE: these are SIO testnet mock contracts. Even tokens that have 6 decimals
 * on mainnet (USDC/USDT) are deployed here with **18 decimals**. Source of
 * truth: `epoch-widget/src/epoch-config.ts` EPOCH_TESTNET_TOKENS.
 *
 * Do NOT use mainnet decimals — `parseUnits` / `formatUnits` against the
 * wrong scale silently mis-formats by 12 orders of magnitude.
 */
export interface EvmToken {
  symbol: string;
  address: string;
  decimals: number;
}

export const SEPOLIA_TESTNET_TOKENS: EvmToken[] = [
  { symbol: 'USDC',  address: '0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69', decimals: 18 },
  { symbol: 'DAI',   address: '0xc30f1Ce05d1434d484E9A47283aA925fc8A8699a', decimals: 18 },
  { symbol: 'USDT',  address: '0xc04d2869665Be874881133943523723Be5782720', decimals: 18 },
  { symbol: 'WETH',  address: '0x7946dd86eE310D0aC16804A37787289Fa5b88A8A', decimals: 18 },
  { symbol: 'WBTC',  address: '0x9b2a2754a9182fD65360E23afCDf3BeFF51796E9', decimals: 18 },
  { symbol: 'PENGU', address: '0xEA7dC9849206Ce73b11c465d37b85eC06B11Cf2C', decimals: 18 },
  { symbol: 'OSWALD',address: '0xB588418c0f90F07Bc9587d0050845a90C23C7502', decimals: 18 },
  { symbol: 'KICK',  address: '0x512Ee6Bd7A4be5Ba4796F15Df080c4D0F89a38eD', decimals: 18 },
  { symbol: 'FERB',  address: '0x145e03A80c19ad1b9d0429d06b6d52707de724A0', decimals: 18 },
];

const BY_ADDR: Map<string, EvmToken> = new Map(
  SEPOLIA_TESTNET_TOKENS.map((t) => [t.address.toLowerCase(), t]),
);

/** Look up token by address (case-insensitive). Returns undefined if unknown. */
export function findEvmToken(address: string | undefined): EvmToken | undefined {
  if (!address) return undefined;
  return BY_ADDR.get(address.trim().toLowerCase());
}

/** Decimals for a known token, or `undefined` if unknown (caller must handle). */
export function getEvmTokenDecimals(address: string | undefined): number | undefined {
  return findEvmToken(address)?.decimals;
}
