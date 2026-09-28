import { Bike, Hash, House, UserRound } from "lucide-react";
import "./_group.css";
import "./Current.css";

const products = [
  { name: "TGOOD Electric Bike", price: 10, days: 8, daily: 0.2, total: 1.6 },
  { name: "TGOOD Electric Scooter", price: 100, days: 18, daily: 2, total: 36 },
  { name: "TGOOD Moped", price: 300, days: 40, daily: 6, total: 240 },
];

function CurrentInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="current-invest-info-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function Current() {
  return (
    <main className="current-invest-root">
      <header className="current-invest-header">
        <div>
          <p className="current-invest-header-value">0</p>
          <a>Mes produits &gt;</a>
        </div>
        <div>
          <p className="current-invest-header-value current-invest-header-value--balance">USDT 0.00</p>
          <a>Mes revenus &gt;</a>
        </div>
      </header>

      <section className="current-invest-list">
        {products.map((product, index) => (
          <article
            className="current-invest-product"
            key={product.name}
            style={{ backgroundImage: "url('/__mockup/images/tgood-product-bike-card.jpg')" }}
          >
            <div className="current-invest-product-overlay" />
            <div className="current-invest-product-content">
              <h2>{product.name}</h2>
              <div className="current-invest-info">
                <CurrentInfoRow label="Prix :" value={`USDT ${product.price.toFixed(2)}`} />
                <CurrentInfoRow label="Durée :" value={`${product.days} jours`} />
                <CurrentInfoRow label="Revenu quotidien :" value={`USDT ${product.daily.toFixed(2)}`} />
                <CurrentInfoRow label="Revenu total :" value={`USDT ${product.total.toFixed(2)}`} />
              </div>
              <button type="button">ACHETER</button>
            </div>
          </article>
        ))}
      </section>

      <nav className="current-invest-nav" aria-label="Navigation principale">
        <div><House size={24} /><span>Accueil</span></div>
        <div className="is-active"><Bike size={24} /><span>Produits</span></div>
        <div><Hash size={24} /><span>Équipe</span></div>
        <div><UserRound size={24} /><span>Moi</span></div>
      </nav>
    </main>
  );
}