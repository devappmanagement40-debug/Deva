import {
  ChevronDown,
  CircleDollarSign,
  Cpu,
  Globe2,
  House,
  MessageCircleMore,
  MessageSquare,
  UsersRound,
  WalletCards,
} from "lucide-react";
import "./_group.css";
import "./Reference.css";

const products = [
  { days: 8, price: 10, dailyRate: "2.00", count: 3, fixedRate: 116 },
  { days: 18, price: 20, dailyRate: "2.50", count: 3, fixedRate: 145 },
  { days: 120, price: 100, dailyRate: "5.00", count: 1, fixedRate: 700 },
];

function IelpSeal() {
  return (
    <svg className="ielp-invest-mock-seal" viewBox="0 0 90 90" role="img" aria-label="Icahn Enterprises L.P.">
      <circle cx="45" cy="45" r="45" fill="#3775a8" />
      <text x="57" y="36" textAnchor="middle">ICAHN</text>
      <text x="45" y="49" textAnchor="middle">ENTERPRISES</text>
      <text x="60" y="62" textAnchor="middle">L.P.</text>
    </svg>
  );
}

function ProductMark() {
  return (
    <svg className="ielp-invest-mock-product-mark" viewBox="0 0 112 112" role="img" aria-label="Icahn Enterprises L.P.">
      <rect width="112" height="112" rx="7" fill="#346b96" />
      <g fill="#f4f7fa" fontFamily="Georgia, serif" textAnchor="middle">
        <text x="76" y="47" fontSize="12">ICAHN</text>
        <text x="76" y="62" fontSize="12">ENTERPRISES</text>
        <text x="76" y="77" fontSize="12">L.P.</text>
      </g>
    </svg>
  );
}

function ReferenceProduct({ product, index }: { product: typeof products[number]; index: number }) {
  return (
    <article className="ielp-invest-mock-card">
      <h2 dir="ltr">IELP Investment Products {index + 1}</h2>
      <div className="ielp-invest-mock-card-details">
        <ProductMark />
        <dl>
          <div><dt>Tous les jours:</dt><dd className="is-daily">{product.dailyRate}%</dd></div>
          <div><dt>Terme:</dt><dd>{product.days} jours</dd></div>
          <div className="is-minimum"><dt>Investissement minimum:</dt><dd>{product.price.toFixed(2)} USDT</dd></div>
          <div><dt>Investissement total:</dt><dd>{product.count}</dd></div>
          <div><dt>Durée déterminée:</dt><dd>{product.fixedRate}%</dd></div>
        </dl>
      </div>
      <button type="button">INVESTISSEZ MAINTENANT</button>
    </article>
  );
}

export function Reference() {
  return (
    <main className="ielp-invest-mock-root">
      <header className="ielp-invest-mock-header">
        <a className="ielp-invest-mock-brand" href="#/">
          <IelpSeal />
          <span>IELP</span>
        </a>
        <div className="ielp-invest-mock-actions">
          <div className="ielp-invest-mock-language"><Globe2 size={19} /><span>Français</span><ChevronDown size={15} /></div>
          <button className="ielp-invest-mock-header-chat" type="button" aria-label="Assistance"><MessageSquare size={21} fill="white" strokeWidth={1.8} /></button>
        </div>
      </header>

      <div className="ielp-invest-mock-content">
        <section className="ielp-invest-mock-intro">
          <p>Introduction aux produits d'investissement et de gestion de patrimoine</p>
          <p>Nous vous aidons à réaliser une croissance rapide de votre patrimoine !</p>
          <p>Dans ce marché en constante évolution, nous proposons des produits d'investissement et de gestion</p>
          <button type="button"><span>Plus</span><ChevronDown size={16} /></button>
        </section>

        <a className="ielp-invest-mock-owned" href="#/my-products">Investir des données</a>

        <section className="ielp-invest-mock-products">
          {products.map((product, index) => (
            <ReferenceProduct key={product.price} product={product} index={index} />
          ))}
        </section>
      </div>

      <button className="ielp-invest-mock-chat-float" type="button" aria-label="Assistance"><MessageCircleMore size={32} strokeWidth={2.6} /></button>
      <button className="ielp-invest-mock-support" type="button" aria-label="Assistance">
        <img src="/__mockup/images/support-avatar.png" alt="" />
      </button>

      <nav className="ielp-invest-mock-nav" aria-label="Navigation principale">
        <div className="ielp-invest-mock-nav-item"><House size={22} /><span>Maison</span></div>
        <div className="ielp-invest-mock-nav-item"><Cpu size={22} /><span>Exploitation minière</span></div>
        <div className="ielp-invest-mock-nav-item is-active"><CircleDollarSign size={22} /><span>Investir+</span></div>
        <div className="ielp-invest-mock-nav-item"><UsersRound size={22} /><span>Équipe</span></div>
        <div className="ielp-invest-mock-nav-item"><WalletCards size={22} /><span>Moi</span></div>
      </nav>
    </main>
  );
}