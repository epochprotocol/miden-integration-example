import { useState } from 'react';
import { useAccount } from 'wagmi';
import type { MidenAccount, MidenFaucetInfo, CrossChainIntentParams } from '../../types/miden';
import { ALLOCATOR_MIDEN_ACCOUNT_ID } from '../../services/epoch-bridge';

interface Props {
  accounts: MidenAccount[];
  faucets: MidenFaucetInfo[];
  onCreateIntent: (params: CrossChainIntentParams) => Promise<any>;
  onSendP2ID: (senderId: string, receiverId: string, faucetId: string, amount: bigint) => Promise<boolean | undefined>;
  isLoading: boolean;
  isSDKReady: boolean;
}

export function IntentForm({ accounts, faucets, onCreateIntent, onSendP2ID, isLoading, isSDKReady }: Props) {
  const { address: evmAddress } = useAccount();

  const [midenAccountId, setMidenAccountId] = useState('');
  const [faucetId, setFaucetId] = useState('');
  const [amount, setAmount] = useState('100');
  const [outputToken, setOutputToken] = useState('0x0000000000000000000000000000000000000000');
  const [minTokenOut, setMinTokenOut] = useState('0');
  const [chainId, setChainId] = useState('11155111'); // Sepolia
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!midenAccountId || !faucetId || !amount || !evmAddress) return;

    try {
      // Step 1: Send P2ID note to allocator on Miden side
      setStatus('Step 1/2: Sending P2ID note to allocator on Miden...');
      try {
        await onSendP2ID(midenAccountId, ALLOCATOR_MIDEN_ACCOUNT_ID, faucetId, BigInt(amount));
      } catch {
        // P2ID may fail if allocator account doesn't exist on testnet — continue to show intent anyway
        setStatus('P2ID note skipped (allocator not on testnet). Building intent data...');
      }

      // Step 2: Build cross-chain intent via Epoch SDK
      setStatus('Step 2/2: Building cross-chain intent via Epoch SDK...');
      const params: CrossChainIntentParams = {
        midenAccountId,
        midenFaucetId: faucetId,
        midenAmount: amount,
        evmRecipient: evmAddress,
        destinationChainId: parseInt(chainId),
        outputTokenAddress: outputToken,
        minTokenOut,
      };
      await onCreateIntent(params);
      setStatus('Intent built successfully!');
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Cross-Chain Intent</h2>
      <p className="text-sm text-gray-400 mb-4">
        Send a P2ID note to the allocator, then build an Epoch intent for EVM execution.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Source (Miden Wallet)</label>
            <select
              value={midenAccountId}
              onChange={e => setMidenAccountId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select wallet</option>
              {accounts.filter(a => a.type === 'wallet').map(a => (
                <option key={a.id} value={a.id}>{a.label} — {a.id.slice(0, 16)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Token (Faucet)</label>
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Destination Chain ID</label>
            <input
              value={chainId}
              onChange={e => setChainId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Destination (EVM Wallet)</label>
          <input
            value={evmAddress ?? ''}
            readOnly
            className="w-full bg-gray-700/50 text-gray-400 rounded-lg px-3 py-2 text-sm font-mono"
            placeholder="Connect EVM wallet above"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Output Token Address</label>
            <input
              value={outputToken}
              onChange={e => setOutputToken(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min Output Amount</label>
            <input
              value={minTokenOut}
              onChange={e => setMinTokenOut(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !midenAccountId || !faucetId || !evmAddress}
          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Processing...' : 'Create Cross-Chain Intent'}
        </button>

        {!isSDKReady && evmAddress && (
          <p className="text-xs text-yellow-400">Epoch SDK not loaded — intent data will be generated locally.</p>
        )}

        {status && (
          <p className={`text-sm ${status.startsWith('Error') ? 'text-red-400' : 'text-yellow-400'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
