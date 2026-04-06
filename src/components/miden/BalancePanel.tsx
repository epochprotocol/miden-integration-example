import type { MidenAccount, VaultAsset } from '../../types/miden';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  accounts: MidenAccount[];
  balances: Record<string, VaultAsset[]>;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

export function BalancePanel({ accounts, balances, onSync, isSyncing }: Props) {
  const handleSync = () => {
    void toast.promise(onSync(), {
      loading: 'Syncing Miden state…',
      success: 'Balances updated',
      error: (err) => (err instanceof Error ? err.message : 'Sync failed'),
    });
  };
  if (accounts.length === 0) return null;

  return (
    <div className="ui-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900">Balances</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
            On-chain view after sync: vault amounts per faucet for each wallet and faucet account. Sync after mints,
            sends, or consumes.
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
        {accounts.map((acct) => {
          const assets = balances[acct.id] ?? [];
          return (
            <div key={acct.id} className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="mb-1 text-sm text-neutral-600">{acct.label}</div>
              <div className="mb-2 break-all font-mono text-xs text-neutral-500">{acct.id}</div>
              {assets.length === 0 ? (
                <div className="text-sm italic text-neutral-500">No assets</div>
              ) : (
                <div className="space-y-1">
                  {assets.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-mono text-neutral-600">{a.faucetId.slice(0, 16)}…</span>
                      <span className="font-semibold text-neutral-900">{a.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
