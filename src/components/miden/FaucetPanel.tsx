import { useCallback, useMemo, useState } from 'react';
import {
  useAccounts,
  useConsume,
  useCreateFaucet,
  useMint,
  useSyncState,
  useWaitForNotes,
} from '@miden-sdk/react';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';
import { loadFaucets, saveFaucets } from '../../utils/persistence';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  wallets: MidenAccount[];
  onFaucetMetadataChanged: () => void;
}

export function FaucetPanel({ wallets, onFaucetMetadataChanged }: Props) {
  const { sync } = useSyncState();
  const { faucets: faucetHeaders, refetch } = useAccounts();
  const { createFaucet: sdkCreateFaucet, isCreating: isCreatingFaucet, error: createError } = useCreateFaucet();
  const { mint, isLoading: isMinting, error: mintError } = useMint();
  const { consume, isLoading: isConsuming, error: consumeError } = useConsume();
  const { waitForConsumableNotes } = useWaitForNotes();

  const [persistedFaucets, setPersistedFaucets] = useState<MidenFaucetInfo[]>(() => loadFaucets());

  /** Persisted create-faucet rows still present in `useAccounts().faucets` (safe for `useMint`). */
  const mintableFaucets: MidenFaucetInfo[] = useMemo(() => {
    const headerIds = new Set(faucetHeaders.map((h) => h.id().toString().toLowerCase()));
    return persistedFaucets.filter((p) => headerIds.has(p.id.toLowerCase()));
  }, [persistedFaucets, faucetHeaders]);

  const [symbol, setSymbol] = useState('TEST');
  const [decimals, setDecimals] = useState('8');
  const [maxSupply, setMaxSupply] = useState('100000000000000000');

  const [mintFaucetId, setMintFaucetId] = useState('');
  const [mintRecipientId, setMintRecipientId] = useState('');
  const [mintAmount, setMintAmount] = useState('1000');
  /** Covers `waitForConsumableNotes` between mint and consume (no dedicated hook loading). */
  const [comboBusy, setComboBusy] = useState(false);

  /** Canonical faucet id for mint UI + `mint()` — avoids stale picks when the list changes. */
  const resolvedMintFaucetId = useMemo(() => {
    if (mintableFaucets.length === 0) return '';
    const picked = mintFaucetId.trim();
    const match = picked
      ? mintableFaucets.find((f) => f.id.toLowerCase() === picked.toLowerCase())
      : undefined;
    return match?.id ?? mintableFaucets[0].id;
  }, [mintableFaucets, mintFaucetId]);

  const mintBusy = isMinting || isConsuming || comboBusy;

  const runCreateFaucet = useCallback(async () => {
    const dec = parseInt(decimals, 10);
    const max = BigInt(maxSupply);
    const created = await sdkCreateFaucet({
      tokenSymbol: symbol,
      decimals: dec,
      maxSupply: max,
      storageMode: 'public',
    });
    const id = created.id().toString();
    setPersistedFaucets((prev) => {
      const next = [
        ...prev,
        {
          id,
          label: `${symbol} Faucet`,
          type: 'faucet' as const,
          symbol,
          decimals: dec,
          maxSupply: max.toString(),
        },
      ];
      saveFaucets(next);
      return next;
    });
    onFaucetMetadataChanged();
    await refetch();
    await sync();
    return id;
  }, [symbol, decimals, maxSupply, sdkCreateFaucet, onFaucetMetadataChanged, refetch, sync]);

  const handleCreate = () => {
    void toast.promise(runCreateFaucet(), {
      loading: 'Creating faucet…',
      success: 'Faucet created',
      error: (err: Error) => err.message,
    });
  };

  const handleMint = () => {
    if (!resolvedMintFaucetId || !mintRecipientId || !mintAmount) return;
    if (mintableFaucets.length === 0) {
      toast.error('Create a faucet here first, then mint.');
      return;
    }
    void toast.promise(
      (async () => {
        const out = await mint({
          targetAccountId: mintRecipientId,
          faucetId: resolvedMintFaucetId,
          amount: BigInt(mintAmount),
          noteType: 'public',
        });
        console.log('[Miden] mint transactionId:', out.transactionId.toString());
        void waitForConsumableNotes({
          accountId: mintRecipientId,
          minCount: 1,
          timeoutMs: 120_000,
        })
          .then((recs) => {
            console.log(
              '[Miden] minted note id(s) on recipient',
              recs.map((r) => r.inputNoteRecord().id().toString()),
            );
          })
          .catch((e) => console.warn('[Miden] minted note id(s) not ready yet', e));
        await sync();
        await refetch();
        return 'Mint submitted';
      })(),
      {
        loading: 'Minting tokens…',
        success: (msg: string) => msg,
        error: (err: Error) => err.message,
      },
    );
  };

  const handleMintAndConsume = () => {
    if (!resolvedMintFaucetId || !mintRecipientId || !mintAmount) return;
    if (mintableFaucets.length === 0) {
      toast.error('Create a faucet here first, then mint.');
      return;
    }
    void toast.promise(
      (async () => {
        setComboBusy(true);
        try {
          const mintOut = await mint({
            targetAccountId: mintRecipientId,
            faucetId: resolvedMintFaucetId,
            amount: BigInt(mintAmount),
            noteType: 'public',
          });
          console.log('[Miden] mint transactionId:', mintOut.transactionId);
          await sync();
          await refetch();
          const records = await waitForConsumableNotes({
            accountId: mintRecipientId,
            minCount: 1,
            timeoutMs: 45_000,
          });
          if (records.length === 0) {
            return 'Mint done; no consumable notes yet — use Transfer → Consume, or retry.';
          }
          console.log(
            '[Miden] minted note id(s) before consume',
            records.map((r) => r.inputNoteRecord().id().toString()),
          );
          const consumeOut = await consume({
            accountId: mintRecipientId,
            notes: records.map((r) => r.inputNoteRecord()),
          });
          console.log('[Miden] consume transactionId:', consumeOut.transactionId);
          await sync();
          await refetch();
          return 'Minted, consumed, and synced.';
        } finally {
          setComboBusy(false);
        }
      })(),
      {
        loading: 'Mint → wait for notes → consume…',
        success: (msg: string) => msg,
        error: (err: Error) => err.message,
      },
    );
  };

  const hookError = createError?.message ?? mintError?.message ?? consumeError?.message ?? null;

  return (
    <div className="ui-card space-y-6">
      <p className="text-sm leading-relaxed text-neutral-600">
        Create a fungible faucet, mint to a wallet, or use “Mint and consume” to mint then claim notes in one step.
      </p>
      {hookError && <p className="text-sm text-red-700">{hookError}</p>}
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

      {mintableFaucets.length > 0 && wallets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-800">Mint tokens</h3>
          <div className="space-y-3">
            <div>
              <Label>Faucet</Label>
              <SelectRoot value={resolvedMintFaucetId || undefined} onValueChange={(v) => setMintFaucetId(v)}>
                <SelectTrigger aria-label="Select faucet">
                  <SelectValue placeholder="Select faucet" />
                </SelectTrigger>
                <SelectContent>
                  {mintableFaucets.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.symbol} — {f.id.slice(0, 16)}…
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>
            <div>
              <Label>Recipient wallet</Label>
              <SelectRoot value={mintRecipientId || undefined} onValueChange={(v) => setMintRecipientId(v)}>
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
                onClick={handleMint}
                disabled={isMinting || comboBusy || !resolvedMintFaucetId || !mintRecipientId}
              >
                {isMinting ? 'Minting…' : 'Mint only'}
              </Button>
              <Button
                type="button"
                onClick={handleMintAndConsume}
                disabled={mintBusy || !resolvedMintFaucetId || !mintRecipientId}
              >
                {mintBusy ? 'Working…' : 'Mint and consume'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
