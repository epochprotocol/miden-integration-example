interface Props {
  isInitializing: boolean;
  error: string | null;
  blockNum: number | null;
  onRetry?: () => void;
}

export function MidenStatus({ isInitializing, error, blockNum, onRetry }: Props) {
  if (isInitializing) {
    return (
      <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-lg text-sm">
        <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        Initializing Miden WASM client...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-sm">
        <span>Error: {error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg text-sm">
      <div className="w-2 h-2 bg-green-400 rounded-full" />
      Connected to Miden Testnet
      {blockNum !== null && (
        <span className="text-gray-400 ml-2">Block #{blockNum}</span>
      )}
    </div>
  );
}
