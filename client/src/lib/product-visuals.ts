import productBike from "@assets/generated_images/diamant-product-bike-card.jpg";
import productScooter from "@assets/generated_images/diamant-scooter.jpg";
import productMoped from "@assets/generated_images/diamant-moped.jpg";
import goldVip1 from "@assets/diamant_gold_products/gold-vip-01-bullion-bar.jpg";
import goldVip2 from "@assets/diamant_gold_products/gold-vip-02-ingots-white.jpg";
import goldVip3 from "@assets/diamant_gold_products/gold-vip-03-stacked-bars.jpg";
import goldVip4 from "@assets/diamant_gold_products/gold-vip-04-400oz-bars.jpg";
import goldVip5 from "@assets/diamant_gold_products/gold-vip-05-natural-nugget.jpg";
import goldVip6 from "@assets/diamant_gold_products/gold-vip-06-australian-nugget.jpg";
import goldVip7 from "@assets/diamant_gold_products/gold-vip-07-australian-nugget-detail.jpg";
import goldVip8 from "@assets/diamant_gold_products/gold-vip-08-nugget-quartz.jpg";
import goldVip9 from "@assets/diamant_gold_products/gold-vip-09-gold-nugget.jpg";

export const DIAMANT_PRODUCT_VISUALS = [productBike, productScooter, productMoped] as const;
export const DIAMANT_STABILITY_PRODUCT_VISUALS = [
  goldVip1,
  goldVip2,
  goldVip3,
  goldVip4,
  goldVip5,
  goldVip6,
  goldVip7,
  goldVip8,
  goldVip9,
] as const;

export function getProductVisual(
  imageUrl: string | null | undefined,
  productId: number | string | null | undefined,
  productType?: string | null,
): string {
  const uploadedImage = imageUrl?.trim();
  if (uploadedImage) return uploadedImage;

  const numericProductId = typeof productId === "number" ? productId : Number(productId);
  const stableIndex = Number.isSafeInteger(numericProductId) && numericProductId > 0
    ? numericProductId - 1
    : 0;
  const visuals = productType?.trim().toLowerCase() === "stability"
    ? DIAMANT_STABILITY_PRODUCT_VISUALS
    : DIAMANT_PRODUCT_VISUALS;

  return visuals[stableIndex % visuals.length];
}