export interface MidenNoteCreationResult {
  success: boolean;
  noteId?: string;
  error?: string;
}

export interface MidenNoteQuote {
  amount: string;
  token: string;
  recipient: string;
  sourceAccount: string;
  mandateBinding: string;
}

export interface CachedMidenNote {
  noteId: string;
  transactionId?: string;
  confirmed?: boolean;
  quote: MidenNoteQuote;
}

function matchesQuote(
  cachedQuote: MidenNoteQuote,
  requestedQuote: MidenNoteQuote,
): boolean {
  return (
    cachedQuote.amount === requestedQuote.amount &&
    cachedQuote.token === requestedQuote.token &&
    cachedQuote.recipient === requestedQuote.recipient &&
    cachedQuote.sourceAccount === requestedQuote.sourceAccount &&
    cachedQuote.mandateBinding === requestedQuote.mandateBinding
  );
}

export async function reuseOrCreateMidenNote(
  existingNote: CachedMidenNote | undefined,
  quote: MidenNoteQuote,
  createNote: () => Promise<MidenNoteCreationResult>,
  resumeNote?: (note: CachedMidenNote) => Promise<MidenNoteCreationResult>,
): Promise<MidenNoteCreationResult> {
  if (existingNote && matchesQuote(existingNote.quote, quote)) {
    if (
      existingNote.confirmed === false &&
      existingNote.transactionId &&
      resumeNote
    ) {
      return resumeNote(existingNote);
    }
    return { success: true, noteId: existingNote.noteId };
  }

  return createNote();
}
