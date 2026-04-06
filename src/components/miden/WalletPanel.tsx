import type { MidenAccount } from '../../types/miden';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  accounts: MidenAccount[];
  onCreateWallet: () => Promise<string | undefined>;
  isCreatingWallet: boolean;
}

export function WalletPanel({ accounts, onCreateWallet, isCreatingWallet }: Props) {
  const handleCreate = () => {
    void toast.promise(
      (async () => {
        const id = await onCreateWallet();
        if (!id) throw new Error('Miden client not ready');
      })(),
      {
        loading: 'Creating wallet…',
        success: 'Wallet created',
        error: (err) => (err instanceof Error ? err.message : 'Failed to create wallet'),
      },
    );
  };
  return (
    <div className="ui-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900">Wallets</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
            Miden accounts you control in this browser. Each has an ID you’ll use when sending tokens or bridging.
          </p>
        </div>
        <Button className="shrink-0 self-start sm:self-center" onClick={handleCreate} disabled={isCreatingWallet}>
          {isCreatingWallet ? 'Creating…' : 'Create wallet'}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-neutral-600">No wallets yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((acct) => (
            <div key={acct.id} className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="text-sm text-neutral-600">{acct.label}</div>
              <div className="break-all font-mono text-sm text-neutral-900">{acct.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
