import { clearPersistedData } from '../../utils/persistence';

export function PersistenceControls() {
  const handleClear = async () => {
    if (confirm('Clear all saved accounts and faucets? This will require a page refresh.')) {
      await clearPersistedData();
      window.location.reload();
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Persistence</h3>
          <p className="text-xs text-gray-400 mt-1">
            Accounts and faucets are now saved to browser storage
          </p>
        </div>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
        >
          Clear Saved Data
        </button>
      </div>
    </div>
  );
}
