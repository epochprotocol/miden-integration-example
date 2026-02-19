import { useState } from 'react';
import type { MidenAccount, MidenFaucetInfo, CrossChainIntentParams } from '../../types/miden';


 const ALLOCATOR_MIDEN_ACCOUNT_ID = '0x917c80a6789b83101adcc7e9f5671a';

// Supported Sepolia testnet tokens (from epoch-commons-sdk testnetGraph)
const SEPOLIA_TOKENS = [
  { symbol: 'USDC', address: '0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69' },
  { symbol: 'DAI', address: '0xc30f1Ce05d1434d484E9A47283aA925fc8A8699a' },
  { symbol: 'USDT', address: '0xc04d2869665Be874881133943523723Be5782720' },
  { symbol: 'WETH', address: '0x7946dd86eE310D0aC16804A37787289Fa5b88A8A' },
  { symbol: 'WBTC', address: '0x9b2a2754a9182fD65360E23afCDf3BeFF51796E9' },
  { symbol: 'PENGU', address: '0xEA7dC9849206Ce73b11c465d37b85eC06B11Cf2C' },
  { symbol: 'OSWALD', address: '0xB588418c0f90F07Bc9587d0050845a90C23C7502' },
  { symbol: 'KICK', address: '0x512Ee6Bd7A4be5Ba4796F15Df080c4D0F89a38eD' },
  { symbol: 'FERB', address: '0x145e03A80c19ad1b9d0429d06b6d52707de724A0' },
  { symbol: 'Custom', address: '' }, // For manual entry
];

interface Props {
  accounts: MidenAccount[];
  faucets: MidenFaucetInfo[];
  onCreateIntent: (params: CrossChainIntentParams) => Promise<any>;
  onSendP2ID: (senderId: string, receiverId: string, faucetId: string, amount: bigint) => Promise<{ success: boolean; noteId?: string } | undefined>;
  isLoading: boolean;
  isSDKReady: boolean;
}

export function IntentForm({ accounts, faucets, onCreateIntent, onSendP2ID, isLoading, isSDKReady }: Props) {

  const [midenAccountId, setMidenAccountId] = useState('');
  const [faucetId, setFaucetId] = useState('');
  const [amount, setAmount] = useState('100');
  const [outputToken, setOutputToken] = useState(SEPOLIA_TOKENS[0].address); // Default to USDC
  const [customToken, setCustomToken] = useState('');
  const [minTokenOut, setMinTokenOut] = useState('10');
  const [chainId, setChainId] = useState('11155111'); // Sepolia
  const [status, setStatus] = useState('');
  const [evmAddress, setEvmAddress] = useState("0x4235215114484bACDfF0071dB54Dc9faaD3489a9");

  const handleSubmit = async () => {
    if (!midenAccountId || !faucetId || !amount || !evmAddress) return;

    console.log('[IntentForm] Starting cross-chain intent submission...');
    console.log('[IntentForm] Form data:', {
      midenAccountId,
      faucetId: faucetId.slice(0, 16) + '...',
      amount,
      evmAddress,
      chainId,
      outputToken,
      minTokenOut,
      allocatorAccountId: ALLOCATOR_MIDEN_ACCOUNT_ID,
    });

    let midenNoteId: string | undefined;

    try {
      // Step 1: Send P2ID note to allocator on Miden side
        setStatus('Step 1/2: Sending P2ID note to allocator on Miden...');

        console.log('[IntentForm] Sending P2ID note to allocator:');
        try {
          const result = await onSendP2ID(midenAccountId, ALLOCATOR_MIDEN_ACCOUNT_ID, faucetId, BigInt(amount));
          midenNoteId = result?.noteId;
          console.log('[IntentForm] P2ID note sent successfully, noteId:', midenNoteId);
          setStatus('✓ P2ID note sent to allocator. Building intent data...');
        } catch (err) {
          // P2ID may fail if allocator account doesn't exist or is invalid
          console.error('[IntentForm] P2ID send failed:', err);
          setStatus('⚠️  P2ID note failed (allocator may not exist). Building intent data...');
        }


      // Step 2: Build cross-chain intent via Epoch SDK
      console.log('[IntentForm] Building cross-chain intent via Epoch SDK...');
      setStatus('Step 2/2: Building cross-chain intent via Epoch SDK...');
      // Use custom token if provided, otherwise use selected token
      const finalOutputToken = customToken || outputToken;

      console.log('[IntentForm] 🔍 TOKEN VALIDATION:');
      console.log('  outputToken (from dropdown):', outputToken);
      console.log('  customToken (manual entry):', customToken);
      console.log('  finalOutputToken (will be sent):', finalOutputToken);

      if (!finalOutputToken || finalOutputToken === '0x0000000000000000000000000000000000000000') {
        const errorMsg = 'Error: Please select or enter a valid output token address';
        console.error('[IntentForm] ❌', errorMsg);
        setStatus(errorMsg);
        return;
      }

      const params: CrossChainIntentParams = {
        midenAccountId,
        midenFaucetId: faucetId,
        midenAmount: amount,
        midenNoteId,
        evmRecipient: evmAddress,
        destinationChainId: parseInt(chainId),
        outputTokenAddress: finalOutputToken,
        minTokenOut,
      };
      console.log('[IntentForm] ✅ Calling onCreateIntent with params:', params);
      const result = await onCreateIntent(params);
      console.log('[IntentForm] Intent created successfully:', result);
      setStatus('Intent built successfully!');
    } catch (err) {
      console.error('[IntentForm] Intent submission failed:', err);
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
            value={"0x4235215114484bACDfF0071dB54Dc9faaD3489a9"}
            onChange={(e) => setEvmAddress(e.target.value)}
            className="w-full bg-gray-700/50 text-gray-400 rounded-lg px-3 py-2 text-sm font-mono"
            placeholder="Connect EVM wallet above"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Output Token (on {chainId === '11155111' ? 'Sepolia' : 'destination chain'})</label>
            <select
              value={outputToken}
              onChange={e => {
                setOutputToken(e.target.value);
                if (e.target.value !== '') {
                  setCustomToken(''); // Clear custom input when selecting from dropdown
                }
              }}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              {SEPOLIA_TOKENS.map(token => (
                <option key={token.symbol} value={token.address}>
                  {token.symbol} {token.address && `— ${token.address.slice(0, 10)}...`}
                </option>
              ))}
            </select>
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

        {outputToken === '' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Custom Token Address</label>
            <input
              value={customToken}
              onChange={e => setCustomToken(e.target.value)}
              placeholder="0x..."
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
        )}

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
