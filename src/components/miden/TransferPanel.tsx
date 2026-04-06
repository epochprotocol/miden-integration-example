import { useState } from 'react';
import type { MidenAccount, MidenFaucetInfo } from '../../types/miden';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  accounts: MidenAccount[];
  faucets: MidenFaucetInfo[];
  onSendTokens: (
    senderId: string,
    receiverId: string,
    faucetId: string,
    amount: bigint,
  ) => Promise<{ success: boolean; noteId?: string } | undefined>;
  onConsumeNotes: (accountId: string) => Promise<boolean | undefined>;
  onRefreshConsumable: (accountId: string) => Promise<any>;
  onSyncBalance: () => Promise<void>;
  consumableNotes: { noteId: string }[];
  isSending: boolean;
  isConsuming: boolean;
  isRefreshingNotes: boolean;
}

export function TransferPanel({
  accounts,
  faucets,
  onSendTokens,
  onConsumeNotes,
  onRefreshConsumable,
  onSyncBalance,
  consumableNotes,
  isSending,
  isConsuming,
  isRefreshingNotes,
}: Props) {
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [faucetId, setFaucetId] = useState('');
  const [amount, setAmount] = useState('100');
  const [sendStatus, setSendStatus] = useState('');

  const [consumeAccountId, setConsumeAccountId] = useState('');
  const [consumeStatus, setConsumeStatus] = useState('');

  const handleSend = () => {
    if (!senderId || !receiverId || !faucetId || !amount) return;
    void toast.promise(
      (async () => {
        await onSendTokens(senderId, receiverId, faucetId, BigInt(amount));
      })(),
      {
        loading: 'Sending P2ID note…',
        success: 'P2ID note sent — receiver should sync and consume',
        error: (err) => {
          setSendStatus('Send failed');
          return err instanceof Error ? err.message : 'Send failed';
        },
      },
    );
  };

  const handleConsume = () => {
    if (!consumeAccountId) return;
    void toast.promise(
      (async () => {
        const result = await onConsumeNotes(consumeAccountId);
        if (result) await onSyncBalance();
        if (!result) {
          setConsumeStatus('No notes to consume');
          return 'No consumable notes right now';
        }
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
    if (!consumeAccountId) return;
    void toast.promise(
      (async () => {
        const notes = await onRefreshConsumable(consumeAccountId);
        return `Found ${notes.length} consumable note${notes.length === 1 ? '' : 's'}`;
      })(),
      {
        loading: 'Checking consumable notes…',
        success: (msg) => msg,
        error: (err) => (err instanceof Error ? err.message : 'Could not refresh notes'),
      },
    );
  };

  if (accounts.length === 0) return null;

  return (
    <div className="ui-card space-y-6">
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
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending || !senderId || !receiverId || !faucetId}
          >
            {isSending ? 'Sending…' : 'Send via P2ID'}
          </Button>
          {sendStatus && <p className="text-sm text-amber-800">{sendStatus}</p>}
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Consume notes</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Apply pending incoming P2ID (or similar) notes to this account’s vault. Use “Check notes” first if you are
          unsure anything is waiting; “Consume all” finalizes what the node reports as consumable.
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
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleRefreshNotes}
              disabled={isRefreshingNotes || !consumeAccountId}
            >
              {isRefreshingNotes ? 'Checking…' : 'Check notes'}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleConsume}
              disabled={isConsuming || !consumeAccountId}
            >
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
      </div>
    </div>
  );
}
