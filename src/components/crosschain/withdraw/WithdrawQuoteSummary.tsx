import {
  formatQuoteTokenIn,
  type EVMToMidenQuote,
} from "../../../services/epoch-bridge";
import { QuoteSummaryCard } from "../QuoteSummaryCard";

interface Props {
  quote: EVMToMidenQuote;
  displayDecimals: number;
  /** Used when the quote itself doesn't name the token. */
  fallbackSymbol?: string;
  onClearQuote: () => void;
}

function formatRequiredDeposit(
  quote: EVMToMidenQuote,
  displayDecimals: number,
  fallbackSymbol?: string,
): string {
  const amount =
    formatQuoteTokenIn(quote.quoteResult.tokenIn, displayDecimals) ||
    "calculated at execution";
  const symbol = quote.quoteResult.tokenInSymbol ?? fallbackSymbol ?? "tokens";
  return `${amount} ${symbol}`;
}

export function WithdrawQuoteSummary({
  quote,
  displayDecimals,
  fallbackSymbol,
  onClearQuote,
}: Props) {
  return (
    <QuoteSummaryCard
      amountText={formatRequiredDeposit(quote, displayDecimals, fallbackSymbol)}
      walletNoun="EVM"
      clearLabel="Clear quote"
      onClear={onClearQuote}
    />
  );
}
