import type { MidenAccount } from '../../types/miden';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSyncState } from '@miden-sdk/react';
import { BalanceAccountRow } from './BalanceAccountRow';

interface Props {
  accounts: MidenAccount[];
}

export function BalancePanel({ accounts }: Props) {
  const { isSyncing, sync } = useSyncState();

  const handleSync = () => {
    void toast.promise(
      (async () => {
        await sync();
      })(),
      {
        loading: 'Syncing Miden state…',
        success: 'Balances updated',
        error: (err) => (err instanceof Error ? err.message : 'Sync failed'),
      },
    );
  };

  if (accounts.length === 0) return null;

  return (
    <div className="ui-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900">Balances</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
            On-chain view after sync: per-account assets from <code className="rounded bg-neutral-100 px-1">useAccount</code>.
            Sync after mints, sends, or consumes.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 self-start sm:self-center"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing…' : 'Sync and refresh'}
        </Button>
      </div>

      <div className="space-y-3">
        {accounts.map((acct) => (
          <BalanceAccountRow key={acct.id} account={acct} />
        ))}
      </div>
    </div>
  );
}
