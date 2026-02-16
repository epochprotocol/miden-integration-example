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
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-green-400 mb-4">
          {result.solveResult ? '✓ Intent Executed' : 'Intent Data Generated'}
        </h2>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Task Type String</div>
            <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 font-mono break-all">
              {result.taskTypeString}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 mb-1">Intent Data</div>
            <pre className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 font-mono overflow-x-auto">
              {JSON.stringify(result.intentData, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {result.solveResult && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-md font-semibold text-purple-400 mb-3">Execution Result</h3>

          {result.error && (
            <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 mb-4">
              <div className="text-sm font-medium text-red-400 mb-1">Execution Error</div>
              <div className="text-sm text-red-300">{result.error}</div>
            </div>
          )}

          {result.solveResult.resourceLockRequired !== undefined && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-400 mb-1">Resource Lock Required</div>
              <div className="text-sm text-white">
                {result.solveResult.resourceLockRequired ? '✓ Yes' : '✗ No'}
              </div>
            </div>
          )}

          {result.solveResult.transactions && result.solveResult.transactions.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-400 mb-2">
                Transactions ({result.solveResult.transactions.length})
              </div>
              <div className="space-y-3">
                {result.solveResult.transactions.map((tx, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Transaction {idx + 1}</div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400">To:</span>{' '}
                        <span className="text-white font-mono">{tx.to}</span>
                      </div>
                      {tx.value && (
                        <div>
                          <span className="text-gray-400">Value:</span>{' '}
                          <span className="text-white">{tx.value}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Data:</span>{' '}
                        <span className="text-white font-mono break-all">
                          {tx.data.slice(0, 66)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.solveResult.compact && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-400 mb-2">Compact Details</div>
              <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                {JSON.stringify(result.solveResult.compact, null, 2)}
              </pre>
            </div>
          )}

          {result.solveResult.hash && (
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
              <div className="text-sm text-white font-mono break-all">
                {result.solveResult.hash}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-700/30 rounded-lg p-3 text-xs text-gray-400">
        <strong className="text-gray-300">How it works:</strong> The P2ID note locks your Miden tokens.
        The allocator takes this intent data and submits it to SIO via The Compact.
        A solver fulfills the output token delivery on the destination EVM chain.
        Once fulfilled, the allocator consumes the P2ID note to claim the Miden-side funds.
      </div>
    </div>
  );
}
