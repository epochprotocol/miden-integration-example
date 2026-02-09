import { useState, useCallback } from 'react';
import type { WebClient, TransactionProver, AccountId } from '../types/miden-sdk';

interface ConsumableNote {
  noteId: string;
}

interface UseMidenTransferReturn {
  sendTokens: (senderId: string, receiverId: string, faucetId: string, amount: bigint) => Promise<boolean | undefined>;
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
      const { NoteType } = await import('@demox-labs/miden-sdk');

      await client.syncState();

      // IMPORTANT: Call getAccountId()/getFaucetId() fresh for each SDK call —
      // WASM AccountId objects can be freed/GC'd between async operations.
      console.log('[Miden] Sending tokens via P2ID...');
      const sendTxRequest = client.newSendTransactionRequest(
        getAccountId(senderId),
        getAccountId(receiverId),
        getFaucetId(faucetId),
        NoteType.Public,
        amount,
      );
      await client.submitNewTransaction(getAccountId(senderId), sendTxRequest);

      console.log('[Miden] Send transaction submitted');
      return true;
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
      await client.syncState();
      const notes = await client.getConsumableNotes(getAccountId(accountId));
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
      // IMPORTANT: Call getAccountId() fresh for each SDK call — WASM AccountId
      // objects can be freed/GC'd between async operations.
      await client.syncState();
      const notes = await client.getConsumableNotes(getAccountId(accountId));

      if (!notes || notes.length === 0) {
        setError('No consumable notes found. Wait ~10s after minting then try again.');
        return false;
      }

      const noteIds = notes.map((note) =>
        note.inputNoteRecord().id().toString()
      );
      console.log('[Miden] Consuming notes:', noteIds);

      const consumeTxRequest = client.newConsumeTransactionRequest(noteIds);
      await client.submitNewTransaction(getAccountId(accountId), consumeTxRequest);

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
