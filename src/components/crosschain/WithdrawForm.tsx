import { useState } from 'react';
import type { MidenAccount, MidenFaucetInfo, EVMToMidenIntentParams } from '../../types/miden';

const SEPOLIA_TOKENS = [
  { symbol: 'USDT', address: '0xc04d2869665Be874881133943523723Be5782720', decimals: 18 },
  { symbol: 'USDC', address: '0x2BB4FfD7E2c6D432b697554Efd77fA13bdbefd69', decimals: 18 },
  { symbol: 'DAI', address: '0xc30f1Ce05d1434d484E9A47283aA925fc8A8699a', decimals: 18 },
  { symbol: 'WETH', address: '0x7946dd86eE310D0aC16804A37787289Fa5b88A8A', decimals: 18 },
  { symbol: 'WBTC', address: '0x9b2a2754a9182fD65360E23afCDf3BeFF51796E9', decimals: 18 },
  { symbol: 'PENGU', address: '0xEA7dC9849206Ce73b11c465d37b85eC06B11Cf2C', decimals: 18 },
  { symbol: 'OSWALD', address: '0xB588418c0f90F07Bc9587d0050845a90C23C7502', decimals: 18 },
  { symbol: 'KICK', address: '0x512Ee6Bd7A4be5Ba4796F15Df080c4D0F89a38eD', decimals: 18 },
  { symbol: 'FERB', address: '0x145e03A80c19ad1b9d0429d06b6d52707de724A0', decimals: 18 },
  { symbol: 'Custom', address: '', decimals: 18 },
];

interface Props {
  accounts: MidenAccount[];
  faucets: MidenFaucetInfo[];
  onWithdraw: (params: EVMToMidenIntentParams) => Promise<any>;
  isLoading: boolean;
}

export function WithdrawForm({ accounts, faucets, onWithdraw, isLoading }: Props) {
  const [evmToken, setEvmToken] = useState(SEPOLIA_TOKENS[0].address);
  const [customToken, setCustomToken] = useState('');
  const [amount, setAmount] = useState('100');
  const [chainId, setChainId] = useState('11155111');
  const [midenRecipientId, setMidenRecipientId] = useState('');
  const [midenFaucetId, setMidenFaucetId] = useState('');
  const [evmAddress, setEvmAddress] = useState('0x4235215114484bACDfF0071dB54Dc9faaD3489a9');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    const finalToken = customToken || evmToken;
    if (!finalToken || !amount || !midenRecipientId || !midenFaucetId || !evmAddress) return;

    console.log('[WithdrawForm] Submitting EVM→Miden withdraw...');

    const selectedFaucet = faucets.find(f => f.id === midenFaucetId);

    const selectedToken = SEPOLIA_TOKENS.find(t => t.address === finalToken);

    const params: EVMToMidenIntentParams = {
      evmSourceAddress: evmAddress,
      evmTokenAddress: finalToken,
      evmAmount: amount,
      evmTokenDecimals: selectedToken?.decimals ?? 18,
      sourceChainId: parseInt(chainId),
      midenRecipientId,
      midenFaucetId,
      midenDecimals: selectedFaucet?.decimals ?? 8,
    };

    try {
      setStatus('Submitting withdraw intent...');
      const result = await onWithdraw(params);
      console.log('[WithdrawForm] Withdraw intent created:', result);
      setStatus(result?.error ? `Error: ${result.error}` : 'Withdraw intent submitted successfully!');
    } catch (err) {
      console.error('[WithdrawForm] Withdraw failed:', err);
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Withdraw to Miden</h2>
      <p className="text-sm text-gray-400 mb-4">
        Move funds from EVM back to a Miden wallet via an Epoch intent.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Source (EVM Token)</label>
            <select
              value={evmToken}
              onChange={e => {
                setEvmToken(e.target.value);
                if (e.target.value !== '') {
                  setCustomToken('');
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
            <label className="block text-xs text-gray-400 mb-1">Amount</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {evmToken === '' && (
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Source Chain ID</label>
            <input
              value={chainId}
              onChange={e => setChainId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">EVM Source Wallet</label>
            <input
              value={evmAddress}
              onChange={e => setEvmAddress(e.target.value)}
              className="w-full bg-gray-700/50 text-gray-400 rounded-lg px-3 py-2 text-sm font-mono"
              placeholder="Connect EVM wallet above"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Destination (Miden Wallet)</label>
            <select
              value={midenRecipientId}
              onChange={e => setMidenRecipientId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select wallet</option>
              {accounts.filter(a => a.type === 'wallet').map(a => (
                <option key={a.id} value={a.id}>{a.label} — {a.id.slice(0, 16)}...</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Miden Faucet</label>
            <select
              value={midenFaucetId}
              onChange={e => setMidenFaucetId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select faucet</option>
              {faucets.map(f => (
                <option key={f.id} value={f.id}>{f.symbol} — {f.id.slice(0, 16)}...</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !midenRecipientId || !midenFaucetId || !evmAddress || !(customToken || evmToken)}
          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Processing...' : 'Withdraw to Miden'}
        </button>

        {status && (
          <p className={`text-sm ${status.startsWith('Error') ? 'text-red-400' : 'text-yellow-400'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
