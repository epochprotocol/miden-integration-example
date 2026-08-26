import { useCallback, useState } from "react";
import { toast } from "sonner";
import { MIDEN_VIRTUAL_CHAIN_ID } from "@epoch-protocol/epoch-intents-sdk";
import { Button } from "@/components/ui/button";
import { useEpochSession } from "../../../hooks/useEpochSession";
import type { RecoverableIntent } from "@epoch-protocol/epoch-intents-sdk";
import { useEpochSdk } from "../../../lib/epoch-sdk";
import { downloadNoteFile } from "../../../lib/note-file";

interface Props {
  connectedAddress?: string;
}

/**
 * A downloadable body exists only for a PRIVATE EVM→Miden payout — SIO stores
 * it as `midenOutputNoteBytes` and serves it on the Miden settlement row.
 *
 * `compacts.chain_id` is the SOURCE chain, so those are the EVM-chain rows, NOT
 * the Miden ones. A `chain_id = 999999999` row is Miden→EVM and its
 * `miden_note_id` is the INPUT note being consumed, which has no body to fetch.
 *
 * So gating on `midenNoteId` selects exactly the wrong rows. That column is
 * written at submission from the mandate, which only carries a note id when the
 * user already owns one (Miden→EVM). For EVM→Miden the output note is minted
 * during settlement, leaving the column null for precisely the intents this
 * card exists to recover.
 */
function mayHaveRecoverableNote(it: RecoverableIntent): boolean {
  return Number(it.chainId) !== MIDEN_VIRTUAL_CHAIN_ID;
}

/**
 * Recover a private payout note without the intent nonce.
 *
 * The nonce is not on-chain and normally lives only in the browser, so a user on
 * a new device cannot ask for their own note. Proving wallet ownership lets
 * smallocator look their intents up by address instead.
 */
export function RecoverNotesCard({ connectedAddress }: Props) {
  const sdk = useEpochSdk();
  const { sessionId, signIn, signOut, isSigningIn } = useEpochSession();
  const [intents, setIntents] = useState<RecoverableIntent[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    async (id: string) => {
      try {
        if (!sdk) return;
        setIntents(await sdk.listMyIntents(id));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lookup failed";
        toast.error(msg);
        // A rejected session is usually an expired one.
        if (/session/i.test(msg)) void signOut();
      }
    },
    [sdk, signOut],
  );

  const handleSignIn = async () => {
    try {
      await load(await signIn());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    }
  };

  const handleFetch = async (nonce: string) => {
    if (!sessionId || !sdk) return;
    setBusy(nonce);
    try {
      const note = await sdk.getIntentNote(sessionId, nonce);
      if (!note) {
        toast.info("That payout was public — nothing to download");
        return;
      }
      downloadNoteFile(note.midenNoteBytes, note.midenNoteId);
      toast.success("Note file saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not fetch note");
    } finally {
      setBusy(null);
    }
  };

  if (!connectedAddress) return null;

  const recoverable = intents?.filter(mayHaveRecoverableNote) ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-neutral-800">
          Lost a private note?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          Sign a message to prove this wallet is yours, and we will list your
          past intents so you can re-download any private note file.
        </p>
      </div>

      {!sessionId ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleSignIn()}
          disabled={isSigningIn}
        >
          {isSigningIn ? "Waiting for signature…" : "Recover my notes"}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void load(sessionId)}
            >
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </div>

          {intents?.length === 0 && (
            <p className="text-xs text-neutral-500">No past intents found.</p>
          )}

          {intents && intents.length > 0 && recoverable.length === 0 && (
            <p className="text-xs text-neutral-500">
              No recoverable payouts — only an EVM→Miden intent mints a private
              note file.
            </p>
          )}

          {recoverable.length > 0 && (
            <ul className="space-y-2">
              {recoverable.map((it) => (
                <li
                  key={String(it.nonce)}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 px-3 py-2"
                >
                  <span
                    className="flex-1 truncate font-mono text-xs text-neutral-700"
                    title={String(it.midenNoteId ?? it.nonce)}
                  >
                    {/* Defensive String(): a bad field must degrade one row,
                        not blank the whole recovery card. */}
                    {it.midenNoteId
                      ? `${String(it.midenNoteId).slice(0, 18)}…`
                      : `intent ${String(it.nonce).slice(0, 12)}…`}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {new Date(it.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy === it.nonce}
                    onClick={() => void handleFetch(String(it.nonce))}
                  >
                    {busy === it.nonce ? "Fetching…" : "Get note"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
