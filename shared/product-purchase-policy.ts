export const MAX_PRODUCT_UNITS_PER_PURCHASE = 100;

export function parseProductPurchaseQuantity(value: unknown): number {
  if (value === undefined || value === null) return 1;

  const quantity = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_PRODUCT_UNITS_PER_PURCHASE
  ) {
    throw new Error(
      `La quantité doit être un nombre entier entre 1 et ${MAX_PRODUCT_UNITS_PER_PURCHASE}.`,
    );
  }

  return quantity;
}

export function amountToXofCents(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Montant du produit invalide.");
  }

  const cents = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(cents)) {
    throw new Error("Montant du produit trop élevé.");
  }

  return cents;
}

export function getMaxAffordableProductQuantity(input: {
  unitPriceCents: number;
  availableBalanceCents: number;
  remainingProductLimit: number | null;
}): number {
  const { unitPriceCents, availableBalanceCents, remainingProductLimit } = input;
  if (
    !Number.isSafeInteger(unitPriceCents) ||
    unitPriceCents < 0 ||
    !Number.isSafeInteger(availableBalanceCents) ||
    availableBalanceCents < 0 ||
    (remainingProductLimit !== null &&
      (!Number.isSafeInteger(remainingProductLimit) || remainingProductLimit < 0))
  ) {
    return 0;
  }

  const affordable = unitPriceCents === 0
    ? MAX_PRODUCT_UNITS_PER_PURCHASE
    : Math.floor(availableBalanceCents / unitPriceCents);
  const productLimit = remainingProductLimit ?? MAX_PRODUCT_UNITS_PER_PURCHASE;

  return Math.max(
    0,
    Math.min(MAX_PRODUCT_UNITS_PER_PURCHASE, affordable, productLimit),
  );
}

export type PurchaseDebitAllocation = {
  totalPriceCents: number;
  depositDebitCents: number;
  earningsDebitCents: number;
  shortfallCents: number;
};

export function calculatePurchaseDebitAllocation(input: {
  unitPriceCents: number;
  quantity: number;
  depositBalanceCents: number;
  earningsBalanceCents: number;
}): PurchaseDebitAllocation | null {
  const { unitPriceCents, quantity, depositBalanceCents, earningsBalanceCents } = input;
  if (
    !Number.isSafeInteger(unitPriceCents) ||
    unitPriceCents < 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_PRODUCT_UNITS_PER_PURCHASE ||
    !Number.isSafeInteger(depositBalanceCents) ||
    depositBalanceCents < 0 ||
    !Number.isSafeInteger(earningsBalanceCents) ||
    earningsBalanceCents < 0
  ) {
    return null;
  }

  const totalPriceCents = unitPriceCents * quantity;
  if (!Number.isSafeInteger(totalPriceCents)) return null;

  const depositDebitCents = Math.min(depositBalanceCents, totalPriceCents);
  const earningsNeededCents = totalPriceCents - depositDebitCents;
  const earningsDebitCents = Math.min(earningsBalanceCents, earningsNeededCents);

  return {
    totalPriceCents,
    depositDebitCents,
    earningsDebitCents,
    shortfallCents: earningsNeededCents - earningsDebitCents,
  };
}
