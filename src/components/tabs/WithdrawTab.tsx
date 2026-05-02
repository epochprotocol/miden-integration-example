import { useMemo } from 'react';
import { useAccounts } from '@miden-sdk/react';
import { EVMWalletConnect } from '../crosschain/EVMWalletConnect';
import { WithdrawForm } from '../crosschain/WithdrawForm';
import { IntentStatus } from '../crosschain/IntentStatus';
import { useWithdrawIntent } from '../../hooks/useWithdrawIntent';
import { loadFaucets, loadWallets } from '../../utils/persistence';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';

export function WithdrawTab() {
  const { wallets: walletHeaders, faucets: faucetHeaders } = useAccounts();

  const displayWallets: MidenAccount[] = useMemo(() => {
    const persisted = loadWallets();
    const localById = new Map(persisted.map((w) => [w.id.toLowerCase(), w]));
    return walletHeaders.map((h, i) => {
      const id = h.id().toString();
      return localById.get(id.toLowerCase()) ?? { id, label: `Wallet ${i + 1}`, type: 'wallet' as const };
    });
  }, [walletHeaders]);

  const displayFaucets: MidenFaucetInfo[] = useMemo(() => {
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
  }, [faucetHeaders]);

  const withdraw = useWithdrawIntent();

  return (
    <div className="ui-tab-panel space-y-6">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Withdraw to Miden</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
          Pull funds from your EVM wallet into a Miden account using an Epoch withdraw intent.
        </p>
      </header>
      <EVMWalletConnect />
      <WithdrawForm
        accounts={displayWallets}
        faucets={displayFaucets}
        onWithdraw={withdraw.createWithdrawIntent}
        isLoading={withdraw.isLoading}
        isSDKReady={withdraw.isSDKReady}
      />
      <IntentStatus result={withdraw.withdrawResult} error={withdraw.error} flowStatus={null} isPolling={false} />
    </div>
  );
}
