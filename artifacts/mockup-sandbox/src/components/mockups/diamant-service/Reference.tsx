import {
  ArrowUpRight,
  BatteryFull,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  EllipsisVertical,
  Headset,
  MessageCircleMore,
  Send,
  ShieldCheck,
  Signal,
  Wifi,
} from "lucide-react";
import "./_group.css";
import "./Reference.css";

const telegramLinks = [
  "Service client DIAMANT",
  "Assistance DIAMANT",
  "Communauté DIAMANT",
  "Actualités DIAMANT",
];

function TelegramAction({ label }: { label: string }) {
  return (
    <div className="diamant-telegram-action">
      <span className="diamant-telegram-action__icon" aria-hidden="true">
        <Send size={18} strokeWidth={2.2} />
      </span>
      <span>{label}</span>
      <ArrowUpRight className="diamant-telegram-action__arrow" size={17} />
    </div>
  );
}

export default function Reference() {
  return (
    <div className="diamant-reference">
      <div className="diamant-device">
        <div className="diamant-statusbar">
          <span className="diamant-statusbar__time">07:39</span>
          <span className="diamant-statusbar__notification" aria-hidden="true" />
          <Download size={15} strokeWidth={2.6} />
          <span className="diamant-statusbar__spacer" />
          <Signal size={16} strokeWidth={2.4} />
          <Wifi size={17} strokeWidth={2.4} />
          <BatteryFull size={18} strokeWidth={2.4} />
          <span className="diamant-statusbar__percent">88%</span>
        </div>

        <div className="diamant-browserbar">
          <span className="diamant-browserbar__close" aria-hidden="true">
            <span />
          </span>
          <div className="diamant-browserbar__title">
            <strong>Centre d’aide</strong>
            <span>Assistance DIAMANT</span>
          </div>
          <ChevronDown size={23} strokeWidth={2.5} />
          <EllipsisVertical size={22} strokeWidth={2.5} />
        </div>

        <main className="diamant-page-scroll">
          <header className="diamant-appbar">
            <span className="diamant-appbar__back" aria-hidden="true">
              <ChevronLeft size={26} strokeWidth={2.6} />
            </span>
            <h1>Centre d’aide</h1>
            <span className="diamant-appbar__balance" aria-hidden="true" />
          </header>

          <section className="diamant-hero">
            <div className="diamant-hero__copy">
              <div className="diamant-brandline">
                <img src="/__mockup/images/diamant-logo-light.png" alt="" />
                <span>DIAMANT</span>
              </div>
              <h2>Centre de service</h2>
              <p>Nous vous accompagnons à chaque étape dont vous avez besoin</p>
            </div>
            <div className="diamant-hero__portrait-wrap" aria-hidden="true">
              <div className="diamant-hero__portrait-halo" />
              <img
                className="diamant-hero__portrait"
                src="/__mockup/images/diamant-support-avatar.png"
                alt=""
              />
              <div className="diamant-hero__laptop">
                <span />
              </div>
              <div className="diamant-hero__headset">
                <Headset size={18} />
              </div>
            </div>
            <div className="diamant-hero__spark diamant-hero__spark--one" />
            <div className="diamant-hero__spark diamant-hero__spark--two" />
          </section>

          <section className="diamant-content" aria-label="Informations de service">
            <article className="diamant-card diamant-deposit-card">
              <div className="diamant-card-icon diamant-card-icon--deposit">
                <CircleHelp size={43} strokeWidth={2.7} />
                <span className="diamant-card-icon__dot" />
              </div>
              <div className="diamant-card-copy">
                <h3>Votre dépôt n’a pas encore été reçu&nbsp;?</h3>
                <p>
                  Après avoir réussi à créditer votre compte, si le solde n’est pas
                  apparu, veuillez le signaler ici et notre service client vous
                  assistera&nbsp;!
                </p>
              </div>
            </article>

            <article className="diamant-card diamant-hours-card">
              <div className="diamant-card-icon diamant-card-icon--hours">
                <Clock3 size={31} strokeWidth={2.8} />
              </div>
              <div className="diamant-card-copy">
                <h3>Service en ligne</h3>
                <p>Horaires d’ouverture&nbsp;: 08:00:00 à 17:00:00</p>
                <span className="diamant-online-status">
                  <span /> En ligne maintenant
                </span>
              </div>
            </article>

            <article className="diamant-card diamant-telegram-card">
              <div className="diamant-telegram-card__intro">
                <div className="diamant-card-icon diamant-card-icon--telegram">
                  <Send size={37} strokeWidth={2.7} />
                </div>
                <div className="diamant-card-copy">
                  <h3>Telegram</h3>
                  <p>
                    Suivez notre chaîne officielle Telegram pour obtenir les
                    dernières nouvelles d’événements et recevoir des avantages de
                    la boîte au trésor.
                  </p>
                </div>
              </div>
              <div className="diamant-telegram-card__links">
                {telegramLinks.map((label) => (
                  <TelegramAction key={label} label={label} />
                ))}
              </div>
            </article>

            <section className="diamant-guidance">
              <div className="diamant-guidance__heading">
                <span className="diamant-guidance__shield">
                  <ShieldCheck size={20} strokeWidth={2.2} />
                </span>
                <div>
                  <h2>CONSEILS :</h2>
                </div>
              </div>
              <ol>
                <li>
                  Pour toute question concernant la plateforme, utilisez uniquement
                  les liens DIAMANT publiés dans cette page.
                </li>
                <li>
                  Ne partagez jamais votre mot de passe, vos codes de validation ou
                  vos informations de portefeuille.
                </li>
                <li>
                  Le support officiel DIAMANT ne vous demandera jamais vos codes
                  confidentiels.
                </li>
                <li>
                  Méfiez-vous des comptes qui prétendent représenter DIAMANT sans
                  lien publié ici.
                </li>
              </ol>
            </section>
          </section>
        </main>

        <div className="diamant-chat-fab" aria-hidden="true">
          <MessageCircleMore size={30} strokeWidth={2.2} />
          <span className="diamant-chat-fab__status" />
        </div>
        <div className="diamant-gesture" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}