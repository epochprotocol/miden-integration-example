import { useMemo } from 'react';
import { useMidenWalletAdapter } from '../../hooks/useMidenWalletAdapter';
import { EVMWalletConnect } from '../crosschain/EVMWalletConnect';
import { WithdrawForm } from '../crosschain/WithdrawForm';
import { IntentStatus } from '../crosschain/IntentStatus';
import { useWithdrawIntent } from '../../hooks/useWithdrawIntent';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';

export function WithdrawTab() {
  const midenWallet = useMidenWalletAdapter({ enabled: true });
  const displayWallets: MidenAccount[] = useMemo(() => {
    if (!midenWallet.accountId?.hex) return [];
    return [
      {
        id: midenWallet.accountId.hex,
        label: 'Connected wallet',
        type: 'wallet' as const,
      },
    ];
  }, [midenWallet.accountId?.hex]);

  const displayFaucets: MidenFaucetInfo[] = useMemo(() => {
    // With adapter-only mode, we don't have faucet metadata. Populate from assets
    // so users can copy/paste faucet ids they already hold.
    const unique = new Map<string, MidenFaucetInfo>();
    for (const a of midenWallet.assets) {
      if (!unique.has(a.assetId)) {
        unique.set(a.assetId, {
          id: a.assetId,
          label: `${a.assetId.slice(0, 16)}…`,
          type: 'faucet' as const,
          symbol: '—',
          maxSupply: '0',
        });
      }
    }
    return Array.from(unique.values());
  }, [midenWallet.assets]);

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
        onFetchQuote={withdraw.fetchQuote}
        onConfirmWithdraw={withdraw.confirmWithdraw}
        onClearQuote={withdraw.clearQuote}
        pendingQuote={withdraw.pendingQuote}
        isFetchingQuote={withdraw.isFetchingQuote}
        isLoading={withdraw.isLoading}
        isSDKReady={withdraw.isSDKReady}
      />
      <IntentStatus result={withdraw.withdrawResult} error={withdraw.error} flowStatus={null} isPolling={false} />
    </div>
  );
}
