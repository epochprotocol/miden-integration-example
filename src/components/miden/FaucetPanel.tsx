import { useState, useRef, useCallback } from 'react';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';

interface Props {
  faucets: MidenFaucetInfo[];
  wallets: MidenAccount[];
  onCreateFaucet: (symbol: string, decimals: number, maxSupply: bigint) => Promise<string | undefined>;
  onMintTokens: (recipientId: string, faucetId: string, amount: bigint) => Promise<boolean | undefined>;
  onConsumeNotes: (accountId: string) => Promise<boolean | undefined>;
  onSyncBalance: () => Promise<void>;
  isLoading: boolean;
}

export function FaucetPanel({ faucets, wallets, onCreateFaucet, onMintTokens, onConsumeNotes, onSyncBalance, isLoading }: Props) {
  const [symbol, setSymbol] = useState('TEST');
  const [decimals, setDecimals] = useState('8');
  const [maxSupply, setMaxSupply] = useState('1000000');

  const [mintFaucetId, setMintFaucetId] = useState('');
  const [mintRecipientId, setMintRecipientId] = useState('');
  const [mintAmount, setMintAmount] = useState('1000');
  const [mintStatus, setMintStatus] = useState('');

  // Mint & Consume flow state
  const [flowStep, setFlowStep] = useState<number>(0); // 0 = idle
  const [countdown, setCountdown] = useState(0);
  const [isFlowRunning, setIsFlowRunning] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null);

  const handleCreate = async () => {
    await onCreateFaucet(symbol, parseInt(decimals), BigInt(maxSupply));
  };

  const handleMint = async () => {
    if (!mintFaucetId || !mintRecipientId || !mintAmount) return;
    setMintStatus('Minting...');
    try {
      await onMintTokens(mintRecipientId, mintFaucetId, BigInt(mintAmount));
      setMintStatus('Mint submitted! Use "Mint & Consume" for a one-click flow, or wait ~10s then consume notes manually.');
    } catch {
      setMintStatus('Mint failed');
    }
  };

  const handleMintAndConsume = useCallback(async () => {
    if (!mintFaucetId || !mintRecipientId || !mintAmount) return;
    setIsFlowRunning(true);
    setMintStatus('');

    try {
      // Step 1: Mint
      setFlowStep(1);
      await onMintTokens(mintRecipientId, mintFaucetId, BigInt(mintAmount));

      // Step 2: Wait for settlement
      setFlowStep(2);
      setCountdown(12);
      await new Promise<void>(resolve => {
        let remaining = 12;
        countdownRef.current = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);
          if (countdownRef.current && remaining <= 0) {
            clearInterval(countdownRef.current);
            resolve();
          }
        }, 1000);
      });

      // Step 3: Consume notes
      setFlowStep(3);
      const result = await onConsumeNotes(mintRecipientId);

      // Step 4: Refresh balances
      setFlowStep(4);
      await onSyncBalance();

      setFlowStep(0);
      setMintStatus(result ? 'Tokens minted and consumed! Balance updated.' : 'Mint succeeded but no notes to consume — they may need more time.');
    } catch (err) {
      setFlowStep(0);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setMintStatus(`Flow failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsFlowRunning(false);
    }
  }, [mintFaucetId, mintRecipientId, mintAmount, onMintTokens, onConsumeNotes, onSyncBalance]);

  const stepLabels = [
    '',
    'Minting tokens...',
    `Waiting for settlement... ${countdown}s`,
    'Consuming notes...',
    'Refreshing balances...',
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Create Faucet</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Symbol</label>
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Decimals</label>
            <input
              value={decimals}
              onChange={e => setDecimals(e.target.value)}
              type="number"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max Supply</label>
            <input
              value={maxSupply}
              onChange={e => setMaxSupply(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Faucet'}
        </button>
      </div>

      {faucets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Created Faucets</h3>
          <div className="space-y-2">
            {faucets.map(f => (
              <div key={f.id} className="bg-gray-700/50 rounded-lg px-4 py-3">
                <div className="text-sm text-gray-400">{f.symbol} (decimals: {f.decimals})</div>
                <div className="text-white font-mono text-sm break-all">{f.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {faucets.length > 0 && wallets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Mint Tokens</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Faucet</label>
              <select
                value={mintFaucetId}
                onChange={e => setMintFaucetId(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select faucet</option>
                {faucets.map(f => (
                  <option key={f.id} value={f.id}>{f.symbol} — {f.id.slice(0, 16)}...</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Recipient Wallet</label>
              <select
                value={mintRecipientId}
                onChange={e => setMintRecipientId(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select wallet</option>
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.label} — {w.id.slice(0, 16)}...</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Amount</label>
              <input
                value={mintAmount}
                onChange={e => setMintAmount(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleMint}
                disabled={isLoading || isFlowRunning || !mintFaucetId || !mintRecipientId}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                {isLoading ? 'Minting...' : 'Mint Only'}
              </button>
              <button
                onClick={handleMintAndConsume}
                disabled={isLoading || isFlowRunning || !mintFaucetId || !mintRecipientId}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                {isFlowRunning ? 'Running...' : 'Mint & Consume'}
              </button>
            </div>

            {flowStep > 0 && (
              <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium text-purple-400">{stepLabels[flowStep]}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(step => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        step < flowStep ? 'bg-purple-500' :
                        step === flowStep ? 'bg-purple-400 animate-pulse' :
                        'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mint</span>
                  <span>Wait</span>
                  <span>Consume</span>
                  <span>Sync</span>
                </div>
              </div>
            )}

            {mintStatus && (
              <p className={`text-sm ${mintStatus.includes('failed') || mintStatus.includes('Failed') ? 'text-red-400' : 'text-yellow-400'}`}>{mintStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
