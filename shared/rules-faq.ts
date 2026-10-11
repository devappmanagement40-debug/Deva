import { normalizeProductType } from "./product-categories";
import { getEffectiveRequiredVipLevel, MAX_VIP_LEVEL } from "./vip-progress";
import type { Product } from "./schema";

export interface ParcoursVipFaqRow {
  id: number;
  name: string;
  requiredVipLevel: number | null;
  requiredInvestmentUsdt: number | null;
  awardedVipLevel: number;
  unavailable: boolean;
}

type ParcoursFaqProduct = Pick<
  Product,
  | "id"
  | "name"
  | "productType"
  | "currency"
  | "isFree"
  | "isActive"
  | "isUnavailable"
  | "requiredVipLevel"
  | "requiredInvestmentUsdt"
  | "sortOrder"
>;

export function getParcoursVipFaqRows(
  products: readonly ParcoursFaqProduct[],
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
    .map((product, index) => {
      const awardedVipLevel = Math.min(MAX_VIP_LEVEL, index + 1);
      const requiredVipLevel = getEffectiveRequiredVipLevel(
        product.productType,
        product.requiredVipLevel,
        awardedVipLevel,
      );
      const requiredInvestment = Number(product.requiredInvestmentUsdt);
      return {
        id: product.id,
        name: product.name,
        requiredVipLevel,
        requiredInvestmentUsdt:
          Number.isFinite(requiredInvestment) && requiredInvestment >= 0
            ? requiredInvestment
            : null,
        awardedVipLevel,
        unavailable: product.isUnavailable,
      };
    });
}
