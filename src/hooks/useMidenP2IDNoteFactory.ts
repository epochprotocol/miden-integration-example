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
} from "@miden-sdk/miden-sdk";
import type { SolveIntentParams } from "@epoch-protocol/epoch-intents-sdk";
import {
  randomMultisigSalt,
  withMultisigAuthArgs,
} from "../lib/miden-multisig-auth";
import {
  reuseOrCreateMidenNote,
  type CachedMidenNote,
} from "../lib/miden-note-retry";
import { requirePublicMidenAccountId } from "../lib/miden-account-validation";

interface Options {
  midenAccountId: string | null;
  existingNote?: CachedMidenNote;
  onStatus: (message: string) => void;
  onNoteCreated: (note: CachedMidenNote) => void;
}

const WAIT_FOR_TRANSACTION_TIMEOUT_MS = 120_000;

/** Epoch Miden ids are 0x-hex; fall back to bech32 for wallet-formatted ids. */
function toAccountId(id: string): AccountId {
  const s = id.trim();
  return s.startsWith("0x") ? AccountId.fromHex(s) : AccountId.fromBech32(s);
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
  existingNote,
  onStatus,
  onNoteCreated,
}: Options): SolveIntentParams["createMidenP2IDENote"] {
  const { requestTransaction, waitForTransaction, requestGuardianInfo } =
    useMidenFiWallet();
  // The app-owned client only reads the public chain: the tip for the absolute
  // reclaim height and, for a Guardian account, the fee faucet. The wallet owns
  // the account and signs/submits the custom transaction below.
  const { client, isReady, runExclusive } = useMiden();
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
      if (!midenAccountId) {
        throw new Error("Missing Miden account id");
      }
      const sourceAccount = requirePublicMidenAccountId(
        midenAccountId,
        "Miden source account",
      );
      const quote = {
        amount: amountParam,
        token: faucetIdParam,
        recipient: allocatorId,
        sourceAccount,
        mandateBinding: Array.from(bindingAttachmentFelts ?? [], (felt) =>
          felt.toString(),
        ).join(":"),
      };
      const createNote = async () => {
        onStatus("Resource lock required — creating P2IDE note on Miden…");
        try {
          if (!midenAccountId) {
            throw new Error("Missing Miden account id");
          }
          if (!bindingAttachmentFelts?.length) {
            throw new Error(
              "Missing mandate-binding attachment felts from SDK",
            );
          }
          if (
            !requestTransaction ||
            !requestGuardianInfo ||
            !waitForTransaction
          ) {
            throw new Error(
              "Wallet does not support custom transactions and finalization",
            );
          }
          if (!isReady || !client) {
            throw new Error(
              "Miden client not ready yet — retry once it initializes",
            );
          }

          const { isGuardianAccount } = await requestGuardianInfo();
          const chain = await runExclusive(async () => ({
            syncHeight: await client.getSyncHeight(),
            feeFaucetId: isGuardianAccount ? await client.feeFaucetId() : null,
          }));

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
          const currentBlock = chain.syncHeight;
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

          // A Guardian account is a multisig: since Miden 0.17 it aborts unless the
          // request carries multisig auth args, and `withFeeConversionSalt` no
          // longer satisfies it. A single-sig account needs nothing here.
          let builder = new TransactionRequestBuilder();
          if (chain.feeFaucetId) {
            builder = withMultisigAuthArgs(builder, {
              boundBlockNum: currentBlock,
              salt: randomMultisigSalt(),
              feeFaucetPrefix: chain.feeFaucetId.prefix().asInt(),
              feeFaucetSuffix: chain.feeFaucetId.suffix().asInt(),
            });
          }
          const txRequest = builder
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
          const submittedNote: CachedMidenNote = {
            noteId,
            transactionId: txId,
            confirmed: false,
            quote,
          };

          // Cache immediately after submission. If confirmation times out, a
          // retry resumes this transaction instead of locking funds again.
          onNoteCreated(submittedNote);
          onStatus("P2IDE note submitted — waiting for finalization on Miden…");
          await waitForTransaction(txId, WAIT_FOR_TRANSACTION_TIMEOUT_MS);

          onNoteCreated({ ...submittedNote, confirmed: true });
          return { success: true, noteId };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      };

      const resumeNote = async (pending: CachedMidenNote) => {
        if (!waitForTransaction || !pending.transactionId) {
          return {
            success: false,
            error: "Wallet does not support transaction finalization",
          };
        }
        try {
          onStatus("P2IDE note submitted — resuming finalization on Miden…");
          await waitForTransaction(
            pending.transactionId,
            WAIT_FOR_TRANSACTION_TIMEOUT_MS,
          );
          onNoteCreated({ ...pending, confirmed: true });
          return { success: true, noteId: pending.noteId };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      };

      return reuseOrCreateMidenNote(
        existingNote,
        quote,
        createNote,
        resumeNote,
      );
    },
    [
      midenAccountId,
      existingNote,
      requestTransaction,
      waitForTransaction,
      requestGuardianInfo,
      client,
      isReady,
      runExclusive,
      onStatus,
      onNoteCreated,
    ],
  );
}
