import productBike from "@assets/generated_images/diamant-product-bike-card.jpg";
import productScooter from "@assets/generated_images/diamant-scooter.jpg";
import productMoped from "@assets/generated_images/diamant-moped.jpg";

export const DIAMANT_PRODUCT_VISUALS = [productBike, productScooter, productMoped] as const;

export function getProductVisual(imageUrl: string | null | undefined, index: number): string {
  return imageUrl?.trim() || DIAMANT_PRODUCT_VISUALS[index % DIAMANT_PRODUCT_VISUALS.length];
}