import type { IntentResult } from '../../types/miden';
import type { IntentFlowStatus } from '../../hooks/useIntentStatus';

interface Props {
  result: IntentResult | null;
  error: string | null;
  flowStatus: IntentFlowStatus | null;
  isPolling: boolean;
}

function FlowStep({
  step,
  label,
  done,
  active,
}: {
  step: number;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? 'bg-emerald-600 text-white'
            : active
              ? 'bg-amber-500 text-neutral-900'
              : 'bg-neutral-200 text-neutral-500'
        }`}
      >
        {done ? '\u2713' : step}
      </div>
      <span
        className={`text-sm ${done ? 'text-emerald-800' : active ? 'text-amber-800' : 'text-neutral-500'}`}
      >
        {label}
      </span>
      {active && !done && <span className="ml-1 animate-pulse text-xs text-amber-700">…</span>}
    </div>
  );
}

export function IntentStatus({ result, error, flowStatus, isPolling }: Props) {
  if (error) {
    return (
      <div className="ui-card border-red-200 bg-red-50/80">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Intent Error</h2>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!result) return null;

  const p2idSent = true;
  const intentSubmitted = !!result.taskTypeString;
  const evmCompleted = flowStatus?.evmCompleted ?? false;
  const midenConsumed = flowStatus?.midenConsumed ?? false;

  return (
    <div className="ui-card space-y-6">
      <div className="ui-card-muted">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-600">Intent flow</div>
        <div className="space-y-2">
          <FlowStep step={1} label="P2ID note sent to allocator" done={p2idSent} active={false} />
          <FlowStep
            step={2}
            label="Intent submitted to SIO"
            done={intentSubmitted}
            active={p2idSent && !intentSubmitted}
          />
          <FlowStep
            step={3}
            label="EVM execution"
            done={evmCompleted}
            active={intentSubmitted && !evmCompleted}
          />
          <FlowStep
            step={4}
            label="Miden note consumed"
            done={midenConsumed}
            active={evmCompleted && !midenConsumed}
          />
        </div>

        {evmCompleted && !midenConsumed && flowStatus?.midenConsumeError && (
          <p className="mt-3 text-xs text-amber-800">
            Backend consumption retrying: {flowStatus.midenConsumeError}
            {flowStatus.retryCount != null && ` (attempt ${flowStatus.retryCount})`}
          </p>
        )}

        {isPolling && !midenConsumed && (
          <p className="mt-2 text-xs text-neutral-500">Polling for status updates…</p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-emerald-800">
          {result.solveResult ? '\u2713 Intent Executed' : 'Intent Data Generated'}
        </h2>

        <div className="space-y-4">
          <div>
            <div className="ui-label">Task Type String</div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-sm break-all text-neutral-800">
              {result.taskTypeString}
            </div>
          </div>

          <div>
            <div className="ui-label">Intent Data</div>
            <pre className="max-h-80 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-sm text-neutral-800">
              {JSON.stringify(result.intentData, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {result.solveResult && (
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-md mb-3 font-semibold text-primary">Execution Result</h3>

          {result.error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="mb-1 text-sm font-medium text-red-800">Execution Error</div>
              <div className="text-sm text-red-700">{result.error}</div>
            </div>
          )}

          {result.solveResult.resourceLockRequired !== undefined && (
            <div className="ui-card-muted mb-4">
              <div className="ui-label">Resource Lock Required</div>
              <div className="text-sm text-neutral-900">
                {result.solveResult.resourceLockRequired ? '\u2713 Yes' : '\u2717 No'}
              </div>
            </div>
          )}

          {result.solveResult.transactions && result.solveResult.transactions.length > 0 && (
            <div className="ui-card-muted mb-4">
              <div className="ui-label">Transactions ({result.solveResult.transactions.length})</div>
              <div className="space-y-3">
                {result.solveResult.transactions.map((tx, idx) => (
                  <div key={idx} className="rounded-lg border border-neutral-200 bg-white p-3">
                    <div className="mb-1 text-xs text-neutral-500">Transaction {idx + 1}</div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-neutral-600">To:</span>{' '}
                        <span className="font-mono text-neutral-900">{tx.to}</span>
                      </div>
                      {tx.value && (
                        <div>
                          <span className="text-neutral-600">Value:</span>{' '}
                          <span className="text-neutral-900">{tx.value}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-neutral-600">Data:</span>{' '}
                        <span className="break-all font-mono text-neutral-900">{tx.data.slice(0, 66)}…</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.solveResult.compact && (
            <div className="ui-card-muted mb-4">
              <div className="ui-label">Compact Details</div>
              <pre className="overflow-x-auto font-mono text-xs text-neutral-800">
                {JSON.stringify(result.solveResult.compact, null, 2)}
              </pre>
            </div>
          )}

          {result.solveResult.hash && (
            <div className="ui-card-muted">
              <div className="ui-label">Transaction Hash</div>
              <div className="break-all font-mono text-sm text-neutral-900">{result.solveResult.hash}</div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-neutral-100/80 p-3 text-xs text-neutral-600">
        <strong className="text-neutral-800">How it works:</strong> The P2ID note locks your Miden tokens. The
        allocator takes this intent data and submits it to SIO via The Compact. A solver fulfills the output
        token delivery on the destination EVM chain. Once fulfilled, the allocator consumes the P2ID note to
        claim the Miden-side funds.
      </div>
    </div>
  );
}
