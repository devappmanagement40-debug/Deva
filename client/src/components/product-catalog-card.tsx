import { Loader2 } from "lucide-react";
import type { Product } from "@shared/schema";
import type { ProductCardCopy } from "@/lib/product-card-copy";
import { formatProductCardAmount, ProductCardFrame } from "@/components/product-card-frame";

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
  const isConfiguredForUsdt = product.market === "international" && product.currency === "USDT";

  return (
    <ProductCardFrame
      product={product}
      displayName={displayName}
      onCardClick={onCardClick}
      rootTestId={rootTestId}
      details={
        <>
          <div><dt>{labels.daily}</dt><dd>{isConfiguredForUsdt ? <>{formatProductCardAmount(Number(product.dailyEarnings))} <small>USDT</small></> : "—"}</dd></div>
          <div><dt>{labels.term}</dt><dd>{product.cycleDays} {labels.days}</dd></div>
          <div><dt>{labels.total}</dt><dd>{isConfiguredForUsdt ? <>{formatProductCardAmount(Number(product.totalReturn))} <small>USDT</small></> : "—"}</dd></div>
        </>
      }
      footer={
        <>
        <div className="diamant-invest-price">
          <span className="sr-only">{labels.priceLabel}</span>
          <strong>{isConfiguredForUsdt ? <>{formatProductCardAmount(Number(product.price))} <small>USDT</small></> : "À configurer en USDT"}</strong>
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
        </>
      }
    />
  );
}
