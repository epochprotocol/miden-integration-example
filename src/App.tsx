import { useState } from 'react';
import { Header } from './components/layout/Header';
import { TabNav } from './components/layout/TabNav';
import { CrosschainTab } from './components/tabs/CrosschainTab';
import { WithdrawTab } from './components/tabs/WithdrawTab';

function App() {
  const [activeTab, setActiveTab] = useState('crosschain');


  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8 pb-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === 'crosschain' && <CrosschainTab />}
        {activeTab === 'withdraw' && <WithdrawTab />}
      </main>
    </div>
  );
}

export default App;
