import { Image as ImageIcon } from "lucide-react";
import "./_group.css";

const product = {
  price: 18,
  dailyEarnings: 300,
  cycleDays: 360,
  totalReturn: 108000,
  imageUrl: "/__mockup/images/diamant-stabiliser-01.jpg",
  cardColor: "#e85aa7",
};

function formatXof(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
}

export function PurchasedData() {
  const details = [
    { label: "Revenu quotidien", value: <>{formatXof(product.dailyEarnings)} <small>XOF</small></> },
    { label: "Durée", value: `${product.cycleDays} jours` },
    { label: "Revenu total", value: <>{formatXof(product.totalReturn)} <small>XOF</small></> },
    { label: "Gains obtenus", value: <>12 000,00 <small>XOF</small></> },
    { label: "Jours restants", value: "320" },
    { label: "Acheté le", value: "27/08/2026 · 09:00", className: "diamant-order-date-row" },
    { label: "Expiration", value: "22/08/2027 · 09:00", className: "diamant-order-date-row" },
  ];

  return (
    <main className="preview-shell">
      <section className="preview-content">
        <header className="preview-heading">
          <span>Même carte — données d’achat</span>
          <h1>Commande</h1>
        </header>
        <article
          className="diamant-invest-product-card is-order-compact"
          data-testid="order-card-preview"
          style={{
            backgroundColor: `color-mix(in srgb, ${product.cardColor} 38%, #f5f7ff)`,
            borderColor: `color-mix(in srgb, ${product.cardColor} 62%, #7885ac)`,
            borderInlineStartWidth: 5,
            borderInlineStartColor: product.cardColor,
          }}
        >
          <div className="diamant-invest-product-main">
            <div className="diamant-invest-product-copy">
              <div className="diamant-invest-product-title-row">
                <h3>VIP 1</h3>
              </div>
              <dl>
                {details.map((detail) => (
                  <div className={detail.className} key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div
              className="diamant-invest-product-visual"
              style={{ borderColor: `color-mix(in srgb, ${product.cardColor} 65%, #7784aa)` }}
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="VIP 1" />
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
              <span className="sr-only">Prix</span>
              <strong>{formatXof(product.price)} <small>XOF</small></strong>
            </div>
            <span className="diamant-order-status" role="status">En cours</span>
          </div>
        </article>
      </section>
    </main>
  );
}
