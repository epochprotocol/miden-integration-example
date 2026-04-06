interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'miden', label: 'Miden wallet' },
  { id: 'crosschain', label: 'Cross-chain bridge' },
  { id: 'withdraw', label: 'Withdraw to Miden' },
];

export function TabNav({ activeTab, onTabChange }: Props) {
  return (
    <nav
      className="flex max-w-full gap-0.5 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-100/90 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap"
      aria-label="Primary navigation"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
            activeTab === tab.id
              ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200/80'
              : 'text-neutral-600 hover:bg-white/70 hover:text-neutral-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
