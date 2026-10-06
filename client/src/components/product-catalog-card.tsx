import { Image as ImageIcon, Loader2 } from "lucide-react";
import type { Product } from "@shared/schema";
import { getProductImageUrl } from "@/lib/product-visuals";
import type { ProductCardCopy } from "@/lib/product-card-copy";
import "@/pages/products.css";

interface ProductCatalogCardProps {
  product: Product;
  displayName: string;
  labels: ProductCardCopy;
  actionLabel: string;
  onAction: () => void;
  onCardClick?: () => void;
  actionStatusLabel?: string;
  actionAriaLabel?: string;
  disabled?: boolean;
  blocked?: boolean;
  pending?: boolean;
  rootTestId?: string;
  actionTestId?: string;
}

function formatXof(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
}

export function ProductCatalogCard({
  product,
  displayName,
  labels,
  actionLabel,
  onAction,
  onCardClick,
  actionStatusLabel,
  actionAriaLabel,
  disabled = false,
  blocked = false,
  pending = false,
  rootTestId,
  actionTestId,
}: ProductCatalogCardProps) {
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
          <dl>
            <div><dt>{labels.daily}</dt><dd>{formatXof(Number(product.dailyEarnings))} <small>XOF</small></dd></div>
            <div><dt>{labels.term}</dt><dd>{product.cycleDays} {labels.days}</dd></div>
            <div><dt>{labels.total}</dt><dd>{formatXof(Number(product.totalReturn))} <small>XOF</small></dd></div>
          </dl>
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
      <div className="diamant-invest-product-footer">
        <div className="diamant-invest-price">
          <span className="sr-only">{labels.priceLabel}</span>
          <strong>{formatXof(Number(product.price))} <small>XOF</small></strong>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAction();
          }}
          disabled={disabled}
          className={`diamant-invest-buy${blocked ? " is-disabled" : ""}`}
          aria-label={actionAriaLabel || `${actionLabel}: ${displayName}`}
          data-testid={actionTestId}
        >
          {pending
            ? <Loader2 size={19} className="animate-spin" />
            : actionStatusLabel || actionLabel}
        </button>
      </div>
    </article>
  );
}
