import { useCallback } from "react";
import { useMidenFiWallet } from "@miden-sdk/miden-wallet-adapter-react";
import { SendTransaction } from "@miden-sdk/miden-wallet-adapter-base";
import type { SolveIntentParams } from "@epoch-protocol/epoch-intents-sdk";

const WAIT_FOR_TRANSACTION_TIMEOUT_MS = 120_000;

interface Options {
  midenAccountId: string | null;
  onStatus: (message: string) => void;
  onNoteCreated: (noteId: string) => void;
}

/** Mints the recallable P2IDE note the SDK asks for when an intent needs a resource lock. */
export function useMidenP2IDNoteFactory({
  midenAccountId,
  onStatus,
  onNoteCreated,
}: Options): SolveIntentParams["createMidenP2IDNote"] {
  const { requestSend, waitForTransaction } = useMidenFiWallet();

  return useCallback<NonNullable<SolveIntentParams["createMidenP2IDNote"]>>(
    async (faucetIdParam, amountParam, allocatorId, recallBlocks) => {
      onStatus("Resource lock required — creating P2IDE note on Miden…");
      try {
        if (!midenAccountId) {
          throw new Error("Missing Miden account id");
        }
        if (!requestSend) {
          throw new Error("Miden wallet adapter not available");
        }
        // Before requestSend: broadcasting first would strand the user's funds.
        if (!waitForTransaction) {
          throw new Error("waitForTransaction not available in adapter");
        }

        const normalizedAmount = BigInt(amountParam);
        if (normalizedAmount > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error("Amount too large for wallet adapter send");
        }

        // recallBlocks comes from the SDK (allocator's published reclaim minimum
        // + buffer). Without it the note mints as a plain P2ID with no recall
        // window, so a failed intent would strand the funds.
        const payload = new SendTransaction(
          midenAccountId,
          allocatorId,
          faucetIdParam,
          "public",
          Number(normalizedAmount),
          recallBlocks,
        );
        const txId = await requestSend(payload);

        const finalized = await waitForTransaction(
          txId,
          WAIT_FOR_TRANSACTION_TIMEOUT_MS,
        );
        const first = finalized.outputNotes?.[0];
        const noteId = first ? first.id().toString() : "";
        if (!noteId) {
          throw new Error(`Could not read output note id for tx ${txId}`);
        }
        onNoteCreated(noteId);
        return { success: true, noteId };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    [midenAccountId, requestSend, waitForTransaction, onStatus, onNoteCreated],
  );
}
