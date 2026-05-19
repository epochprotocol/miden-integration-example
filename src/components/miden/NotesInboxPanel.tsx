import { useMemo, useState } from 'react';
import type { AccountHeader } from '@miden-sdk/react';
import { useAccounts, useConsume, useNotes } from '@miden-sdk/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';

function headerId(h: AccountHeader): string {
  return h.id().toString();
}

export function NotesInboxPanel() {
  const { wallets, isLoading: accountsLoading, error: accountsError } = useAccounts();
  const [pickedAccountId, setPickedAccountId] = useState<string | null>(null);

  const defaultAccountId = useMemo(
    () => (wallets.length > 0 ? headerId(wallets[0]) : ''),
    [wallets],
  );
  const accountId = pickedAccountId ?? defaultAccountId;

  const { notes, consumableNotes, noteSummaries, refetch, isLoading, error } = useNotes(
    { status: 'committed', accountId },
  );

  const { consume, isLoading: isConsuming, error: consumeError, reset: resetConsume } = useConsume();

  const handleConsumeAll = async () => {
    if (!accountId || consumableNotes.length === 0) return;
    resetConsume();
    await consume({
      accountId,
      notes: consumableNotes.map((n) => n.inputNoteRecord().id().toString()),
    });
    await refetch();
  };

  if (accountsLoading) {
    return <div className="ui-card text-sm text-neutral-600">Loading accounts…</div>;
  }

  if (accountsError) {
    return <div className="ui-card text-sm text-red-800">{accountsError.message}</div>;
  }

  if (wallets.length === 0) {
    return null;
  }

  return (
    <div className="ui-card space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Notes (SDK)</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
          Committed notes for the selected wallet. Uses <code className="rounded bg-neutral-100 px-1">useNotes</code>{' '}
          and <code className="rounded bg-neutral-100 px-1">useConsume</code> from{' '}
          <code className="rounded bg-neutral-100 px-1">@miden-sdk/react</code>.
        </p>
      </div>

      <div>
        <Label>Wallet</Label>
        <SelectRoot
          value={accountId || undefined}
          onValueChange={(id) => setPickedAccountId(id)}
        >
          <SelectTrigger aria-label="Select wallet for notes">
            <SelectValue placeholder="Select wallet" />
          </SelectTrigger>
          <SelectContent>
            {wallets.map((w) => {
              const id = headerId(w);
              return (
                <SelectItem key={id} value={id}>
                  {id.slice(0, 20)}…
                </SelectItem>
              );
            })}
          </SelectContent>
        </SelectRoot>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          disabled={isLoading || !accountId}
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => void handleConsumeAll()}
          disabled={isConsuming || consumableNotes.length === 0 || !accountId}
        >
          {isConsuming ? 'Consuming…' : `Consume all (${consumableNotes.length})`}
        </Button>
        {error && <span className="text-sm text-red-700">{error.message}</span>}
        {consumeError && <span className="text-sm text-red-700">{consumeError.message}</span>}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-800">Received ({notes.length})</h3>
        {noteSummaries.length === 0 ? (
          <p className="text-sm text-neutral-600">No note summaries for this filter.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {noteSummaries.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-800"
              >
                <div className="mb-1 text-neutral-500">{s.id}</div>
                <div>
                  {s.assets.map((a) => `${a.amount.toString()} ${a.symbol ?? a.assetId}`).join(', ')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {consumableNotes.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-800">
            Consumable ({consumableNotes.length})
          </h3>
          <ul className="space-y-2 text-sm">
            {consumableNotes.map((cn) => {
              const rec = cn.inputNoteRecord();
              const id = rec.id().toString();
              return (
                <li
                  key={id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-800"
                >
                  <div className="text-neutral-500">{id}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
