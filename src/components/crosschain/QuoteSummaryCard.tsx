interface Props {
  amountText: string;
  /** "Miden" or "EVM" — which wallet must hold the funds. */
  walletNoun: string;
  clearLabel: string;
  onClear: () => void;
}

export function QuoteSummaryCard({
  amountText,
  walletNoun,
  clearLabel,
  onClear,
}: Props) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-900">Quote</span>
        <button
          type="button"
          className="text-xs text-neutral-500 underline"
          onClick={onClear}
        >
          {clearLabel}
        </button>
      </div>
      <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-orange-700">
          Required deposit
        </p>
        <p className="mt-1 font-mono text-xl font-semibold text-orange-900">
          {amountText}
        </p>
      </div>
      <p className="text-xs text-neutral-500 italic">
        Keep at least this amount in your {walletNoun} wallet before confirming.
      </p>
    </div>
  );
}
