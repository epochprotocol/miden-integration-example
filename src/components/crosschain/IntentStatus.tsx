import type { IntentResult } from '../../types/miden';

interface Props {
  result: IntentResult | null;
  error: string | null;
}

export function IntentStatus({ result, error }: Props) {
  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Intent Error</h2>
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-green-400 mb-4">Intent Data</h2>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Task Type String</div>
          <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 font-mono break-all">
            {result.taskTypeString}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Intent Data (what the allocator sends to SIO)</div>
          <pre className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 font-mono overflow-x-auto">
            {JSON.stringify(result.intentData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-3 text-xs text-gray-400">
          <strong className="text-gray-300">How it works:</strong> The P2ID note locks your Miden tokens.
          The allocator takes this intent data and submits it to SIO via The Compact.
          A solver fulfills the output token delivery on the destination EVM chain.
          Once fulfilled, the allocator consumes the P2ID note to claim the Miden-side funds.
        </div>
      </div>
    </div>
  );
}
