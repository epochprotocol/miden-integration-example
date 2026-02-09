import type { MidenAccount } from '../../types/miden';

interface Props {
  accounts: MidenAccount[];
  onCreateWallet: () => Promise<string | undefined>;
  isLoading: boolean;
}

export function WalletPanel({ accounts, onCreateWallet, isLoading }: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Wallets</h2>
        <button
          onClick={onCreateWallet}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Wallet'}
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-gray-400 text-sm">No wallets yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map(acct => (
            <div key={acct.id} className="bg-gray-700/50 rounded-lg px-4 py-3">
              <div className="text-sm text-gray-400">{acct.label}</div>
              <div className="text-white font-mono text-sm break-all">{acct.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
