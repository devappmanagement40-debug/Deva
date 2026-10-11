import { normalizeProductType } from "./product-categories";
import { getEffectiveRequiredVipLevel, MAX_VIP_LEVEL } from "./vip-progress";
import type { Product } from "./schema";

export interface VipThresholdFaqRow {
  level: number;
  thresholdUsdt: number | null;
}

export interface ParcoursVipFaqRow {
  id: number;
  name: string;
  requiredVipLevel: number | null;
  thresholdUsdt: number | null;
  unavailable: boolean;
}

function getConfiguredThreshold(
  settings: Record<string, unknown>,
  level: number,
): number | null {
  const raw = settings[`vip${level}MinInvestmentUsdt`];
  const value = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function getVipThresholdFaqRows(
  settings: Record<string, unknown>,
): VipThresholdFaqRow[] {
  return Array.from({ length: MAX_VIP_LEVEL }, (_, index) => {
    const level = index + 1;
    return { level, thresholdUsdt: getConfiguredThreshold(settings, level) };
  });
}

type ParcoursFaqProduct = Pick<
  Product,
  "id" | "name" | "productType" | "currency" | "isFree" | "isActive" | "isUnavailable" | "requiredVipLevel" | "sortOrder"
>;

export function getParcoursVipFaqRows(
  products: readonly ParcoursFaqProduct[],
  settings: Record<string, unknown>,
): ParcoursVipFaqRow[] {
  return products
    .filter((product) =>
      product.isActive &&
      !product.isFree &&
      product.currency.toUpperCase() === "USDT" &&
      normalizeProductType(product.productType) === "wellness",
    )
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id)
    .map((product) => {
      const requiredVipLevel = getEffectiveRequiredVipLevel(product.productType, product.requiredVipLevel);
      return {
        id: product.id,
        name: product.name,
        requiredVipLevel,
        thresholdUsdt: requiredVipLevel && requiredVipLevel > 0
          ? getConfiguredThreshold(settings, requiredVipLevel)
          : null,
        unavailable: product.isUnavailable,
      };
    });
}
