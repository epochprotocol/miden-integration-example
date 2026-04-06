import { useState, useRef, useCallback } from 'react';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  faucets: MidenFaucetInfo[];
  wallets: MidenAccount[];
  onCreateFaucet: (symbol: string, decimals: number, maxSupply: bigint) => Promise<string | undefined>;
  onMintTokens: (recipientId: string, faucetId: string, amount: bigint) => Promise<boolean | undefined>;
  onConsumeNotes: (accountId: string) => Promise<boolean | undefined>;
  onSyncBalance: () => Promise<void>;
  isCreatingFaucet: boolean;
  isMinting: boolean;
  isConsumingNotes: boolean;
}

export function FaucetPanel({
  faucets,
  wallets,
  onCreateFaucet,
  onMintTokens,
  onConsumeNotes,
  onSyncBalance,
  isCreatingFaucet,
  isMinting,
  isConsumingNotes,
}: Props) {
  const [symbol, setSymbol] = useState('TEST');
  const [decimals, setDecimals] = useState('8');
  const [maxSupply, setMaxSupply] = useState('100000000000000000');

  const [mintFaucetId, setMintFaucetId] = useState('');
  const [mintRecipientId, setMintRecipientId] = useState('');
  const [mintAmount, setMintAmount] = useState('1000');
  const [mintStatus, setMintStatus] = useState('');

  const [flowStep, setFlowStep] = useState<number>(0);
  const [countdown, setCountdown] = useState(0);
  const [isFlowRunning, setIsFlowRunning] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mintFlowBusy = isMinting || isConsumingNotes;

  const handleCreate = () => {
    void toast.promise(
      (async () => {
        const id = await onCreateFaucet(symbol, parseInt(decimals, 10), BigInt(maxSupply));
        if (!id) throw new Error('Miden client not ready');
      })(),
      {
        loading: 'Creating faucet…',
        success: 'Faucet created',
        error: (err) => (err instanceof Error ? err.message : 'Failed to create faucet'),
      },
    );
  };

  const handleMint = () => {
    if (!mintFaucetId || !mintRecipientId || !mintAmount) return;
    void toast.promise(
      (async () => {
        const ok = await onMintTokens(mintRecipientId, mintFaucetId, BigInt(mintAmount));
        if (!ok) throw new Error('Mint did not complete');
      })(),
      {
        loading: 'Minting tokens…',
        success: 'Mint submitted — wait ~10s or use Consume notes on the recipient wallet',
        error: (err) => (err instanceof Error ? err.message : 'Mint failed'),
      },
    );
  };

  const handleMintAndConsume = useCallback(() => {
    if (!mintFaucetId || !mintRecipientId || !mintAmount) return;
    setMintStatus('');
    void toast.promise(
      (async () => {
        setIsFlowRunning(true);
        try {
          setFlowStep(1);
          const mintOk = await onMintTokens(mintRecipientId, mintFaucetId, BigInt(mintAmount));
          if (!mintOk) throw new Error('Mint did not complete');

          setFlowStep(2);
          setCountdown(12);
          await new Promise<void>((resolve) => {
            let remaining = 12;
            countdownRef.current = setInterval(() => {
              remaining -= 1;
              setCountdown(remaining);
              if (countdownRef.current && remaining <= 0) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
                resolve();
              }
            }, 1000);
          });

          setFlowStep(3);
          const result = await onConsumeNotes(mintRecipientId);

          setFlowStep(4);
          await onSyncBalance();

          setFlowStep(0);
          if (!result) {
            setMintStatus('Mint succeeded but no notes to consume — they may need more time.');
            return 'Mint done; nothing to consume yet — try Consume notes in a few seconds.';
          }
          setMintStatus('Tokens minted and consumed. Balance updated.');
          return 'Tokens minted, consumed, and balances refreshed.';
        } catch (err) {
          setFlowStep(0);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          const msg = err instanceof Error ? err.message : 'Flow failed';
          setMintStatus(`Flow failed: ${msg}`);
          throw err;
        } finally {
          setIsFlowRunning(false);
        }
      })(),
      {
        loading: 'Running mint and consume flow…',
        success: (msg) => msg,
        error: (err) => (err instanceof Error ? err.message : 'Flow failed'),
      },
    );
  }, [mintFaucetId, mintRecipientId, mintAmount, onMintTokens, onConsumeNotes, onSyncBalance]);

  const stepLabels = [
    '',
    'Minting tokens…',
    `Waiting for settlement… ${countdown}s`,
    'Consuming notes…',
    'Refreshing balances…',
  ];

  return (
    <div className="ui-card space-y-6">
      <p className="text-sm leading-relaxed text-neutral-600">
        Faucets are mintable token contracts on the Miden testnet. Create one, then mint to a wallet (optionally use
        “Mint and consume” to settle notes in one go).
      </p>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Create faucet</h2>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="faucet-symbol">Symbol</Label>
            <Input id="faucet-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="faucet-decimals">Decimals</Label>
            <Input
              id="faucet-decimals"
              value={decimals}
              onChange={(e) => setDecimals(e.target.value)}
              type="number"
            />
          </div>
          <div>
            <Label htmlFor="faucet-max">Max supply</Label>
            <Input id="faucet-max" value={maxSupply} onChange={(e) => setMaxSupply(e.target.value)} />
          </div>
        </div>
        <Button type="button" onClick={handleCreate} disabled={isCreatingFaucet}>
          {isCreatingFaucet ? 'Creating…' : 'Create faucet'}
        </Button>
      </div>

      {faucets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-800">Created faucets</h3>
          <div className="space-y-2">
            {faucets.map((f) => (
              <div key={f.id} className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="text-sm text-neutral-600">
                  {f.symbol} (decimals: {f.decimals})
                </div>
                <div className="break-all font-mono text-sm text-neutral-900">{f.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {faucets.length > 0 && wallets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-800">Mint tokens</h3>
          <div className="space-y-3">
            <div>
              <Label>Faucet</Label>
              <SelectRoot
                value={mintFaucetId || undefined}
                onValueChange={(v) => setMintFaucetId(v)}
              >
                <SelectTrigger aria-label="Select faucet">
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
            <div>
              <Label>Recipient wallet</Label>
              <SelectRoot
                value={mintRecipientId || undefined}
                onValueChange={(v) => setMintRecipientId(v)}
              >
                <SelectTrigger aria-label="Select recipient wallet">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.label} — {w.id.slice(0, 16)}…
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>
            <div>
              <Label htmlFor="mint-amount">Amount</Label>
              <Input id="mint-amount" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="accent"
                onClick={handleMint}
                disabled={mintFlowBusy || isFlowRunning || !mintFaucetId || !mintRecipientId}
              >
                {isMinting ? 'Minting…' : 'Mint only'}
              </Button>
              <Button
                type="button"
                onClick={handleMintAndConsume}
                disabled={mintFlowBusy || isFlowRunning || !mintFaucetId || !mintRecipientId}
              >
                {isFlowRunning ? 'Running…' : 'Mint and consume'}
              </Button>
            </div>

            {flowStep > 0 && (
              <div className="ui-card-muted space-y-2">
                <div className="text-sm font-medium text-primary">{stepLabels[flowStep]}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        step < flowStep
                          ? 'bg-primary'
                          : step === flowStep
                            ? 'animate-pulse bg-primary/60'
                            : 'bg-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>Mint</span>
                  <span>Wait</span>
                  <span>Consume</span>
                  <span>Sync</span>
                </div>
              </div>
            )}

            {mintStatus && (
              <p
                className={`text-sm ${
                  mintStatus.includes('failed') || mintStatus.includes('Failed')
                    ? 'text-red-600'
                    : 'text-amber-800'
                }`}
              >
                {mintStatus}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
