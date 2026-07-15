// The solver returns these under different envelopes depending on the solve
// path, so each reader probes the known shapes in priority order.

export interface IntentIdentity {
  nonce?: string;
  recipient?: string;
}

type NonceLike = string | number | bigint;

const isNonceLike = (v: unknown): v is NonceLike =>
  typeof v === "string" || typeof v === "number" || typeof v === "bigint";

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object";

function at(source: unknown, ...path: string[]): unknown {
  return path.reduce<unknown>(
    (node, key) => (isRecord(node) ? node[key] : undefined),
    source,
  );
}

function readNonce(result: unknown): string | undefined {
  const candidates: unknown[] = [
    at(result, "nonce"),
    at(result, "intentNonce"),
    at(result, "solveResult", "nonce"),
    at(result, "solveResult", "submittedIntentData", "nonce"),
    at(result, "submittedIntentData", "nonce"),
  ];
  const raw = candidates.find(isNonceLike);
  return raw != null ? String(raw) : undefined;
}

function readRecipient(result: unknown): string | undefined {
  const recipient = at(result, "intentData", "recipient");
  return typeof recipient === "string" ? recipient : undefined;
}

export function extractIntentIdentity(result: unknown): IntentIdentity {
  return { nonce: readNonce(result), recipient: readRecipient(result) };
}

/** Solver errors come back in-band rather than thrown. */
export function readIntentError(result: unknown): string | undefined {
  const err = at(result, "error");
  return typeof err === "string" && err ? err : undefined;
}

/** Present only on EVM-collateral flows. */
export function readDepositHash(result: unknown): string | undefined {
  const hash = at(result, "solveResult", "depositResult", "transactionHash");
  return typeof hash === "string" ? hash : undefined;
}

export function readMidenNoteId(result: unknown): string | undefined {
  const candidates: unknown[] = [
    at(result, "midenNoteId"),
    at(result, "solveResult", "midenNoteId"),
    at(result, "solveResult", "compact", "mandate", "midenNoteId"),
    at(
      result,
      "solveResult",
      "submittedIntentData",
      "compact",
      "mandate",
      "midenNoteId",
    ),
    at(result, "intentData", "midenNoteId"),
  ];
  const found = candidates.find((c) => typeof c === "string" && c.length > 0);
  return typeof found === "string" ? found : undefined;
}
