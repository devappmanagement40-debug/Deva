export { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "./financial-settings";

export interface WithdrawalPayoutAmounts {
  fees: number;
  netAmount: number;
}

export interface UsdtWithdrawalPayoutAmounts {
  fees: string;
  netAmount: string;
}

const USDT_WITHDRAWAL_SCALE = 1_000_000;

export function parseUsdtWithdrawalAmount(value: unknown): number | null {
  const raw = typeof value === "string"
    ? value.trim()
    : typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : "";
  if (!/^\d{1,15}(?:\.\d{1,6})?$/.test(raw)) return null;

  const [whole, fractional = ""] = raw.split(".");
  const micros = Number(whole) * USDT_WITHDRAWAL_SCALE
    + Number(fractional.padEnd(6, "0") || "0");
  return Number.isSafeInteger(micros) && micros > 0 ? micros : null;
}

export function formatUsdtWithdrawalAmount(micros: number): string {
  const whole = Math.floor(micros / USDT_WITHDRAWAL_SCALE);
  const fractional = (micros % USDT_WITHDRAWAL_SCALE)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fractional ? `${whole}.${fractional}` : whole.toString();
}

export function calculateUsdtWithdrawalPayoutAmounts(
  grossAmount: unknown,
  feePercent: number,
): UsdtWithdrawalPayoutAmounts {
  const grossMicros = parseUsdtWithdrawalAmount(grossAmount);
  const parsedFee = parseWithdrawalFeePercent(feePercent);
  if (grossMicros === null) {
    throw new RangeError("Le montant USDT doit être positif et contenir au plus 6 décimales.");
  }
  if (parsedFee === null) {
    throw new RangeError("Le taux des frais de retrait doit être compris entre 0 et 99 %.");
  }

  const feeBasisPoints = Math.round(parsedFee * 100);
  if (!Number.isSafeInteger(grossMicros * feeBasisPoints)) {
    throw new RangeError("Le montant USDT dépasse la précision autorisée.");
  }
  const feesMicros = Math.round((grossMicros * feeBasisPoints) / 10_000);
  const netMicros = grossMicros - feesMicros;
  if (netMicros <= 0) {
    throw new RangeError("Le montant net du retrait doit être supérieur à zéro.");
  }

  return {
    fees: formatUsdtWithdrawalAmount(feesMicros),
    netAmount: formatUsdtWithdrawalAmount(netMicros),
  };
}

export function convertXofWithdrawalLimitToUsdt(
  amountXof: number,
  xofPerUsdt: number,
  roundUp: boolean,
): string {
  if (
    !Number.isSafeInteger(amountXof)
    || amountXof <= 0
    || !Number.isSafeInteger(xofPerUsdt)
    || xofPerUsdt <= 0
  ) {
    throw new RangeError("Les limites et le paramètre de conversion doivent être des entiers positifs.");
  }

  const amountMicros = amountXof * USDT_WITHDRAWAL_SCALE;
  if (!Number.isSafeInteger(amountMicros)) {
    throw new RangeError("La limite dépasse la précision autorisée.");
  }
  const convertedMicros = roundUp
    ? Math.ceil(amountMicros / xofPerUsdt)
    : Math.floor(amountMicros / xofPerUsdt);
  if (!Number.isSafeInteger(convertedMicros)) {
    throw new RangeError("La limite USDT dépasse la précision autorisée.");
  }
  return formatUsdtWithdrawalAmount(convertedMicros);
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
