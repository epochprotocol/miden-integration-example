import { useState } from 'react';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { MidenStatus } from './components/miden/MidenStatus';
import { WalletPanel } from './components/miden/WalletPanel';
import { FaucetPanel } from './components/miden/FaucetPanel';
import { BalancePanel } from './components/miden/BalancePanel';
import { TransferPanel } from './components/miden/TransferPanel';
import { PersistenceControls } from './components/miden/PersistenceControls';
import { EVMWalletConnect } from './components/crosschain/EVMWalletConnect';
import { IntentForm } from './components/crosschain/IntentForm';
import { IntentStatus } from './components/crosschain/IntentStatus';
import { useMidenClient } from './hooks/useMidenClient';
import { useMidenWallet } from './hooks/useMidenWallet';
import { useMidenFaucet } from './hooks/useMidenFaucet';
import { useMidenTransfer } from './hooks/useMidenTransfer';
import { useEpochIntent } from './hooks/useEpochIntent';
import { useWithdrawIntent } from './hooks/useWithdrawIntent';
import { useIntentStatus } from './hooks/useIntentStatus';
import { WithdrawForm } from './components/crosschain/WithdrawForm';

function App() {
  const [activeTab, setActiveTab] = useState('miden');

  const { client, prover, isInitializing, error: clientError, blockNum, retry } = useMidenClient();
  const wallet = useMidenWallet(client);
  const faucet = useMidenFaucet(client, prover, wallet.getAccountId, wallet.accountObjectsRef);
  const transfer = useMidenTransfer(client, prover, wallet.getAccountId, faucet.getFaucetId);
  const epoch = useEpochIntent();
  const withdraw = useWithdrawIntent();

  // Extract tracking info from the latest intent result
  const intentNonce = epoch.intentResult?.intentNonce;
  const evmAddress = epoch.intentResult?.intentData?.recipient as string | undefined;
  const intentStatus = useIntentStatus(evmAddress, intentNonce);

  const allAccounts = [
    ...wallet.accounts,
    ...faucet.faucets,
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 pb-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <MidenStatus isInitializing={isInitializing} error={clientError} blockNum={blockNum} onRetry={retry} />
        </div>

        {activeTab === 'miden' && (
          <div key="miden" className="ui-tab-panel space-y-6">
            <header className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Miden wallet</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
                Local testnet wallets, custom faucets, P2ID transfers, and balances. Use Cross-chain bridge when you
                want Miden → EVM; use Withdraw to pull Sepolia tokens back into Miden.
              </p>
            </header>
            <PersistenceControls />
            <WalletPanel
              accounts={wallet.accounts}
              onCreateWallet={wallet.createWallet}
              isCreatingWallet={wallet.isCreatingWallet}
            />
            <FaucetPanel
              faucets={faucet.faucets}
              wallets={wallet.accounts}
              onCreateFaucet={faucet.createFaucet}
              onMintTokens={faucet.mintTokens}
              onConsumeNotes={transfer.consumeNotes}
              onSyncBalance={wallet.syncState}
              isCreatingFaucet={faucet.isCreatingFaucet}
              isMinting={faucet.isMinting}
              isConsumingNotes={transfer.isConsuming}
            />
            <BalancePanel
              accounts={allAccounts}
              balances={wallet.balances}
              onSync={wallet.syncState}
              isSyncing={wallet.isSyncing}
            />
            <TransferPanel
              accounts={wallet.accounts}
              faucets={faucet.faucets}
              onSendTokens={transfer.sendTokens}
              onConsumeNotes={transfer.consumeNotes}
              onRefreshConsumable={transfer.refreshConsumableNotes}
              onSyncBalance={wallet.syncState}
              consumableNotes={transfer.consumableNotes}
              isSending={transfer.isSending}
              isConsuming={transfer.isConsuming}
              isRefreshingNotes={transfer.isRefreshingNotes}
            />
            {(wallet.error || faucet.error || transfer.error) && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {wallet.error || faucet.error || transfer.error}
              </div>
            )}
          </div>
        )}

        {activeTab === 'crosschain' && (
          <div key="crosschain" className="ui-tab-panel space-y-6">
            <header className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
                Bridge to EVM
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
                Connect an Ethereum wallet, pick your Miden wallet and token, then submit your intent. The app may
                ask you to create a P2ID note when the allocator needs a lock.
              </p>
            </header>
            <EVMWalletConnect />
            <IntentForm
              accounts={wallet.accounts}
              faucets={faucet.faucets}
              onCreateIntent={epoch.createIntent}
              onSendP2ID={transfer.sendTokens}
              onReclaimNotes={transfer.consumeNotes}
              currentBlockHeight={blockNum ?? undefined}
              isCreateIntentBusy={epoch.isLoading || transfer.isSending}
              isReclaimBusy={transfer.isConsuming}
              isSDKReady={epoch.isSDKReady}
            />
            <IntentStatus
              result={epoch.intentResult}
              error={epoch.error}
              flowStatus={intentStatus.status}
              isPolling={intentStatus.isPolling}
            />
          </div>
        )}
        {activeTab === 'withdraw' && (
          <div key="withdraw" className="ui-tab-panel space-y-6">
            <header className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
                Withdraw to Miden
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
                Pull funds from your EVM wallet into a Miden account using an Epoch withdraw intent.
              </p>
            </header>
            <EVMWalletConnect />
            <WithdrawForm
              accounts={wallet.accounts}
              faucets={faucet.faucets}
              onWithdraw={withdraw.createWithdrawIntent}
              isLoading={withdraw.isLoading}
            />
            <IntentStatus
              result={withdraw.withdrawResult}
              error={withdraw.error}
              flowStatus={null}
              isPolling={false}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
