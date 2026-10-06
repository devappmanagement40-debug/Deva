import { type ReactNode } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { Product } from "@shared/schema";
import { getProductImageUrl } from "@/lib/product-visuals";
import "@/pages/products.css";

type ProductCardAppearance = Pick<Product, "imageUrl" | "cardColor">;

interface ProductCardFrameProps {
  product: ProductCardAppearance;
  displayName: string;
  details: ReactNode;
  footer: ReactNode;
  onCardClick?: () => void;
  rootTestId?: string;
}

export function formatProductCardAmount(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
}

export function ProductCardFrame({
  product,
  displayName,
  details,
  footer,
  onCardClick,
  rootTestId,
}: ProductCardFrameProps) {
  const imageUrl = getProductImageUrl(product.imageUrl);

  return (
    <article
      className={`diamant-invest-product-card${onCardClick ? " is-card-clickable" : ""}`}
      data-card-colored={!!product.cardColor}
      style={product.cardColor ? {
        backgroundColor: `color-mix(in srgb, ${product.cardColor} 38%, #f5f7ff)`,
        borderColor: `color-mix(in srgb, ${product.cardColor} 62%, #7885ac)`,
        borderInlineStartWidth: 5,
        borderInlineStartColor: product.cardColor,
      } : undefined}
      data-testid={rootTestId}
      onClick={onCardClick}
    >
      <div className="diamant-invest-product-main">
        <div className="diamant-invest-product-copy">
          <div className="diamant-invest-product-title-row">
            <h3>{displayName}</h3>
          </div>
          <dl>{details}</dl>
        </div>
        <div
          className="diamant-invest-product-visual"
          style={product.cardColor ? { borderColor: `color-mix(in srgb, ${product.cardColor} 65%, #7784aa)` } : undefined}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={displayName} loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#42668b]" aria-label="Aucune image configurée">
              <ImageIcon size={34} aria-hidden="true" />
            </div>
          )}
          <span>DIAMANT</span>
        </div>
      </div>
      <div className="diamant-invest-product-footer">{footer}</div>
    </article>
  );
}
