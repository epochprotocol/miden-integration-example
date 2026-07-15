import type { CrossChainQuote } from "../../../services/epoch-bridge";
import { formatQuoteTokenIn } from "../../../services/epoch-bridge";
import { QuoteSummaryCard } from "../QuoteSummaryCard";

interface Props {
  quote: CrossChainQuote;
  /** `undefined` when the faucet isn't in the known-decimals map — show raw. */
  faucetDecimals: number | undefined;
  assetSymbol?: string;
  onRequote: () => void;
}

function formatRequiredDeposit(
  quote: CrossChainQuote,
  faucetDecimals: number | undefined,
  assetSymbol?: string,
): string {
  const tokenInRaw = quote.quoteResult.tokenIn;
  if (!tokenInRaw) return "calculated at execution";
  if (faucetDecimals === undefined) return tokenInRaw;
  return `${formatQuoteTokenIn(tokenInRaw, faucetDecimals)} ${assetSymbol ?? "tokens"}`;
}

export function IntentQuoteSummary({
  quote,
  faucetDecimals,
  assetSymbol,
  onRequote,
}: Props) {
  return (
    <QuoteSummaryCard
      amountText={formatRequiredDeposit(quote, faucetDecimals, assetSymbol)}
      walletNoun="Miden"
      clearLabel="Re-quote"
      onClear={onRequote}
    />
  );
}
