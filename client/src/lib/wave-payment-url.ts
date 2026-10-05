export function wavePaymentUrlForAmount(
  paymentUrl: string | null | undefined,
  amountXof: number,
): string | null {
  const value = paymentUrl?.trim() ?? "";
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "wave:") {
    return null;
  }

  if (parsed.protocol === "https:" && parsed.hostname.toLowerCase() === "pay.wave.com") {
    if (!Number.isSafeInteger(amountXof) || amountXof <= 0) return null;
    parsed.searchParams.set("amount", String(amountXof));
    return parsed.toString();
  }

  return value;
}
