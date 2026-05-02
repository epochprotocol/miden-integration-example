import { useCallback, useMemo, useState, type MutableRefObject } from 'react';
import { useAccounts, useCreateWallet, useSyncState, AuthScheme } from '@miden-sdk/react';
import type { Account } from '@miden-sdk/miden-sdk';
import type { MidenAccount } from '../../types/miden';
import { loadWallets, saveWallets } from '../../utils/persistence';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  /** Shared with transfer/mint paths so new wallets resolve `AccountId` safely. */
  accountObjectsRef: MutableRefObject<Map<string, Account>>;
  /** Notifies parent to re-merge `loadWallets()` labels for other panels (faucet, transfer, …). */
  onWalletMetadataChanged: () => void;
}

export function WalletPanel({ accountObjectsRef, onWalletMetadataChanged }: Props) {
  const { sync } = useSyncState();
  const { wallets: walletHeaders, refetch } = useAccounts();
  const { createWallet, isCreating, error: createError } = useCreateWallet();
  const [labelTick, setLabelTick] = useState(0);

  const displayWallets: MidenAccount[] = useMemo(() => {
    void labelTick;
    const persisted = loadWallets();
    const localById = new Map(persisted.map((w) => [w.id.toLowerCase(), w]));
    return walletHeaders.map((h, i) => {
      const id = h.id().toString();
      return localById.get(id.toLowerCase()) ?? { id, label: `Wallet ${i + 1}`, type: 'wallet' as const };
    });
  }, [walletHeaders, labelTick]);

  const runCreate = useCallback(async () => {
    const account = await createWallet({
      storageMode: 'public',
      mutable: true,
      authScheme: AuthScheme.Falcon,
    });
    const id = account.id().toString();
    accountObjectsRef.current.set(id, account);

    const persisted = loadWallets();
    const label = `Wallet ${persisted.length + 1}`;
    saveWallets([...persisted, { id, label, type: 'wallet' as const }]);

    setLabelTick((t) => t + 1);
    onWalletMetadataChanged();
    await refetch();
    await sync();
  }, [createWallet, accountObjectsRef, onWalletMetadataChanged, refetch, sync]);

  const handleCreate = () => {
    void toast.promise(runCreate(), {
      loading: 'Creating wallet…',
      success: 'Wallet created',
      error: (err) => (err instanceof Error ? err.message : 'Failed to create wallet'),
    });
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
        <Button className="shrink-0 self-start sm:self-center" onClick={handleCreate} disabled={isCreating}>
          {isCreating ? 'Creating…' : 'Create wallet'}
        </Button>
      </div>

      {createError && <p className="mb-3 text-sm text-red-700">{createError.message}</p>}

      {displayWallets.length === 0 ? (
        <p className="text-sm text-neutral-600">No wallets yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {displayWallets.map((acct) => (
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
