import { useState } from 'react';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { CrosschainTab } from './components/tabs/CrosschainTab';
import { WithdrawTab } from './components/tabs/WithdrawTab';
import { useMidenWalletAdapter } from './hooks/useMidenWalletAdapter';
import { Button } from '@/components/ui/button';

function App() {
  const [activeTab, setActiveTab] = useState('crosschain');
  const midenWallet = useMidenWalletAdapter({ enabled: true });


  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 pb-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <TabNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabledTabs={
              midenWallet.connected
                ? undefined
                : {
                    withdraw: 'Connect Miden wallet to enable Withdraw.',
                  }
            }
          />

          <div className="w-full sm:w-[360px]">
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Miden wallet</div>
                  <div className="mt-1 font-mono text-[12px] text-neutral-700 break-all">
                    {midenWallet.connected ? (midenWallet.accountId?.hex ?? 'connected') : 'not connected'}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => void midenWallet.connect()}
                  disabled={midenWallet.connected}
                >
                  {midenWallet.connected ? 'Connected' : 'Connect'}
                </Button>
              </div>
              {!midenWallet.connected && (
                <div className="mt-2 text-xs text-neutral-500">
                  Connect to unlock flows that deliver to a Miden account (e.g. Withdraw).
                </div>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'crosschain' && <CrosschainTab />}
        {activeTab === 'withdraw' && <WithdrawTab />}
      </main>
    </div>
  );
}

export default App;
