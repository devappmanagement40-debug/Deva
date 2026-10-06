import type { ReactNode } from "react";
import type { Product } from "@shared/schema";
import { ProductCardFrame } from "@/components/product-card-frame";

export interface ProductOrderCardDetail {
  label: string;
  value: ReactNode;
  className?: string;
}

interface ProductOrderCardProps {
  product: Pick<Product, "imageUrl" | "cardColor">;
  displayName: string;
  details: ProductOrderCardDetail[];
  statusLabel: string;
  active: boolean;
  rootTestId?: string;
}

export function ProductOrderCard({
  product,
  displayName,
  details,
  statusLabel,
  active,
  rootTestId,
}: ProductOrderCardProps) {
  return (
    <ProductCardFrame
      product={product}
      displayName={displayName}
      compact
      rootTestId={rootTestId}
      details={details.map((detail) => (
        <div className={detail.className} key={detail.label}>
          <dt>{detail.label}</dt>
          <dd>{detail.value}</dd>
        </div>
      ))}
      footer={
        <span
          className={`diamant-order-status${active ? "" : " is-complete"}`}
          role="status"
        >
          {statusLabel}
        </span>
      }
    />
  );
}
