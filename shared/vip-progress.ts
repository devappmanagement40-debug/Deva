import { normalizeProductType } from "./product-categories";

export const MAX_VIP_LEVEL = 7;

export interface VipProgress {
  level: number;
  totalInvestmentUsdt: number;
  progressPercent: number;
  nextLevel: number | null;
  nextThresholdUsdt: number | null;
  amountRemainingUsdt: number | null;
}

interface EligiblePurchase {
  amountCents: number;
  productId: number | null;
  productType: string;
  vipLevelAwarded: number | null;
}

export type VipCatalogProduct = {
  id: number;
  productType: string;
  currency: string;
  isFree: boolean;
  isActive?: boolean;
  sortOrder?: number;
  requiredInvestmentUsdt?: string | number | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/** Parse a non-negative USDT amount with cent precision into integer cents. */
export function parseUsdtAmountCents(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const raw = typeof value === "number" ? String(value) : String(value).trim();
  const match = raw.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const cents = whole * 100 + fraction;
  return Number.isSafeInteger(cents) ? cents : null;
}

function personalPaidPurchases(purchases: readonly unknown[]): EligiblePurchase[] {
  const eligible: EligiblePurchase[] = [];
  for (const value of purchases) {
    const root = record(value);
    if (!root) continue;
    const purchase = record(root.userProduct) ?? root;
    const currentProduct = record(root.product) ?? record(purchase.product);
    const snapshot =
      record(purchase.productSnapshot) ??
      record(root.productSnapshot) ??
      currentProduct;
    if (!snapshot) continue;
    if (purchase.assignedByAdmin === true || root.assignedByAdmin === true) continue;
    const isFree = snapshot.isFree === undefined
      ? currentProduct?.isFree === true
      : snapshot.isFree === true;
    if (isFree) continue;
    const currency = String(snapshot.currency ?? currentProduct?.currency ?? "").toUpperCase();
    if (currency !== "USDT") continue;
    const amountCents = parseUsdtAmountCents(snapshot.price ?? currentProduct?.price);
    if (amountCents === null || amountCents <= 0) continue;
    const rawProductId = purchase.productId ?? snapshot.id ?? currentProduct?.id;
    const parsedProductId = Number(rawProductId);
    const type = String(snapshot.productType ?? currentProduct?.productType ?? "");
    const awardedLevel = parseVipLevel(purchase.vipLevelAwarded);
    eligible.push({
      amountCents,
      productId: Number.isSafeInteger(parsedProductId) ? parsedProductId : null,
      productType: type,
      vipLevelAwarded: awardedLevel,
    });
  }
  return eligible;
}

/** Active, paid USDT Parcours products define the sequence for new VIP ranks. */
export function getParcoursProductRanks(
  products: readonly VipCatalogProduct[],
): Map<number, number> {
  const ordered = products
    .filter((product) =>
      product.isActive !== false &&
      !product.isFree &&
      product.currency.toUpperCase() === "USDT" &&
      normalizeProductType(product.productType) === "wellness",
    )
    .slice()
    .sort((left, right) =>
      (Number(left.sortOrder) || 0) - (Number(right.sortOrder) || 0) || left.id - right.id,
    );
  return new Map(ordered.map((product, index) => [
    product.id,
    Math.min(MAX_VIP_LEVEL, index + 1),
  ]));
}

export function getParcoursProductRank(
  product: Pick<VipCatalogProduct, "id">,
  products: readonly VipCatalogProduct[],
): number | null {
  return getParcoursProductRanks(products).get(product.id) ?? null;
}

function requiredInvestmentCents(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") return 0;
  return parseUsdtAmountCents(value);
}

/**
 * Paid personal purchases in any product range contribute to the cumulative
 * investment requirement. A VIP rank is awarded only by a paid Parcours
 * purchase, using the rank snapshot recorded at purchase time.
 */
export function calculateVipProgress(
  purchases: readonly unknown[],
  catalogProducts: readonly VipCatalogProduct[],
): VipProgress {
  const eligiblePurchases = personalPaidPurchases(purchases);
  const ranks = getParcoursProductRanks(catalogProducts);
  let totalCents = 0;
  let level = 0;
  for (const purchase of eligiblePurchases) {
    totalCents += purchase.amountCents;
    if (!Number.isSafeInteger(totalCents)) {
      throw new Error("Le cumul des investissements dépasse la limite autorisée.");
    }
    if (normalizeProductType(purchase.productType) !== "wellness") continue;
    const rank = purchase.vipLevelAwarded ??
      (purchase.productId === null ? 0 : ranks.get(purchase.productId) ?? 0);
    level = Math.max(level, rank);
  }

  const nextLevel = level < MAX_VIP_LEVEL ? level + 1 : null;
  const nextProduct = nextLevel === null
    ? undefined
    : catalogProducts
        .filter((product) => ranks.get(product.id) === nextLevel)
        .sort((left, right) =>
          (Number(left.sortOrder) || 0) - (Number(right.sortOrder) || 0) || left.id - right.id,
        )[0];
  const nextThresholdCents = nextProduct
    ? requiredInvestmentCents(nextProduct.requiredInvestmentUsdt)
    : null;
  const validThreshold = nextThresholdCents !== null && nextProduct ? nextThresholdCents : null;

  return {
    level,
    totalInvestmentUsdt: totalCents / 100,
    progressPercent: validThreshold === null
      ? 0
      : validThreshold === 0
        ? 100
        : Math.min(100, Math.max(0, (totalCents / validThreshold) * 100)),
    nextLevel,
    nextThresholdUsdt: validThreshold === null ? null : validThreshold / 100,
    amountRemainingUsdt: validThreshold === null
      ? null
      : Math.max(0, validThreshold - totalCents) / 100,
  };
}

export function parseVipLevel(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= MAX_VIP_LEVEL
    ? parsed
    : null;
}

export function isVipLevelUnlocked(currentLevel: number, requiredLevel: unknown): boolean {
  const required = parseVipLevel(requiredLevel);
  return required !== null && Number.isSafeInteger(currentLevel) && currentLevel >= required;
}

export function getEffectiveRequiredVipLevel(
  productType: unknown,
  configuredLevel: unknown,
  productRank?: number | null,
): number | null {
  const requiredLevel = parseVipLevel(configuredLevel);
  if (requiredLevel === null) return null;
  if (normalizeProductType(productType) !== "wellness") return requiredLevel;
  // The first Parcours purchase awards VIP1; it must not require VIP1 first.
  if (productRank === 1) return 0;
  const sequenceRequirement = productRank && productRank > 1
    ? Math.min(MAX_VIP_LEVEL, productRank - 1)
    : 1;
  return Math.max(1, requiredLevel, sequenceRequirement);
}
