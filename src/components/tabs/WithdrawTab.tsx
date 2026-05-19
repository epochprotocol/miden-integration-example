import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useMidenWalletAdapter } from '../../hooks/useMidenWalletAdapter';
import {
  WithdrawForm,
  WITHDRAW_DEPOSIT_TOAST_ID,
  WITHDRAW_SETTLE_TOAST_ID,
} from '../crosschain/WithdrawForm';
import { IntentStatus } from '../crosschain/IntentStatus';
import { useWithdrawIntent } from '../../hooks/useWithdrawIntent';
import { useIntentFlowStatus } from '../../hooks/useIntentFlowStatus';
import { truncateHash } from '../../lib/explorers';
import type { MidenAccount } from '../../types/miden';

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

  const withdraw = useWithdrawIntent();

  // Per INTEGRATION.md §10: userAddress is the EVM source for Flow B (set as `recipient`
  // on EVM→Miden intents — it's the refund target if the intent fails).
  const intentNonce = withdraw.withdrawResult?.intentNonce;
  const evmAddress = withdraw.withdrawResult?.intentData?.recipient as string | undefined;
  const intentStatus = useIntentFlowStatus(evmAddress, intentNonce);

  // Stage 2 toast lifecycle: resolve the "waiting for Miden settlement" toast
  // (opened by WithdrawForm.handleConfirm) once SIO surfaces the synthetic
  // Miden row, or when the terminal EVM-success row lands without a Miden row.
  const midenTxId = intentStatus.status?.midenTxId;
  const evmCompleted = intentStatus.status?.evmCompleted;
  useEffect(() => {
    if (midenTxId) {
      toast.success(`Miden settlement complete · ${truncateHash(midenTxId)}`, {
        id: WITHDRAW_SETTLE_TOAST_ID,
      });
    } else if (evmCompleted) {
      // EVM side settled but no Miden row yet — keep user informed.
      toast.loading('EVM settled — awaiting Miden execution…', {
        id: WITHDRAW_SETTLE_TOAST_ID,
      });
    }
  }, [midenTxId, evmCompleted]);

  // Clear lingering toasts if the user navigates / starts a new flow.
  useEffect(() => {
    return () => {
      toast.dismiss(WITHDRAW_DEPOSIT_TOAST_ID);
      toast.dismiss(WITHDRAW_SETTLE_TOAST_ID);
    };
  }, []);

  return (
    <div className="ui-tab-panel space-y-6">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Withdraw to Miden</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
          Pull funds from your EVM wallet into a Miden account using an Epoch withdraw intent.
        </p>
      </header>
      <WithdrawForm
        accounts={displayWallets}
        onFetchQuote={withdraw.fetchQuote}
        onConfirmWithdraw={withdraw.confirmWithdraw}
        onClearQuote={withdraw.clearQuote}
        pendingQuote={withdraw.pendingQuote}
        isFetchingQuote={withdraw.isFetchingQuote}
        isLoading={withdraw.isLoading}
        isSDKReady={withdraw.isSDKReady}
      />
      <IntentStatus
        result={withdraw.withdrawResult}
        error={withdraw.error}
        flowStatus={intentStatus.status}
        isPolling={intentStatus.isPolling}
      />
    </div>
  );
}
