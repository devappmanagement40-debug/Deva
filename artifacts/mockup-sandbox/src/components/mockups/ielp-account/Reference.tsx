import { useState } from "react";
import {
  ArrowLeftRight,
  Bot,
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  CircleHelp,
  Eye,
  EyeOff,
  Globe2,
  Headphones,
  KeyRound,
  MessageCircleMore,
  MessageSquare,
  PanelsTopLeft,
  UsersRound,
  UserRound,
  House,
  Cpu,
  WalletCards,
} from "lucide-react";
import "./_group.css";
import "./Reference.css";

const SHORTCUTS = [
  { label: "Dépôt", Icon: WalletCards },
  { label: "Retirer", Icon: Bot },
  { label: "Déclarations", Icon: ChartNoAxesCombined },
  { label: "Transfert", Icon: ArrowLeftRight },
  { label: "Équipe", Icon: UsersRound },
];

const ACCOUNT_LINKS = [
  { label: "FAQ", Icon: CircleHelp },
  { label: "Mot de passe", Icon: BookOpen },
  { label: "Code PIN de sécurité", Icon: KeyRound },
  { label: "Soutien", Icon: Headphones },
  { label: "Détails de l'entreprise DIAMANT", Icon: BookOpen },
  { label: "À propos", Icon: PanelsTopLeft },
];

function DiamantSeal() {
  return (
    <svg className="ielp-home-seal" viewBox="0 0 90 90" role="img" aria-label="DIAMANT">
      <circle cx="45" cy="45" r="45" fill="#3775a8" />
      <text x="45" y="51" textAnchor="middle" fontSize="8">DIAMANT</text>
    </svg>
  );
}

function PasswordGlyph() {
  return (
    <span className="ielp-account-password-icon" aria-hidden="true">
      <span>***</span>
      <i />
    </span>
  );
}

function ReferenceNav() {
  const items = [
    { label: "Maison", Icon: House },
    { label: "Exploitation minière", Icon: Cpu },
    { label: "Investir+", Icon: CircleDollarSign },
    { label: "Équipe", Icon: UsersRound },
    { label: "Moi", Icon: WalletCards },
  ];
  return (
    <nav className="ielp-account-bottom-nav" aria-label="Navigation principale">
      {items.map(({ label, Icon }, index) => (
        <button key={label} type="button" className={index === 4 ? "is-active" : ""}>
          <Icon size={22} strokeWidth={index === 4 ? 2.8 : 2.4} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Reference() {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <main className="ielp-home-page ielp-account-page" lang="fr">
      <div className="ielp-home-shell ielp-account-shell">
        <header className="ielp-home-header">
          <a className="ielp-home-brand" href="#/" aria-label="DIAMANT accueil">
            <DiamantSeal />
            <span>DIAMANT</span>
          </a>
          <div className="ielp-home-header__actions">
            <button type="button" className="ielp-account-language">
              <Globe2 size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>Français</span>
            </button>
            <button type="button" className="ielp-home-chat-top" aria-label="Service client" onClick={() => setMessage("Service client")}>
              <MessageSquare size={20} fill="white" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="ielp-account-content">
          <section className="ielp-account-profile" aria-label="Profil">
            <div className="ielp-account-avatar" aria-hidden="true">
              <UserRound size={36} strokeWidth={2.8} />
            </div>
            <div className="ielp-account-profile-copy">
              <div className="ielp-account-phone">
                <span>{phoneVisible ? "+1 12345678" : "+1*****12345678"}</span>
                <button type="button" aria-label={phoneVisible ? "Masquer le numéro" : "Afficher le numéro"} onClick={() => setPhoneVisible((value) => !value)}>
                  {phoneVisible ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>
              <span className="ielp-account-level">Launchpool</span>
            </div>
          </section>

          <section className="ielp-account-shortcuts" aria-label="Actions rapides">
            {SHORTCUTS.map(({ label, Icon }, index) => (
              <button
                key={label}
                type="button"
                className={`ielp-account-shortcut ielp-account-shortcut--${index + 1}`}
                onClick={() => setMessage(label)}
              >
                <span className="ielp-account-shortcut-icon">
                  <Icon size={25} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span>{label}</span>
              </button>
            ))}
          </section>

          <section className="ielp-account-links" aria-label="Compte et assistance">
            {ACCOUNT_LINKS.map(({ label, Icon }) => (
              <button key={label} type="button" className="ielp-account-link" onClick={() => setMessage(label)}>
                {label === "Mot de passe" ? <PasswordGlyph /> : <Icon size={24} strokeWidth={2.1} aria-hidden="true" />}
                <span>{label}</span>
                <ChevronRight size={20} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ))}
          </section>

          <button type="button" className="ielp-account-logout" onClick={() => setMessage("Déconnexion")}>
            DÉCONNEXION
          </button>
        </div>

        <button className="ielp-home-chat-float" type="button" aria-label="Service client" onClick={() => setMessage("Service client")}>
          <MessageCircleMore size={32} strokeWidth={2.6} aria-hidden="true" />
        </button>
        <button className="ielp-account-support-avatar" type="button" aria-label="Contacter le support" onClick={() => setMessage("Soutien")}>
          <img src="/__mockup/images/support-avatar.png" alt="" />
        </button>
        {message && <span className="sr-only" role="status">{message}</span>}
        <ReferenceNav />
      </div>
    </main>
  );
}