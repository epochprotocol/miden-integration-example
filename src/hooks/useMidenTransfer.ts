import type { AccountId, TransactionProver, WebClient } from '@miden-sdk/miden-sdk';
import { useState, useCallback } from 'react';

interface ConsumableNote {
  noteId: string;
}

interface UseMidenTransferReturn {
  sendTokens: (senderId: string, receiverId: string, faucetId: string, amount: bigint, recallHeight?: number) => Promise<{ success: boolean; noteId?: string } | undefined>;
  consumeNotes: (accountId: string) => Promise<boolean | undefined>;
  refreshConsumableNotes: (accountId: string) => Promise<ConsumableNote[]>;
  consumableNotes: ConsumableNote[];
  /** @deprecated use isSending, isConsuming, or isRefreshingNotes */
  isLoading: boolean;
  isSending: boolean;
  isConsuming: boolean;
  isRefreshingNotes: boolean;
  error: string | null;
}

/**
 * React hook for P2ID token transfers and consuming notes.
 *
 * IMPORTANT: Calls getAccountId()/getFaucetId() fresh for each SDK method call
 * to avoid WASM AccountId garbage collection issues.
 */
export function useMidenTransfer(
  client: WebClient | null,
  _prover: TransactionProver | null,
  getAccountId: (idStr: string) => AccountId | string,
  getFaucetId: (idStr: string) => AccountId | string,
): UseMidenTransferReturn {
  const [isSending, setIsSending] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [isRefreshingNotes, setIsRefreshingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consumableNotes, setConsumableNotes] = useState<ConsumableNote[]>([]);

  const sendTokens = useCallback(async (
    senderId: string,
    receiverId: string,
    faucetId: string,
    amount: bigint,
    recallHeight?: number,
  ) => {
    if (!client) return;

    setIsSending(true);
    setError(null);

    try {
      const { NoteType, AccountId } = await import('@miden-sdk/miden-sdk');

      await client.syncState();

      // IMPORTANT: Call getAccountId()/getFaucetId() fresh for each SDK call —
      // WASM AccountId objects can be freed/GC'd between async operations.
      // If the account isn't in our ref (returns string), parse via AccountId.fromHex().
      const resolveId = (raw: AccountId | string): AccountId =>
        typeof raw === 'string' ? AccountId.fromHex(raw) : raw;

      const noteType = recallHeight ? 'P2IDE (recallable)' : 'P2ID';
      console.log(`[Miden] Sending tokens via ${noteType}...`);
      const sendTxRequest = client.newSendTransactionRequest(
        resolveId(getAccountId(senderId)),
        resolveId(getAccountId(receiverId)),
        resolveId(getFaucetId(faucetId)),
        NoteType.Public,
        amount,
        recallHeight ?? null,  // recall_height: sender can reclaim after this block
        null,                  // timelock_height: no timelock
      );

      // Extract note ID from expected output notes before submission
      const expectedNotes = sendTxRequest.expectedOutputOwnNotes();
      const noteId = expectedNotes.length > 0 ? expectedNotes[0].id().toString() : undefined;
      console.log('[Miden] Expected output note ID:', noteId);

      await client.submitNewTransaction(resolveId(getAccountId(senderId)), sendTxRequest);

      console.log('[Miden] Send transaction submitted');
      return { success: true, noteId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send tokens';
      console.error('[Miden] Send error:', err);
      setError(message);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [client, getAccountId, getFaucetId]);

  const refreshConsumableNotes = useCallback(async (accountId: string) => {
    if (!client) return [];

    setIsRefreshingNotes(true);
    setError(null);

    try {
      const { AccountId } = await import('@miden-sdk/miden-sdk');
      const resolveId = (raw: AccountId | string): AccountId =>
        typeof raw === 'string' ? AccountId.fromHex(raw) : raw;

      const syncSummary = await client.syncState();
      const currentBlock = syncSummary.blockNum();
      const notes = await client.getConsumableNotes(resolveId(getAccountId(accountId)));

      // Filter out notes that aren't consumable yet (e.g. P2IDE notes before recall height)
      const consumableNow = notes.filter((note) => {
        const consumabilities = note.noteConsumability();
        if (!consumabilities || consumabilities.length === 0) return true;
        return consumabilities.some((c) => {
          const afterBlock = c.consumptionStatus().consumableAfterBlock();
          return afterBlock === undefined || afterBlock <= currentBlock;
        });
      });

      const mapped: ConsumableNote[] = consumableNow.map((note) => ({
        noteId: note.inputNoteRecord().id().toString(),
      }));

      setConsumableNotes(mapped);
      console.log(`[Miden] Found ${mapped.length} consumable note(s) at block ${currentBlock} (${notes.length} total)`);
      return mapped;
    } catch (err) {
      console.error('[Miden] Refresh notes error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch consumable notes');
      return [];
    } finally {
      setIsRefreshingNotes(false);
    }
  }, [client, getAccountId]);

  const consumeNotes = useCallback(async (accountId: string) => {
    if (!client) return;

    setIsConsuming(true);
    setError(null);

    try {
      const { AccountId } = await import('@miden-sdk/miden-sdk');
      // IMPORTANT: Call getAccountId() fresh for each SDK call — WASM AccountId
      // objects can be freed/GC'd between async operations.
      const resolveId = (raw: AccountId | string): AccountId =>
        typeof raw === 'string' ? AccountId.fromHex(raw) : raw;

      const syncSummary = await client.syncState();
      const currentBlock = syncSummary.blockNum();
      const allNotes = await client.getConsumableNotes(resolveId(getAccountId(accountId)));

      // Only consume notes that are actually consumable at the current block height
      const notes = allNotes.filter((note) => {
        const consumabilities = note.noteConsumability();
        if (!consumabilities || consumabilities.length === 0) return true;
        return consumabilities.some((c) => {
          const afterBlock = c.consumptionStatus().consumableAfterBlock();
          return afterBlock === undefined || afterBlock <= currentBlock;
        });
      });

      if (!notes || notes.length === 0) {
        setError('No consumable notes found. P2IDE notes become reclaimable after the recall block height.');
        return false;
      }

      const noteObjects = notes.map((note) =>
        note.inputNoteRecord().toNote()
      );
      console.log('[Miden] Consuming notes:', noteObjects.map(n => n.id().toString()));

      const consumeTxRequest = client.newConsumeTransactionRequest(noteObjects);
      await client.submitNewTransaction(resolveId(getAccountId(accountId)), consumeTxRequest);

      await client.syncState();
      console.log('[Miden] Notes consumed');
      setConsumableNotes([]);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to consume notes';
      console.error('[Miden] Consume error:', err);
      setError(message);
      throw err;
    } finally {
      setIsConsuming(false);
    }
  }, [client, getAccountId]);

  return {
    sendTokens,
    consumeNotes,
    refreshConsumableNotes,
    consumableNotes,
    isLoading: isSending || isConsuming || isRefreshingNotes,
    isSending,
    isConsuming,
    isRefreshingNotes,
    error,
  };
}
