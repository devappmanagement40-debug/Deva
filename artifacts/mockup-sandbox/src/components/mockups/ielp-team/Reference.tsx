import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Cpu,
  Globe2,
  House,
  Instagram,
  MessageCircleMore,
  MessageSquare,
  Music2,
  Send,
  UsersRound,
  WalletCards,
} from "lucide-react";
import "../ielp-invest/_group.css";
import "./Reference.css";

const socialLinks = [
  { label: "X", Icon: null, className: "ielp-team-social-x" },
  { label: "Facebook", Icon: null, className: "ielp-team-social-facebook" },
  { label: "Telegram", Icon: Send, className: "" },
  { label: "LinkedIn", Icon: null, className: "ielp-team-social-linkedin" },
  { label: "WhatsApp", Icon: MessageCircleMore, className: "" },
  { label: "Instagram", Icon: Instagram, className: "" },
  { label: "TikTok", Icon: Music2, className: "" },
  { label: "Contacts", Icon: UsersRound, className: "" },
];

const navItems = [
  { label: "Maison", Icon: House },
  { label: <>Exploitation<br />minière</>, Icon: Cpu },
  { label: "Investir+", Icon: CircleDollarSign },
  { label: "Équipe", Icon: UsersRound },
  { label: "Moi", Icon: WalletCards },
];

function DiamantSeal() {
  return (
    <svg className="ielp-invest-mock-seal" viewBox="0 0 90 90" role="img" aria-label="DIAMANT">
      <circle cx="45" cy="45" r="45" fill="#3775a8" />
      <text x="45" y="51" textAnchor="middle" fontSize="8">DIAMANT</text>
    </svg>
  );
}

function BrowserChrome() {
  return (
    <div className="ielp-team-browser" aria-hidden="true">
      <div className="ielp-team-status">
        <span>22:48</span>
        <span className="ielp-team-status-icons">◉ ◈ ◉ ▣ ·</span>
        <span className="ielp-team-status-right">▮▮ 4G 4.5G <i>31</i></span>
      </div>
      <div className="ielp-team-browser-toolbar">
        <House size={21} strokeWidth={2.7} />
        <div className="ielp-team-address">
          <span className="ielp-team-sliders">☷</span>
          <span>/#/team</span>
        </div>
        <span className="ielp-team-browser-plus">+</span>
        <span className="ielp-team-tab">▣</span>
        <span className="ielp-team-menu">⋮</span>
      </div>
    </div>
  );
}

function Reference() {
  const [notice, setNotice] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [date, setDate] = useState("");

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copié`);
    } catch {
      setNotice(`${label} prêt à copier`);
    }
    window.setTimeout(() => setNotice(""), 1800);
  }

  return (
    <main className="ielp-invest-mock-root ielp-team-reference" lang="fr">
      <BrowserChrome />
      <header className="ielp-invest-mock-header">
        <a className="ielp-invest-mock-brand" href="#/team" aria-label="DIAMANT">
          <DiamantSeal />
          <span>DIAMANT</span>
        </a>
        <div className="ielp-invest-mock-actions">
          <button className="ielp-invest-mock-language" type="button" onClick={() => setNotice("Français")}>
            <Globe2 size={19} /><span>Français</span><ChevronDown size={15} />
          </button>
          <button className="ielp-invest-mock-header-chat" type="button" aria-label="Assistance" onClick={() => setNotice("Assistance")}>
            <MessageSquare size={21} fill="white" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="ielp-team-content">
        <button className="ielp-team-commission" type="button" onClick={() => setNotice("Détails de la commission")}>
          Détails de la commission <span>»</span>
        </button>

        <section className="ielp-team-referral" aria-label="Invitation">
          <p className="ielp-team-label">Code d&apos;invitation:</p>
          <div className="ielp-team-code-row">
            <span className="ielp-team-code">dj65gm</span>
            <button type="button" onClick={() => void copyText("dj65gm", "Code")}>Copie</button>
          </div>
          <div className="ielp-team-link-label">
            <span>Partagez votre lien et gagnez</span>
            <button type="button" onClick={() => void copyText("/#/reg?invite_code=dj65gm", "Lien")}>Copie</button>
          </div>
          <button
            type="button"
            className="ielp-team-link"
            onClick={() => void copyText("/#/reg?invite_code=dj65gm", "Lien")}
            aria-label="Copier le lien d'invitation"
          >
            /#/reg?<br />invite_code=dj65gm
          </button>
        </section>

        <section className="ielp-team-share" aria-label="Partager">
          <p>Partager</p>
          <div className="ielp-team-socials">
            {socialLinks.map(({ label, Icon, className }) => (
              <button key={label} type="button" aria-label={`Partager avec ${label}`} onClick={() => setNotice(`Partager avec ${label}`)}>
                {Icon ? <Icon size={21} strokeWidth={2.4} /> : <span className={className}>{label === "Facebook" ? "f" : label === "LinkedIn" ? "in" : "𝕏"}</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="ielp-team-date">
          <button type="button" className="ielp-team-date-trigger" onClick={() => setDateOpen((open) => !open)}>
            <CalendarDays size={22} fill="#e94c65" strokeWidth={2} />
            <span>{date || "Choisissez une date"}</span>
          </button>
          {dateOpen && (
            <input
              aria-label="Choisissez une date"
              type="date"
              value={date}
              onChange={(event) => { setDate(event.target.value); setDateOpen(false); }}
            />
          )}
        </section>

        <section className="ielp-team-stats" aria-label="Statistiques de l'équipe">
          <article><span>Taille de l&apos;équipe</span><strong>0</strong></article>
          <article><span>Commissions de<br />référence</span><strong>$0</strong></article>
          <article><span>Dépôts d&apos;équipe</span><strong>$0</strong></article>
          <article><span>Retraits d&apos;équipes</span><strong>$0</strong></article>
        </section>

        <section className="ielp-team-levels" aria-label="Niveaux de l'équipe">
          {[1, 2, 3].map((level) => (
            <article className="ielp-team-level" key={level}>
              <h2>LEV {level}</h2>
              <div><span>Compter</span><strong>0</strong></div>
              <div><span>Valide</span><strong>0</strong></div>
              <button type="button" onClick={() => setNotice(`Détails du niveau ${level}`)}>Détails <ChevronRight size={15} /></button>
            </article>
          ))}
        </section>
      </div>

      <button className="ielp-invest-mock-chat-float" type="button" aria-label="Ouvrir le chat" onClick={() => setNotice("Assistance")}>
        <MessageCircleMore size={32} strokeWidth={2.6} />
      </button>
      <button className="ielp-invest-mock-support" type="button" aria-label="Contacter le support" onClick={() => setNotice("Support")}>
        <img src="/__mockup/images/support-avatar.png" alt="" />
      </button>

      <nav className="ielp-invest-mock-nav" aria-label="Navigation principale">
        {navItems.map(({ label, Icon }, index) => (
          <button key={index} type="button" className={`ielp-invest-mock-nav-item${index === 3 ? " is-active" : ""}`} onClick={() => setNotice(typeof label === "string" ? label : "Navigation")}>
            <Icon size={22} strokeWidth={index === 3 ? 2.8 : 2.4} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="ielp-team-home-indicator" aria-hidden="true"><span /></div>
      {notice && <div className="ielp-team-notice" role="status">{notice}</div>}
    </main>
  );
}

export default Reference;