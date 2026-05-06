import { Button } from '@/components/ui/button';

interface Props {
  isInitializing: boolean;
  error: string | null;
  blockNum: number | null;
  onRetry?: () => void;
}

export function MidenStatus({ isInitializing, error, blockNum, onRetry }: Props) {
  if (isInitializing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        <div
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-amber-600 border-t-transparent"
          aria-hidden
        />
        Initializing Miden WASM client…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-900">
        <span className="min-w-0 flex-1">Error: {error}</span>
        {onRetry && (
          <Button type="button" size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
      <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
      Connected to Miden testnet
      {blockNum !== null && <span className="text-emerald-800/80">Block #{blockNum}</span>}
    </div>
  );
}
