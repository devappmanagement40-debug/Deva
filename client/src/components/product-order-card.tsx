import type { ReactNode } from "react";
import type { Product } from "@shared/schema";
import { formatProductCardAmount, ProductCardFrame } from "@/components/product-card-frame";

export interface ProductOrderCardDetail {
  label: string;
  value: ReactNode;
  className?: string;
}

interface ProductOrderCardProps {
  product: Pick<Product, "imageUrl" | "cardColor" | "price">;
  displayName: string;
  details: ProductOrderCardDetail[];
  statusLabel: string;
  active: boolean;
  priceLabel: string;
  rootTestId?: string;
}

export function ProductOrderCard({
  product,
  displayName,
  details,
  statusLabel,
  active,
  priceLabel,
  rootTestId,
}: ProductOrderCardProps) {
  return (
    <ProductCardFrame
      product={product}
      displayName={displayName}
      rootTestId={rootTestId}
      details={details.map((detail) => (
        <div className={detail.className} key={detail.label}>
          <dt>{detail.label}</dt>
          <dd>{detail.value}</dd>
        </div>
      ))}
      footer={
        <>
          <div className="diamant-invest-price">
            <span className="sr-only">{priceLabel}</span>
            <strong>{formatProductCardAmount(Number(product.price))} <small>XOF</small></strong>
          </div>
          <span
            className={`diamant-order-status${active ? "" : " is-complete"}`}
            role="status"
          >
            {statusLabel}
          </span>
        </>
      }
    />
  );
}
