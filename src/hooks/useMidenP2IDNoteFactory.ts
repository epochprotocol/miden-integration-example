import { useCallback, useEffect, useRef } from "react";
import { useMidenFiWallet } from "@miden-sdk/miden-wallet-adapter-react";
import { Transaction } from "@miden-sdk/miden-wallet-adapter-base";
import { useMiden } from "@miden-sdk/react";

import {
  Note,
  NoteType,
  AccountId,
  NoteAssets,
  FungibleAsset,
  NoteArray,
  NoteAttachment,
  TransactionRequestBuilder,
  Word,
} from "@miden-sdk/miden-sdk";
import type { SolveIntentParams } from "@epoch-protocol/epoch-intents-sdk";

interface Options {
  midenAccountId: string | null;
  onStatus: (message: string) => void;
  onNoteCreated: (noteId: string) => void;
}

const WAIT_FOR_TRANSACTION_TIMEOUT_MS = 120_000;

/** Epoch Miden ids are 0x-hex; fall back to bech32 for wallet-formatted ids. */
function toAccountId(id: string): AccountId {
  const s = id.trim();
  return s.startsWith("0x") ? AccountId.fromHex(s) : AccountId.fromBech32(s);
}

function createFeeConversionSalt(): Word {
  // Each 32-bit limb is a valid Miden field element. Four independent limbs
  // give the Guarded Multisig account a fresh replay guard for this request.
  return new Word(
    BigUint64Array.from(crypto.getRandomValues(new Uint32Array(4)), BigInt),
  );
}

/**
 * Mints the recallable P2IDE collateral note, binding it to the intent's mandate
 * via the attachment felts the SDK computed (Compact-equivalent witness hash).
 *
 * Submitted through the WALLET (`requestTransaction` + `createCustomTransaction`)
 * rather than the SDK client's `useTransaction`: the wallet holds the account's
 * state, whereas the SDK client's local store may not (which caused
 * "account data wasn't found"). The wallet's `SendTransaction` can't carry an
 * attachment, so we build a custom `TransactionRequest` whose output note is a
 * P2IDE note created with `Note.createP2IDENote(..., reclaim, type, attachment)`
 * — the one API that supports reclaim + attachment together.
 */
export function useMidenP2IDNoteFactory({
  midenAccountId,
  onStatus,
  onNoteCreated,
}: Options): SolveIntentParams["createMidenP2IDENote"] {
  const { requestTransaction, waitForTransaction } = useMidenFiWallet();
  // The app-owned client is used only for the public chain tip required to
  // calculate the absolute reclaim height. The wallet owns the account and
  // signs/submits the custom transaction below.
  const { client, isReady } = useMiden();
  const hasLoggedClientReady = useRef(false);

  useEffect(() => {
    if (!isReady || !client || hasLoggedClientReady.current) return;
    console.info("[Miden] App client initialized");
    hasLoggedClientReady.current = true;
  }, [client, isReady]);

  return useCallback<NonNullable<SolveIntentParams["createMidenP2IDENote"]>>(
    async (
      faucetIdParam,
      amountParam,
      allocatorId,
      recallBlocks,
      bindingAttachmentFelts,
    ) => {
      onStatus("Resource lock required — creating P2IDE note on Miden…");
      try {
        if (!midenAccountId) {
          throw new Error("Missing Miden account id");
        }
        if (!bindingAttachmentFelts?.length) {
          throw new Error("Missing mandate-binding attachment felts from SDK");
        }
        if (!requestTransaction) {
          throw new Error("Wallet does not support custom transactions");
        }
        if (!isReady || !client) {
          throw new Error(
            "Miden client not ready yet — retry once it initializes",
          );
        }

        const assets = new NoteAssets([
          new FungibleAsset(toAccountId(faucetIdParam), BigInt(amountParam)),
        ]);
        // Mandate binding: witness hash the SDK computed, written verbatim as the
        // note attachment (part of the note commitment, tamper-proof).
        const attachment = new NoteAttachment(
          BigUint64Array.from(bindingAttachmentFelts),
        );

        // P2IDE reclaim height is ABSOLUTE; the SDK gives a RELATIVE recallBlocks
        // (allocator min + buffer). Convert against the client's synced chain tip
        // (getSyncHeight needs the chain, not the account).
        const currentBlock = await client.getSyncHeight();
        if (!Number.isFinite(currentBlock) || currentBlock <= 0) {
          throw new Error(
            "Miden client not synced yet — retry once the block height is available",
          );
        }
        const reclaimHeight = currentBlock + recallBlocks;
        const note = Note.createP2IDENote(
          toAccountId(midenAccountId),
          toAccountId(allocatorId),
          assets,
          reclaimHeight,
          undefined, // no time-lock
          NoteType.Public,
          attachment,
        );
        const noteId = note.id().toString();

        // This request crosses into the wallet, so it must carry its own fresh
        // replay guard instead of asking this app-owned client to inspect the
        // wallet account.
        const txRequest = new TransactionRequestBuilder()
          .withFeeConversionSalt(createFeeConversionSalt())
          .withOwnOutputNotes(new NoteArray([note]))
          .build();

        if (!noteId) {
          throw new Error("Could not compute note id for the minted note");
        }

        // Submit through the wallet (holds the account + signs).
        const customTx = Transaction.createCustomTransaction(
          midenAccountId,
          allocatorId,
          txRequest,
        );
        const txId = await requestTransaction(customTx);

        // Wait for finalization before returning, so the note is committed and
        // queryable when the allocator fetches it during intent validation.
        // Without this the intent can race ahead of the note and be rejected
        // "not found on-chain".
        if (waitForTransaction) {
          onStatus("P2IDE note created — waiting for finalization on Miden…");
          await waitForTransaction(txId, WAIT_FOR_TRANSACTION_TIMEOUT_MS);
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
    [
      midenAccountId,
      requestTransaction,
      waitForTransaction,
      client,
      isReady,
      onStatus,
      onNoteCreated,
    ],
  );
}
