import {
  formatQuoteTokenIn,
  getMandateSalt,
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

/**
 * This leg registers a Compact on the EVM chain, so its claim hash is public
 * forever. Surfacing the salt makes visible that the hash cannot be matched back
 * to a guessed amount and Miden account.
 */
function MandateSaltNote({ salt }: { salt: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
        Privacy salt
      </p>
      <p
        className="mt-0.5 font-mono text-xs text-emerald-900 truncate"
        title={salt}
      >
        {salt}
      </p>
      <p className="mt-1 text-xs text-emerald-800">
        Bound into the on-chain claim hash so observers cannot confirm this
        intent's amount or Miden account by guessing.
      </p>
    </div>
  );
}

export function WithdrawQuoteSummary({
  quote,
  displayDecimals,
  fallbackSymbol,
  onClearQuote,
}: Props) {
  const salt = getMandateSalt(quote.intentData);

  return (
    <QuoteSummaryCard
      amountText={formatRequiredDeposit(quote, displayDecimals, fallbackSymbol)}
      walletNoun="EVM"
      clearLabel="Clear quote"
      onClear={onClearQuote}
      detail={salt ? <MandateSaltNote salt={salt} /> : undefined}
    />
  );
}
