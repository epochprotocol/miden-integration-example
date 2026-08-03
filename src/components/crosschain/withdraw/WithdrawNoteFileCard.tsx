import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadNoteFile } from "../../../lib/note-file";

interface Props {
  /** Base64 `NoteFile` from the Miden settlement row. Absent for public payouts. */
  noteBytes?: string;
  noteId?: string;
}

/** The body of a PRIVATE payout note — the only thing that can claim it. */
export function WithdrawNoteFileCard({ noteBytes, noteId }: Props) {
  const [saved, setSaved] = useState(false);
  if (!noteBytes) return null;

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
