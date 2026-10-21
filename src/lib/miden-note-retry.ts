export interface MidenNoteCreationResult {
  success: boolean;
  noteId?: string;
  error?: string;
}

export interface MidenNoteQuote {
  amount: string;
  token: string;
  recipient: string;
}

export interface CachedMidenNote {
  noteId: string;
  quote: MidenNoteQuote;
}

function matchesQuote(
  cachedQuote: MidenNoteQuote,
  requestedQuote: MidenNoteQuote,
): boolean {
  return (
    cachedQuote.amount === requestedQuote.amount &&
    cachedQuote.token === requestedQuote.token &&
    cachedQuote.recipient === requestedQuote.recipient
  );
}

export async function reuseOrCreateMidenNote(
  existingNote: CachedMidenNote | undefined,
  quote: MidenNoteQuote,
  createNote: () => Promise<MidenNoteCreationResult>,
): Promise<MidenNoteCreationResult> {
  if (existingNote && matchesQuote(existingNote.quote, quote)) {
    return { success: true, noteId: existingNote.noteId };
  }

  return createNote();
}
