import { useState } from 'react';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';

interface Props {
  accounts: MidenAccount[];
  faucets: MidenFaucetInfo[];
  onSendTokens: (senderId: string, receiverId: string, faucetId: string, amount: bigint) => Promise<boolean | undefined>;
  onConsumeNotes: (accountId: string) => Promise<boolean | undefined>;
  onRefreshConsumable: (accountId: string) => Promise<any>;
  onSyncBalance: () => Promise<void>;
  consumableNotes: { noteId: string }[];
  isLoading: boolean;
}

export function TransferPanel({
  accounts,
  faucets,
  onSendTokens,
  onConsumeNotes,
  onRefreshConsumable,
  onSyncBalance,
  consumableNotes,
  isLoading,
}: Props) {
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [faucetId, setFaucetId] = useState('');
  const [amount, setAmount] = useState('100');
  const [sendStatus, setSendStatus] = useState('');

  const [consumeAccountId, setConsumeAccountId] = useState('');
  const [consumeStatus, setConsumeStatus] = useState('');

  const handleSend = async () => {
    if (!senderId || !receiverId || !faucetId || !amount) return;
    setSendStatus('Sending P2ID note...');
    try {
      await onSendTokens(senderId, receiverId, faucetId, BigInt(amount));
      setSendStatus('P2ID note sent! Receiver must sync & consume to see tokens.');
    } catch {
      setSendStatus('Send failed');
    }
  };

  const handleConsume = async () => {
    if (!consumeAccountId) return;
    setConsumeStatus('Consuming notes...');
    try {
      const result = await onConsumeNotes(consumeAccountId);
      if (result) {
        setConsumeStatus('Notes consumed! Syncing balances...');
        await onSyncBalance();
        setConsumeStatus('Notes consumed and balances updated.');
      } else {
        setConsumeStatus('No notes to consume');
      }
    } catch {
      setConsumeStatus('Consume failed');
    }
  };

  if (accounts.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Send Tokens (P2ID)</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sender</label>
            <select
              value={senderId}
              onChange={e => setSenderId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select sender</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.label} — {a.id.slice(0, 16)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Receiver Account ID</label>
            <input
              value={receiverId}
              onChange={e => setReceiverId(e.target.value)}
              placeholder="Paste receiver account ID"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Faucet</label>
            <select
              value={faucetId}
              onChange={e => setFaucetId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select faucet</option>
              {faucets.map(f => (
                <option key={f.id} value={f.id}>{f.symbol} — {f.id.slice(0, 16)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !senderId || !receiverId || !faucetId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send via P2ID'}
          </button>
          {sendStatus && <p className="text-sm text-yellow-400">{sendStatus}</p>}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Consume Notes</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Account</label>
            <select
              value={consumeAccountId}
              onChange={e => setConsumeAccountId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.label} — {a.id.slice(0, 16)}...</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => consumeAccountId && onRefreshConsumable(consumeAccountId)}
              disabled={isLoading || !consumeAccountId}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors"
            >
              Check Notes
            </button>
            <button
              onClick={handleConsume}
              disabled={isLoading || !consumeAccountId}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              {isLoading ? 'Consuming...' : 'Consume All'}
            </button>
          </div>
          {consumableNotes.length > 0 && (
            <div className="text-sm text-gray-400">
              {consumableNotes.length} consumable note(s) found
            </div>
          )}
          {consumeStatus && <p className="text-sm text-yellow-400">{consumeStatus}</p>}
        </div>
      </div>
    </div>
  );
}
