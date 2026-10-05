export const TOGO_TRANSACTION_ID_MAX_LENGTH = 180;

export type TogoTransactionIdValidation =
  | { ok: true; value: string }
  | { ok: false; reason: "required" | "too_long" };

export function validateTogoTransactionId(
  value: unknown,
): TogoTransactionIdValidation {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) return { ok: false, reason: "required" };
  if (normalized.length > TOGO_TRANSACTION_ID_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  return { ok: true, value: normalized };
}
