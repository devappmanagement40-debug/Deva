import { useState } from "react";
import { Bike, Hash, House, UserRound } from "lucide-react";
import "../ielp-invest/_group.css";
import "./Current.css";

const code = "DJ65GM";
const inviteLink = `https://www.ielp-mining.cc/register?ref=${code}`;
const levelRates = ["10%", "2%", "1%"];

function Current() {
  const [notice, setNotice] = useState("");

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied`);
    } catch {
      setNotice("Copy failed");
    }
    window.setTimeout(() => setNotice(""), 1600);
  }

  return (
    <main className="team-current">
      <header className="team-current-header">
        <h1>Mon équipe</h1>
        <button type="button" onClick={() => setNotice("Membres")}>Membres &gt;</button>
      </header>

      <section className="team-current-body">
        <img
          className="team-current-hero"
          src="/__mockup/images/tgood-team-hero.jpg"
          alt="TGOOD electric charging station"
        />

        <div className="team-current-invite">
          <img
            src="/__mockup/images/tgood-team-invite.jpg"
            alt="Borne de recharge verte"
          />
          <div>
            <h2>Inviter des amis</h2>
            <p>Partagez le code ou le lien d’invitation</p>
            <span className="team-current-value">{code}</span>
            <button type="button" onClick={() => void copy(code, "Code")}>Copier</button>
            <span className="team-current-value team-current-link">{inviteLink}</span>
            <button type="button" onClick={() => void copy(inviteLink, "Link")}>Copier</button>
          </div>
        </div>

        <section className="team-current-totals">
          <button type="button" onClick={() => setNotice("Membres")}>
            <strong>0</strong><span>Utilisateurs totaux &gt;</span>
          </button>
          <button type="button" onClick={() => setNotice("Récompenses")}>
            <strong>USDT 0</strong><span>Récompenses totales &gt;</span>
          </button>
        </section>

        <h2 className="team-current-heading">INVITER VOS AMIS À REJOINDRE L’ÉQUIPE</h2>
        {[1, 2, 3].map((level) => (
          <section className="team-current-level" key={level}>
            <strong>LV{level}</strong>
            <div><b>{levelRates[level - 1]}</b><span>Commission</span></div>
            <div><b>0</b><span>Utilisateurs</span></div>
            <div><b>0</b><span>Récompenses</span></div>
          </section>
        ))}
        <p className="team-current-tip">
          Les trois niveaux de votre équipe déterminent les commissions prévues par le programme de parrainage.
        </p>
      </section>

      <nav className="team-current-nav" aria-label="Navigation principale">
        {[
          { label: "Maison", Icon: House },
          { label: "Produits", Icon: Bike },
          { label: "Équipe", Icon: Hash },
          { label: "Moi", Icon: UserRound },
        ].map(({ label, Icon }) => (
          <button
            type="button"
            key={label}
            className={label === "Équipe" ? "is-active" : ""}
            onClick={() => setNotice(label)}
          >
            <Icon size={23} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {notice && <div className="team-current-notice" role="status">{notice}</div>}
    </main>
  );
}

export default Current;