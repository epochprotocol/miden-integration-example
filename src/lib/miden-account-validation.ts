import { AccountId, Address } from "@miden-sdk/miden-sdk";

function parseMidenAccountId(value: string): AccountId {
  const raw = value.trim();
  if (!raw) throw new Error("Miden account ID is required.");
  if (raw.startsWith("0x") || raw.startsWith("0X")) {
    return AccountId.fromHex(raw);
  }
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0) {
    return AccountId.fromHex(`0x${raw}`);
  }
  if (raw.includes("_")) {
    return Address.fromBech32(raw).accountId();
  }
  return AccountId.fromBech32(raw);
}

export function requirePublicMidenAccountId(
  value: string,
  label: "Miden source account" | "Miden destination account",
): string {
  let accountId: AccountId;
  try {
    accountId = parseMidenAccountId(value);
  } catch {
    throw new Error(`${label} must be a valid Miden account ID.`);
  }
  if (!accountId.isPublic()) {
    throw new Error(`${label} must be public.`);
  }
  return accountId.toString();
}

export function getMidenPublicAccountError(
  value: string,
  label: "Miden source account" | "Miden destination account",
): string | null {
  try {
    requirePublicMidenAccountId(value, label);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : `${label} is invalid.`;
  }
}
