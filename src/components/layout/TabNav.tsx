interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'miden', label: 'Miden Wallet' },
  { id: 'crosschain', label: 'Cross-Chain Bridge' },
  { id: 'withdraw', label: 'Withdraw to Miden' },
];

export function TabNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex gap-1 bg-gray-800/50 p-1 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.id
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
