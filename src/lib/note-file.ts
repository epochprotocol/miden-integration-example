/** Save a base64 `NoteFile` as the binary a Miden wallet imports. */
export function downloadNoteFile(noteBytes: string, noteId?: string): void {
  const binary = atob(noteBytes);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/octet-stream" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `miden-note-${(noteId ?? "payout").replace(/^0x/, "").slice(0, 16)}.mno`;
  a.click();
  URL.revokeObjectURL(url);
}
