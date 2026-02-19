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
import { FlowDiagram } from './components/crosschain/FlowDiagram';
import { IntentStatus } from './components/crosschain/IntentStatus';
import { AllocatorDebugPanel } from './components/debug/AllocatorDebugPanel';
import { useMidenClient } from './hooks/useMidenClient';
import { useMidenWallet } from './hooks/useMidenWallet';
import { useMidenFaucet } from './hooks/useMidenFaucet';
import { useMidenTransfer } from './hooks/useMidenTransfer';
import { useEpochIntent } from './hooks/useEpochIntent';
import { useIntentStatus } from './hooks/useIntentStatus';

function App() {
  const [activeTab, setActiveTab] = useState('miden');

  const { client, prover, isInitializing, error: clientError, blockNum, retry } = useMidenClient();
  const wallet = useMidenWallet(client);
  const faucet = useMidenFaucet(client, prover, wallet.getAccountId, wallet.accountObjectsRef);
  const transfer = useMidenTransfer(client, prover, wallet.getAccountId, faucet.getFaucetId);
  const epoch = useEpochIntent();

  // Extract tracking info from the latest intent result
  const intentNonce = epoch.intentResult?.intentNonce;
  const evmAddress = epoch.intentResult?.intentData?.recipient as string | undefined;
  const intentStatus = useIntentStatus(evmAddress, intentNonce);

  const allAccounts = [
    ...wallet.accounts,
    ...faucet.faucets,
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <MidenStatus isInitializing={isInitializing} error={clientError} blockNum={blockNum} onRetry={retry} />
        </div>

        {activeTab === 'miden' && (
          <div className="space-y-6">
            <PersistenceControls />
            <WalletPanel
              accounts={wallet.accounts}
              onCreateWallet={wallet.createWallet}
              isLoading={wallet.isLoading}
            />
            <FaucetPanel
              faucets={faucet.faucets}
              wallets={wallet.accounts}
              onCreateFaucet={faucet.createFaucet}
              onMintTokens={faucet.mintTokens}
              onConsumeNotes={transfer.consumeNotes}
              onSyncBalance={wallet.syncState}
              isLoading={faucet.isLoading}
            />
            <BalancePanel
              accounts={allAccounts}
              balances={wallet.balances}
              onSync={wallet.syncState}
              isLoading={wallet.isLoading}
            />
            <TransferPanel
              accounts={wallet.accounts}
              faucets={faucet.faucets}
              onSendTokens={transfer.sendTokens}
              onConsumeNotes={transfer.consumeNotes}
              onRefreshConsumable={transfer.refreshConsumableNotes}
              onSyncBalance={wallet.syncState}
              consumableNotes={transfer.consumableNotes}
              isLoading={transfer.isLoading}
            />
            {(wallet.error || faucet.error || transfer.error) && (
              <div className="bg-red-400/10 text-red-400 rounded-xl p-4 text-sm">
                {wallet.error || faucet.error || transfer.error}
              </div>
            )}
          </div>
        )}

        {activeTab === 'crosschain' && (
          <div className="space-y-6">
            <FlowDiagram />
            <EVMWalletConnect />
            <IntentForm
              accounts={wallet.accounts}
              faucets={faucet.faucets}
              onCreateIntent={epoch.createIntent}
              onSendP2ID={transfer.sendTokens}
              isLoading={epoch.isLoading || transfer.isLoading}
              isSDKReady={true}
            />
            <IntentStatus
              result={epoch.intentResult}
              error={epoch.error}
              flowStatus={intentStatus.status}
              isPolling={intentStatus.isPolling}
            />
            <AllocatorDebugPanel />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
