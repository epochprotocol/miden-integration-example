import { useState } from 'react';

const SIO_BASE_URL = import.meta.env.VITE_SIO_URL || 'http://localhost:8080';

export function AllocatorDebugPanel() {
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConsumableNotes = async () => {
    setIsChecking(true);
    setError(null);

    try {
      console.log('[AllocatorDebug] Fetching consumable notes from backend...');
      const response = await fetch(`${SIO_BASE_URL}/miden/allocator/consumable-notes`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('[AllocatorDebug] Response:', data);

      setAccountId(data.accountId);
      setNotes(data.notes || []);
    } catch (err) {
      console.error('[AllocatorDebug] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check notes');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-md font-semibold text-white mb-3">🔍 Allocator Debug Panel</h3>

      <div className="space-y-3">
        {accountId && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Allocator Account ID (Backend)</label>
            <code className="block bg-gray-900 text-green-400 px-3 py-2 rounded text-xs font-mono">
              {accountId}
            </code>
          </div>
        )}

        <button
          onClick={checkConsumableNotes}
          disabled={isChecking}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isChecking ? 'Checking...' : 'Check Allocator Consumable Notes'}
        </button>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-400">❌ {error}</p>
          </div>
        )}

        {notes.length > 0 && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <p className="text-sm text-green-400 font-semibold mb-2">
              ✅ Found {notes.length} consumable note(s):
            </p>
            <div className="space-y-2">
              {notes.map((note, idx) => (
                <div key={idx} className="bg-gray-900 p-2 rounded text-xs font-mono">
                  <div className="text-gray-400">Note #{idx + 1}</div>
                  <div className="text-white break-all">ID: {note.id}</div>
                  <div className="text-gray-400">Type: {note.noteType}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes.length === 0 && !isChecking && !error && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
            <p className="text-sm text-yellow-400">
              ℹ️ No consumable notes found. Click "Check" to refresh.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
