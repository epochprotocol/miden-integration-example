import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadNoteFile } from "../../../lib/note-file";

interface Props {
  /**
   * Base64 `NoteFile` from the response to this withdrawal. Absent for a public
   * payout, and absent after a reload — the allocator does not serve it on the
   * status poll, so it cannot be recovered from a refresh.
   */
  noteBytes?: string;
  noteId?: string;
  /**
   * A private note exists but its body is no longer in hand. Point the user at
   * the wallet-authenticated recovery flow rather than silently showing nothing
   * — the funds are reachable, but only with the note file.
   */
  needsRecovery?: boolean;
}

/** The body of a PRIVATE payout note — the only thing that can claim it. */
export function WithdrawNoteFileCard({
  noteBytes,
  noteId,
  needsRecovery,
}: Props) {
  const [saved, setSaved] = useState(false);

  if (!noteBytes) {
    if (!needsRecovery) return null;
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-900">
          Your private note file is not on this page
        </p>
        <p className="mt-1 text-xs text-amber-800">
          This payout minted a private note, and its body is the only way to
          claim it. It was returned when you submitted, so a reload loses it.
          Use “Lost a private note?” below to sign in and download it again.
        </p>
      </div>
    );
  }

  const fileName = `miden-note-${(noteId ?? "payout").replace(/^0x/, "").slice(0, 16)}.mno`;

  const handleDownload = () => {
    try {
      downloadNoteFile(noteBytes, noteId);
      setSaved(true);
      toast.success(`Note file saved · ${fileName}`);
    } catch (err) {
      toast.error(
        `Could not save the note file: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(noteBytes);
      setSaved(true);
      toast.success("Note file copied as base64");
    } catch {
      toast.error("Clipboard blocked — use Download instead");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-amber-900">
          {saved ? "Note file saved" : "Save your note file"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">
          This is a <strong>private</strong> note, so the chain publishes only a
          commitment — this file is the only way to claim it. Import it into the
          Miden wallet that owns the recipient account. The note stays yours
          indefinitely; if you lose the file, use
          <strong> Recover my notes</strong> below to fetch it again.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handleDownload}>
          Download note file
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleCopy()}
        >
          Copy base64
        </Button>
      </div>

      <details className="text-xs text-amber-900">
        <summary className="cursor-pointer select-none">
          Show raw base64 ({noteBytes.length} chars)
        </summary>
        <p className="mt-1 break-all font-mono text-[11px] leading-relaxed">
          {noteBytes}
        </p>
      </details>
    </div>
  );
}
