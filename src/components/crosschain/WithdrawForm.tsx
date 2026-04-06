import { useState } from 'react';
import type { MidenAccount, MidenFaucetInfo, EVMToMidenIntentParams } from '../../types/miden';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const TOKEN_CUSTOM = '__custom__';

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

  const tokenSelectValue = evmToken === '' ? TOKEN_CUSTOM : evmToken;

  const handleSubmit = () => {
    const finalToken = customToken || evmToken;
    if (!finalToken || !amount || !midenRecipientId || !midenFaucetId || !evmAddress) return;

    const selectedFaucet = faucets.find((f) => f.id === midenFaucetId);
    const selectedToken = SEPOLIA_TOKENS.find((t) => t.address === finalToken);

    const params: EVMToMidenIntentParams = {
      evmSourceAddress: evmAddress,
      evmTokenAddress: finalToken,
      evmAmount: amount,
      evmTokenDecimals: selectedToken?.decimals ?? 18,
      sourceChainId: parseInt(chainId, 10),
      midenRecipientId,
      midenFaucetId,
      midenDecimals: selectedFaucet?.decimals ?? 8,
    };

    void toast.promise(
      (async () => {
        setStatus('Submitting withdraw intent…');
        const result = await onWithdraw(params);
        if (result?.error) throw new Error(result.error);
        setStatus('Withdraw intent submitted successfully.');
        return 'Withdraw intent submitted';
      })(),
      {
        loading: 'Submitting withdraw intent…',
        success: (msg) => msg,
        error: (err) => {
          const msg = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
          setStatus(msg);
          return msg;
        },
      },
    );
  };

  return (
    <div className="ui-card">
      <h2 className="text-base font-semibold text-neutral-900">Intent details</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Move ERC-20 from your connected EVM wallet into a Miden wallet and faucet. Amounts use the token’s decimals on
        the source chain.
      </p>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Source (EVM token)</Label>
            <SelectRoot
              value={tokenSelectValue}
              onValueChange={(v) => {
                if (v === TOKEN_CUSTOM) {
                  setEvmToken('');
                  setCustomToken('');
                } else {
                  setEvmToken(v);
                  setCustomToken('');
                }
              }}
            >
              <SelectTrigger aria-label="Select EVM token">
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                {SEPOLIA_TOKENS.map((token) => (
                  <SelectItem
                    key={token.symbol}
                    value={token.address === '' ? TOKEN_CUSTOM : token.address}
                  >
                    {token.symbol}
                    {token.address ? ` · ${token.address.slice(0, 10)}…` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label htmlFor="wd-amount">Amount</Label>
            <Input id="wd-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        {evmToken === '' && (
          <div>
            <Label htmlFor="wd-custom">Custom token address</Label>
            <Input
              id="wd-custom"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              placeholder="0x…"
              className="font-mono text-[13px]"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="wd-chain">Source chain ID</Label>
            <Input id="wd-chain" value={chainId} onChange={(e) => setChainId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="wd-evm">EVM source wallet</Label>
            <Input
              id="wd-evm"
              value={evmAddress}
              onChange={(e) => setEvmAddress(e.target.value)}
              variant="dim"
              className="font-mono text-[13px]"
              placeholder="0x…"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Destination (Miden wallet)</Label>
            <SelectRoot value={midenRecipientId || undefined} onValueChange={setMidenRecipientId}>
              <SelectTrigger aria-label="Select Miden recipient">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.type === 'wallet')
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label} — {a.id.slice(0, 16)}…
                    </SelectItem>
                  ))}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label>Miden faucet</Label>
            <SelectRoot value={midenFaucetId || undefined} onValueChange={setMidenFaucetId}>
              <SelectTrigger aria-label="Select Miden faucet">
                <SelectValue placeholder="Select faucet" />
              </SelectTrigger>
              <SelectContent>
                {faucets.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.symbol} — {f.id.slice(0, 16)}…
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={
            isLoading || !midenRecipientId || !midenFaucetId || !evmAddress || !(customToken || evmToken)
          }
        >
          {isLoading ? 'Processing…' : 'Withdraw to Miden'}
        </Button>

        {status && (
          <p className={`text-sm ${status.startsWith('Error') ? 'text-red-600' : 'text-amber-800'}`}>{status}</p>
        )}
      </div>
    </div>
  );
}
