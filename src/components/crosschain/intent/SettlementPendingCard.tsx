interface Props {
  statusLabel?: string;
}

export function SettlementPendingCard({ statusLabel }: Props) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-amber-700"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Waiting for EVM execution
          </div>
          <div className="mt-0.5 text-[12px] text-amber-900">
            {statusLabel
              ? `Status: ${statusLabel} · polling every 5s…`
              : "Solver picking up intent · polling every 5s…"}
          </div>
        </div>
      </div>
    </div>
  );
}
