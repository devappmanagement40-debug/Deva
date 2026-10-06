export { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "./financial-settings";

export interface WithdrawalPayoutAmounts {
  fees: number;
  netAmount: number;
}

export function parseWithdrawalFeePercent(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const normalized = typeof value === "string" ? value.trim() : value;
  if (typeof normalized === "string" && !/^\d{1,2}(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const percent = Number(normalized);
  const hundredths = percent * 100;
  if (
    !Number.isFinite(percent)
    || percent < 0
    || percent > 99
    || Math.abs(hundredths - Math.round(hundredths)) > 1e-8
  ) {
    return null;
  }

  return percent;
}

export function calculateWithdrawalPayoutAmounts(
  grossAmount: number,
  feePercent: number,
): WithdrawalPayoutAmounts {
  if (!Number.isSafeInteger(grossAmount) || grossAmount <= 0) {
    throw new RangeError("Le montant brut du retrait doit être un entier positif.");
  }

  if (parseWithdrawalFeePercent(feePercent) === null) {
    throw new RangeError("Le taux des frais de retrait doit être compris entre 0 et 99 %.");
  }

  const fees = Math.round((grossAmount * feePercent) / 100);
  const netAmount = grossAmount - fees;
  if (netAmount <= 0) {
    throw new RangeError("Le montant net du retrait doit être supérieur à zéro.");
  }

  return { fees, netAmount };
}
