import type { MidenAccount, VaultAsset } from '../../types/miden';

interface Props {
  accounts: MidenAccount[];
  balances: Record<string, VaultAsset[]>;
  onSync: () => Promise<void>;
  isLoading: boolean;
}

export function BalancePanel({ accounts, balances, onSync, isLoading }: Props) {
  if (accounts.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Balances</h2>
        <button
          onClick={onSync}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors"
        >
          {isLoading ? 'Syncing...' : 'Sync & Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        {accounts.map(acct => {
          const assets = balances[acct.id] ?? [];
          return (
            <div key={acct.id} className="bg-gray-700/50 rounded-lg px-4 py-3">
              <div className="text-sm text-gray-400 mb-1">{acct.label}</div>
              <div className="text-xs text-gray-500 font-mono break-all mb-2">{acct.id}</div>
              {assets.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No assets</div>
              ) : (
                <div className="space-y-1">
                  {assets.map((a, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400 font-mono">{a.faucetId.slice(0, 16)}...</span>
                      <span className="text-white font-semibold">{a.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
