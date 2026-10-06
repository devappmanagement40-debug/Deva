import type { ProductType } from "./schema";

/**
 * Legacy catalog rows and purchase snapshots may still contain "all".
 * Treat those records as Stability without changing historical snapshots.
 */
export function normalizeProductType(value: unknown): ProductType {
  if (value === "wellness" || value === "activity") return value;
  return "stability";
}

export function ownsActiveStabilityProduct(
  holdings: ReadonlyArray<{ isActive: boolean; daysRemaining: number; productType: unknown }>,
): boolean {
  return holdings.some(
    (holding) =>
      holding.isActive &&
      holding.daysRemaining > 0 &&
      normalizeProductType(holding.productType) === "stability",
  );
}

export function canPurchaseProductType(
  productType: unknown,
  hasActiveStabilityProduct: boolean,
): boolean {
  return normalizeProductType(productType) === "stability" || hasActiveStabilityProduct;
}
