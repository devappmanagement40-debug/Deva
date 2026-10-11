export const DEFAULT_MIN_DEPOSIT_XOF = 2500;
export const DEFAULT_DEPOSIT_PRESET_AMOUNTS = "2500,5000,7000,10000,15000,20000,50000,70000";
export const DEFAULT_MIN_WITHDRAWAL_XOF = 1200;
export const DEFAULT_MIN_DEPOSIT_USDT = "13";
export const DEFAULT_DEPOSIT_PRESET_AMOUNTS_USDT = "2,5,10,20,50";
export const DEFAULT_MIN_WITHDRAWAL_USDT = "0.5";
export const DEFAULT_MAX_WITHDRAWAL_USDT = "2000";
export const DEFAULT_DAILY_BONUS_MIN_USDT = "0.1";
export const DEFAULT_DAILY_BONUS_MAX_USDT = "0.3";
export const DEFAULT_WITHDRAWAL_FEE_PERCENT = 3;
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
