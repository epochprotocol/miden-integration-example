import { useState } from 'react';
import { useMiden, useSyncState } from '@miden-sdk/react';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { MidenStatus } from './components/miden/MidenStatus';
import { MidenTab } from './components/tabs/MidenTab';
import { CrosschainTab } from './components/tabs/CrosschainTab';
import { WithdrawTab } from './components/tabs/WithdrawTab';

function App() {
  const [activeTab, setActiveTab] = useState('miden');
  const { client, isInitializing, error, sync } = useMiden();
  const { syncHeight } = useSyncState();
  const blockNum = syncHeight > 0 ? syncHeight : null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 pb-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          <MidenStatus
            isInitializing={isInitializing}
            error={error?.message ?? null}
            blockNum={blockNum}
            onRetry={() => void sync()}
          />
        </div>

        {activeTab === 'miden' && <MidenTab client={client} />}
        {activeTab === 'crosschain' && <CrosschainTab blockNum={blockNum} />}
        {activeTab === 'withdraw' && <WithdrawTab />}
      </main>
    </div>
  );
}

export default App;
