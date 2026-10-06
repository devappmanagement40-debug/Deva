export const DEFAULT_MIN_WITHDRAWAL_XOF = 1200;
export const DEFAULT_WITHDRAWAL_FEE_PERCENT = 12;
export const DEFAULT_XOF_PER_USDT = 500;
export const MAX_XOF_PER_USDT = 1_000_000;

export function parseXofPerUsdt(value: unknown): number | null {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value.trim())
      : Number.NaN;

  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_XOF_PER_USDT
    ? parsed
    : null;
}
