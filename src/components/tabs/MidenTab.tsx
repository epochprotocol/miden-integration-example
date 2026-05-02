import { useCallback, useMemo, useState } from 'react';
import { useAccounts } from '@miden-sdk/react';
import type { WebClient } from '@miden-sdk/react';
import { WalletPanel } from '../miden/WalletPanel';
import { FaucetPanel } from '../miden/FaucetPanel';
import { BalancePanel } from '../miden/BalancePanel';
import { TransferPanel } from '../miden/TransferPanel';
import { PersistenceControls } from '../miden/PersistenceControls';
import { NotesInboxPanel } from '../miden/NotesInboxPanel';
import { useMidenWallet } from '../../hooks/useMidenWallet';
import { loadFaucets, loadWallets } from '../../utils/persistence';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';

interface Props {
  client: WebClient | null;
}

export function MidenTab({ client }: Props) {
  const [walletMetaTick, setWalletMetaTick] = useState(0);
  const [faucetMetaTick, setFaucetMetaTick] = useState(0);

  const { wallets: walletHeaders, faucets: faucetHeaders, isLoading, error } = useAccounts();

  const walletIds = useMemo(() => walletHeaders.map((h) => h.id().toString()), [walletHeaders]);
  const { accountObjectsRef } = useMidenWallet(client, walletIds);

  const bumpWalletMetadata = useCallback(() => setWalletMetaTick((t) => t + 1), []);
  const bumpFaucetMetadata = useCallback(() => setFaucetMetaTick((t) => t + 1), []);

  const displayWallets: MidenAccount[] = useMemo(() => {
    void walletMetaTick;
    const persisted = loadWallets();
    const localById = new Map(persisted.map((w) => [w.id.toLowerCase(), w]));
    return walletHeaders.map((h, i) => {
      const id = h.id().toString();
      return localById.get(id.toLowerCase()) ?? { id, label: `Wallet ${i + 1}`, type: 'wallet' as const };
    });
  }, [walletHeaders, walletMetaTick]);

  const displayFaucets: MidenFaucetInfo[] = useMemo(() => {
    void faucetMetaTick;
    const persisted = loadFaucets();
    const localById = new Map(persisted.map((f) => [f.id.toLowerCase(), f]));
    return faucetHeaders.map((h, i) => {
      const id = h.id().toString();
      return (
        localById.get(id.toLowerCase()) ?? {
          id,
          label: `Faucet ${i + 1}`,
          type: 'faucet' as const,
          symbol: '—',
          decimals: 8,
          maxSupply: '0',
        }
      );
    });
  }, [faucetHeaders, faucetMetaTick]);

  const allDisplayAccounts = useMemo(
    () => [...displayWallets, ...displayFaucets],
    [displayWallets, displayFaucets],
  );

  return (
    <div className="ui-tab-panel space-y-6">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Miden wallet</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
          Local testnet wallets, custom faucets, P2ID transfers, and balances. Use Cross-chain bridge when you want
          Miden → EVM; use Withdraw to pull Sepolia tokens back into Miden.
        </p>
      </header>

      <PersistenceControls />

      {(isLoading || error) && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {isLoading && <p>Loading account list from SDK…</p>}
          {error && <p className="text-red-800">Accounts: {error.message}</p>}
        </div>
      )}

      <WalletPanel accountObjectsRef={accountObjectsRef} onWalletMetadataChanged={bumpWalletMetadata} />
      <FaucetPanel wallets={displayWallets} onFaucetMetadataChanged={bumpFaucetMetadata} />
      <BalancePanel accounts={allDisplayAccounts} />
      <NotesInboxPanel />
      <TransferPanel accounts={displayWallets} faucets={displayFaucets} />
    </div>
  );
}
