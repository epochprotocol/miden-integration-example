import { useAccounts, useSend, useSyncState } from '@miden-sdk/react';
import { useCallback, useMemo } from 'react';

interface UseMidenTransferReturn {
  sendTokens: (
    senderId: string,
    receiverId: string,
    faucetId: string,
    amount: bigint,
    recallHeight?: number,
  ) => Promise<{ success: boolean; noteId?: string; txId?: string } | undefined>;
  isSending: boolean;
  error: string | null;
}

/** P2ID / P2IDE send for `IntentForm` and any caller that needs `useSend` with a stable callback shape. */
export function useMidenTransfer(): UseMidenTransferReturn {
  const { send, isLoading: isSending, error: sendError } = useSend();
  const { sync } = useSyncState();
  const { refetch: refetchAccounts } = useAccounts();

  const sendTokens = useCallback(
    async (
      senderId: string,
      receiverId: string,
      faucetId: string,
      amount: bigint,
      recallHeight?: number,
    ) => {
      try {
        const out = await send({
          from: senderId,
          to: receiverId,
          assetId: faucetId,
          amount,
          noteType: recallHeight != null ? 'public' : 'private',
          recallHeight: recallHeight ?? undefined,
        });
        let noteId: string | undefined;
        if (out.note) {
          try {
            noteId = out.note.id().toString();
          } catch {
            /* optional */
          }
        }
        console.log('[Miden] P2ID send txId:', out.txId, 'output note id:', noteId ?? null);
        await sync();
        await refetchAccounts();
        return { success: true, noteId, txId: out.txId };
      } catch (err) {
        console.error('[Miden] Send error:', err);
        throw err;
      }
    },
    [send, sync, refetchAccounts],
  );

  const error = useMemo(() => sendError?.message ?? null, [sendError]);

  return {
    sendTokens,
    isSending,
    error,
  };
}
