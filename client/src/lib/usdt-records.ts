export function isUsdtCurrency(currency: unknown): boolean {
  return typeof currency === "string" && currency.trim().toUpperCase() === "USDT";
}

export function isUsdtRecord(record: { currency?: unknown } | null | undefined): boolean {
  return isUsdtCurrency(record?.currency);
}

export function isUsdtProductPurchase(
  record: {
    product?: { currency?: unknown } | null;
    productSnapshot?: { currency?: unknown } | null;
  } | null | undefined,
): boolean {
  if (!record) return false;
  if (record.productSnapshot) return isUsdtCurrency(record.productSnapshot.currency);
  return isUsdtCurrency(record.product?.currency);
}
