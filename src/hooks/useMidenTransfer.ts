import type { AccountId, TransactionProver, WebClient } from '@miden-sdk/miden-sdk';
import { useState, useCallback } from 'react';

interface ConsumableNote {
  noteId: string;
}

interface UseMidenTransferReturn {
  sendTokens: (senderId: string, receiverId: string, faucetId: string, amount: bigint) => Promise<{ success: boolean; noteId?: string } | undefined>;
  consumeNotes: (accountId: string) => Promise<boolean | undefined>;
  refreshConsumableNotes: (accountId: string) => Promise<ConsumableNote[]>;
  consumableNotes: ConsumableNote[];
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consumableNotes, setConsumableNotes] = useState<ConsumableNote[]>([]);

  const sendTokens = useCallback(async (
    senderId: string,
    receiverId: string,
    faucetId: string,
    amount: bigint,
  ) => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      const { NoteType, AccountId } = await import('@miden-sdk/miden-sdk');

      await client.syncState();

      // IMPORTANT: Call getAccountId()/getFaucetId() fresh for each SDK call —
      // WASM AccountId objects can be freed/GC'd between async operations.
      // If the account isn't in our ref (returns string), parse via AccountId.fromHex().
      const resolveId = (raw: AccountId | string): AccountId =>
        typeof raw === 'string' ? AccountId.fromHex(raw) : raw;

      console.log('[Miden] Sending tokens via P2ID...');
      const sendTxRequest = client.newSendTransactionRequest(
        resolveId(getAccountId(senderId)),
        resolveId(getAccountId(receiverId)),
        resolveId(getFaucetId(faucetId)),
        NoteType.Public,
        amount,
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
      setIsLoading(false);
    }
  }, [client, getAccountId, getFaucetId]);

  const refreshConsumableNotes = useCallback(async (accountId: string) => {
    if (!client) return [];

    setIsLoading(true);
    setError(null);

    try {
      const { AccountId } = await import('@miden-sdk/miden-sdk');
      const resolveId = (raw: AccountId | string): AccountId =>
        typeof raw === 'string' ? AccountId.fromHex(raw) : raw;

      await client.syncState();
      const notes = await client.getConsumableNotes(resolveId(getAccountId(accountId)));
      const mapped: ConsumableNote[] = notes.map((note) => ({
        noteId: note.inputNoteRecord().id().toString(),
      }));

      setConsumableNotes(mapped);
      console.log(`[Miden] Found ${mapped.length} consumable note(s)`);
      return mapped;
    } catch (err) {
      console.error('[Miden] Refresh notes error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch consumable notes');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [client, getAccountId]);

  const consumeNotes = useCallback(async (accountId: string) => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      const { AccountId } = await import('@miden-sdk/miden-sdk');
      // IMPORTANT: Call getAccountId() fresh for each SDK call — WASM AccountId
      // objects can be freed/GC'd between async operations.
      const resolveId = (raw: AccountId | string): AccountId =>
        typeof raw === 'string' ? AccountId.fromHex(raw) : raw;

      await client.syncState();
      const notes = await client.getConsumableNotes(resolveId(getAccountId(accountId)));

      if (!notes || notes.length === 0) {
        setError('No consumable notes found. Wait ~10s after minting then try again.');
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
      setIsLoading(false);
    }
  }, [client, getAccountId]);

  return { sendTokens, consumeNotes, refreshConsumableNotes, consumableNotes, isLoading, error };
}
