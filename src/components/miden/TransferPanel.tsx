import { useAccounts, useConsume, useNotes, useSend, useSyncState } from '@miden-sdk/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';

function waitTwoAnimationFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** `useNotes` only runs when `accountId` is set — avoids `useNotes(undefined)` refetch/sync on every page load. */
function ConsumeNotesBlock({ accountId }: { accountId: string }) {
  const { sync } = useSyncState();
  const { refetch: refetchAccounts } = useAccounts();
  const { consume, isLoading: isConsuming, error: consumeError } = useConsume();
  const {
    consumableNotes,
    refetch: refetchNotes,
    isLoading: notesLoading,
    error: notesError,
  } = useNotes({ status: 'committed', accountId });

  const latestConsumable = useRef(consumableNotes);
  useEffect(() => {
    latestConsumable.current = consumableNotes;
  }, [consumableNotes]);

  const [consumeStatus, setConsumeStatus] = useState('');
  const blockError = useMemo(
    () => notesError?.message ?? consumeError?.message ?? null,
    [notesError, consumeError],
  );

  const handleConsume = () => {
    void toast.promise(
      (async () => {
        await sync();
        await refetchNotes();
        await waitTwoAnimationFrames();
        const notes = latestConsumable.current;
        if (!notes.length) {
          setConsumeStatus('No notes to consume');
          return 'No consumable notes right now';
        }
        await consume({
          accountId,
          notes: notes.map((n) => n.inputNoteRecord()),
        });
        await sync();
        await refetchAccounts();
        await refetchNotes();
        return 'Notes consumed and balances updated';
      })(),
      {
        loading: 'Consuming notes…',
        success: (msg) => msg,
        error: (err) => {
          setConsumeStatus('Consume failed');
          return err instanceof Error ? err.message : 'Consume failed';
        },
      },
    );
  };

  const handleRefreshNotes = () => {
    void toast.promise(
      (async () => {
        await sync();
        await refetchNotes();
        await waitTwoAnimationFrames();
        const n = latestConsumable.current.length;
        return `Found ${n} consumable note${n === 1 ? '' : 's'}`;
      })(),
      {
        loading: 'Checking consumable notes…',
        success: (msg) => msg,
        error: (err) => (err instanceof Error ? err.message : 'Could not refresh notes'),
      },
    );
  };

  return (
    <div className="mt-4 space-y-3">
      {blockError && (
        <p className="text-sm text-red-700">{blockError}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={handleRefreshNotes} disabled={notesLoading}>
          {notesLoading ? 'Checking…' : 'Check notes'}
        </Button>
        <Button type="button" variant="default" onClick={handleConsume} disabled={isConsuming || notesLoading}>
          {isConsuming ? 'Consuming…' : 'Consume all'}
        </Button>
      </div>
      {consumableNotes.length > 0 && (
        <div className="text-sm text-neutral-600">
          {consumableNotes.length} consumable note{consumableNotes.length === 1 ? '' : 's'} found
        </div>
      )}
      {consumeStatus && <p className="text-sm text-amber-800">{consumeStatus}</p>}
    </div>
  );
}

interface Props {
  accounts: MidenAccount[];
  faucets: MidenFaucetInfo[];
}

export function TransferPanel({ accounts, faucets }: Props) {
  const { sync } = useSyncState();
  const { refetch: refetchAccounts } = useAccounts();
  const { send, isLoading: isSending, error: sendError } = useSend();

  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [faucetId, setFaucetId] = useState('');
  const [amount, setAmount] = useState('100');
  const [sendStatus, setSendStatus] = useState('');

  const [consumeAccountId, setConsumeAccountId] = useState('');

  const handleSend = () => {
    if (!senderId || !receiverId || !faucetId || !amount) return;
    void toast.promise(
      (async () => {
        await send({
          from: senderId,
          to: receiverId,
          assetId: faucetId,
          amount: BigInt(amount),
          noteType: 'private',
        });
        await sync();
        await refetchAccounts();
        return 'P2ID note sent — receiver should sync and consume';
      })(),
      {
        loading: 'Sending P2ID note…',
        success: (msg) => msg,
        error: (err) => {
          setSendStatus('Send failed');
          return err instanceof Error ? err.message : 'Send failed';
        },
      },
    );
  };

  if (accounts.length === 0) return null;

  return (
    <div className="ui-card space-y-6">
      {sendError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{sendError.message}</div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Send tokens (P2ID)</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Pay-to-ID: send faucet tokens to another Miden account by ID. The receiver must sync and consume incoming
          notes before balances update.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Sender</Label>
            <SelectRoot value={senderId || undefined} onValueChange={setSenderId}>
              <SelectTrigger aria-label="Select sender">
                <SelectValue placeholder="Select sender" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} — {a.id.slice(0, 16)}…
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label htmlFor="p2id-receiver">Receiver account ID</Label>
            <Input
              id="p2id-receiver"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="Wallet or account ID"
              className="font-mono text-[13px]"
            />
          </div>
          <div>
            <Label>Faucet</Label>
            <SelectRoot value={faucetId || undefined} onValueChange={setFaucetId}>
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
            <Label htmlFor="p2id-amount">Amount</Label>
            <Input id="p2id-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button type="button" onClick={handleSend} disabled={isSending || !senderId || !receiverId || !faucetId}>
            {isSending ? 'Sending…' : 'Send via P2ID'}
          </Button>
          {sendStatus && <p className="text-sm text-amber-800">{sendStatus}</p>}
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Consume notes</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Pick an account, then check or consume notes via <code className="rounded bg-neutral-100 px-1">useNotes</code>{' '}
          + <code className="rounded bg-neutral-100 px-1">useConsume</code> (loads only after you select an account).
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Account</Label>
            <SelectRoot value={consumeAccountId || undefined} onValueChange={setConsumeAccountId}>
              <SelectTrigger aria-label="Select account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label} — {a.id.slice(0, 16)}…
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
          {consumeAccountId ? (
            <ConsumeNotesBlock accountId={consumeAccountId} />
          ) : (
            <p className="text-sm text-neutral-500">Select an account to load consumable notes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
