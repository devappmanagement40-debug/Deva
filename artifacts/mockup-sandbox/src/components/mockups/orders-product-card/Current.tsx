import { Image as ImageIcon } from "lucide-react";
import "./_group.css";

type Product = {
  price: number;
  dailyEarnings: number;
  cycleDays: number;
  totalReturn: number;
  imageUrl: string | null;
  cardColor: string | null;
};

type ProductCardCopy = {
  daily: string;
  term: string;
  days: string;
  total: string;
  priceLabel: string;
};

const product: Product = {
  price: 18,
  dailyEarnings: 300,
  cycleDays: 360,
  totalReturn: 108000,
  imageUrl: "/__mockup/images/diamant-stabiliser-01.jpg",
  cardColor: "#e85aa7",
};

const labels: ProductCardCopy = {
  daily: "Revenu quotidien",
  term: "Jours de revenu",
  days: "jours",
  total: "Revenu total",
  priceLabel: "Prix",
};

function formatXof(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
}

function ProductCatalogCard({
  product,
  displayName,
  labels,
  actionLabel,
  onAction,
}: {
  product: Product;
  displayName: string;
  labels: ProductCardCopy;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <article
      className="diamant-invest-product-card"
      data-card-colored={!!product.cardColor}
      style={product.cardColor ? {
        backgroundColor: `color-mix(in srgb, ${product.cardColor} 38%, #f5f7ff)`,
        borderColor: `color-mix(in srgb, ${product.cardColor} 62%, #7885ac)`,
        borderInlineStartWidth: 5,
        borderInlineStartColor: product.cardColor,
      } : undefined}
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
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={displayName} />
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
        <button type="button" onClick={onAction} className="diamant-invest-buy">{actionLabel}</button>
      </div>
    </article>
  );
}

export function Current() {
  return (
    <main className="preview-shell">
      <section className="preview-content">
        <header className="preview-heading">
          <span>Carte de référence</span>
          <h1>Page Produits</h1>
        </header>
        <ProductCatalogCard
          product={product}
          displayName="VIP 1"
          labels={labels}
          actionLabel="Acheter"
          onAction={() => undefined}
        />
      </section>
    </main>
  );
}
