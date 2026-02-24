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
  onSendP2ID: (senderId: string, receiverId: string, faucetId: string, amount: bigint, recallHeight?: number) => Promise<{ success: boolean; noteId?: string } | undefined>;
  onReclaimNotes: (accountId: string) => Promise<boolean | undefined>;
  currentBlockHeight?: number;
  isLoading: boolean;
  isSDKReady: boolean;
}

export function IntentForm({ accounts, faucets, onCreateIntent, onSendP2ID, onReclaimNotes, currentBlockHeight, isLoading, isSDKReady }: Props) {

  const [midenAccountId, setMidenAccountId] = useState('');
  const [faucetId, setFaucetId] = useState('');
  const [amount, setAmount] = useState('100');
  const [outputToken, setOutputToken] = useState(SEPOLIA_TOKENS[0].address); // Default to USDC
  const [customToken, setCustomToken] = useState('');
  const [minTokenOut, setMinTokenOut] = useState('10');
  const [chainId, setChainId] = useState('11155111'); // Sepolia
  const [status, setStatus] = useState('');
  const [evmAddress, setEvmAddress] = useState("0x4235215114484bACDfF0071dB54Dc9faaD3489a9");
  const [recallBlocks, setRecallBlocks] = useState('100'); // ~15-20 min at ~10s/block
  const [reclaimStatus, setReclaimStatus] = useState('');

  const handleReclaim = async () => {
    if (!midenAccountId) return;
    setReclaimStatus('Syncing and checking for reclaimable notes...');
    try {
      const result = await onReclaimNotes(midenAccountId);
      setReclaimStatus(result ? 'Notes reclaimed successfully!' : 'No reclaimable notes found.');
    } catch (err) {
      setReclaimStatus(`Reclaim failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

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

    try {
      const finalOutputToken = customToken || outputToken;
      if (!finalOutputToken || finalOutputToken === '0x0000000000000000000000000000000000000000') {
        setStatus('Error: Please select or enter a valid output token address');
        return;
      }

      setStatus('Checking if deposit needed...');

      const recallOffset = parseInt(recallBlocks) || 100;
      const recallHeight = currentBlockHeight ? currentBlockHeight + recallOffset : undefined;

      const selectedFaucet = faucets.find(f => f.id === faucetId);

      const params: CrossChainIntentParams = {
        midenAccountId,
        midenFaucetId: faucetId,
        midenAmount: amount,
        midenDecimals: selectedFaucet?.decimals ?? 8,
        evmRecipient: evmAddress,
        destinationChainId: parseInt(chainId),
        outputTokenAddress: finalOutputToken,
        minTokenOut,
      };

      // Pass P2ID creation as a callback — SDK calls it only after checkIfDepositNeeded confirms resourceLockRequired
      const sdkParams = {
        ...params,
        collateralType: 'miden' as const,
        midenSourceAccount: midenAccountId,
        // TODO: I guess this function can we named genric as (callback)
        createMidenP2IDNote: async (faucetIdParam: string, amountParam: string, allocatorId: string) => {
          setStatus('Resource lock required — creating P2IDE note on Miden...');
          try {
            const result = await onSendP2ID(midenAccountId, allocatorId, faucetIdParam, BigInt(amountParam), recallHeight);
            if (result?.noteId) {
              console.log('[IntentForm] P2IDE note created:', result.noteId);
            }
            return result || { success: false };
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error('[IntentForm] P2ID creation failed:', errorMsg);
            return { success: false, error: errorMsg };
          }
        },
      };

      const result = await onCreateIntent(sdkParams);
      console.log('[IntentForm] Intent created:', result);
      setStatus('Intent submitted successfully!');
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

        <div className="grid grid-cols-3 gap-3">
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
          <div>
            <label className="block text-xs text-gray-400 mb-1">Recall after (blocks)</label>
            <input
              value={recallBlocks}
              onChange={e => setRecallBlocks(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
              title="Note becomes reclaimable after this many blocks (~10s/block)"
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

        <div className="flex items-center gap-3">
          <button
            onClick={handleReclaim}
            disabled={isLoading || !midenAccountId}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reclaim Expired Notes
          </button>
          {currentBlockHeight && (
            <span className="text-xs text-gray-500">Block: {currentBlockHeight}</span>
          )}
        </div>

        {reclaimStatus && (
          <p className={`text-sm ${reclaimStatus.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
            {reclaimStatus}
          </p>
        )}

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
