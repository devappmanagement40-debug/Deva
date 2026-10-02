import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Headset,
  MessageCircleMore,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { getContent, rebrandText } from "@/lib/content";
import "./service.css";

interface LinksSettings {
  supportLink: string;
  support2Link: string;
  channelLink: string;
  groupLink: string;
  supportType: string;
  support2Type: string;
  channelType: string;
  groupType: string;
  supportLabel: string;
  support2Label: string;
  channelLabel: string;
  groupLabel: string;
  supportEnabled: string;
  support2Enabled: string;
  channelEnabled: string;
  groupEnabled: string;
  floatingSupportTarget?: string;
  withdrawalStartHour: string;
  withdrawalEndHour: string;
}

interface SupportLink {
  label: string;
  href: string;
  testId: string;
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00:00`;
}

function openSupportLink(href: string) {
  if (href) window.open(href, "_blank", "noopener,noreferrer");
}

export default function ServicePage() {
  const { t } = useI18n();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    const timer = window.setInterval(updateHour, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: settings } = useQuery<LinksSettings>({
    queryKey: ["/api/settings/links"],
  });
  const { data: contentSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const fallbackTitle = t.serviceTitle === "Service client" ? "Centre d'aide" : t.serviceTitle;
  const servicePageTitle = getContent(
    contentSettings,
    "content_service_pageTitle",
    fallbackTitle,
  );

  const startHour = Number.parseInt(settings?.withdrawalStartHour || "9", 10);
  const endHour = Number.parseInt(settings?.withdrawalEndHour || "17", 10);
  const hoursDisplay = `${formatHour(startHour)} à ${formatHour(endHour)}`;
  const isServiceOnline = startHour < endHour
    ? currentHour >= startHour && currentHour < endHour
    : currentHour >= startHour || currentHour < endHour;

  const allLinks: (SupportLink & { enabled: boolean })[] = [
    {
      label: settings?.supportLabel || "",
      href: settings?.supportLink || "",
      testId: "button-support-link",
      enabled: settings?.supportEnabled !== "false" && !!settings?.supportLink,
    },
    {
      label: settings?.support2Label || "",
      href: settings?.support2Link || "",
      testId: "button-support2-link",
      enabled: settings?.support2Enabled !== "false" && !!settings?.support2Link,
    },
    {
      label: settings?.groupLabel || "",
      href: settings?.groupLink || "",
      testId: "button-group-link",
      enabled: settings?.groupEnabled !== "false" && !!settings?.groupLink,
    },
    {
      label: settings?.channelLabel || "",
      href: settings?.channelLink || "",
      testId: "button-channel-link",
      enabled: settings?.channelEnabled !== "false" && !!settings?.channelLink,
    },
  ];
  const links = allLinks.filter((link) => link.enabled);
  const primarySupport = links.find((link) => link.testId === "button-support-link");
  const secondarySupport = links.find((link) => link.testId === "button-support2-link");
  const depositHelpLink = primarySupport || secondarySupport || links[0];
  const preferredFloatingLink = settings?.floatingSupportTarget === "support2"
    ? secondarySupport
    : primarySupport;
  const floatingLink = preferredFloatingLink || primarySupport || secondarySupport || links[0];
  const hoursLabel = getContent(
    contentSettings,
    "content_service_withdrawalHoursText",
    "Horaires d'ouverture",
  );

  return (
    <div className="diamant-service-page">
      <header className="diamant-service-header">
        <Link href="/account" className="diamant-service-back" aria-label="Retour au compte">
          <ChevronLeft aria-hidden="true" size={25} strokeWidth={2.5} />
        </Link>
        <h1>{servicePageTitle}</h1>
        <span className="diamant-service-header-spacer" aria-hidden="true" />
      </header>

      <section className="diamant-service-hero" aria-labelledby="service-hero-title">
        <div className="diamant-service-hero-copy">
          <h2 id="service-hero-title">Centre de service</h2>
          <p>Nous vous accompagnons à chaque étape dont vous avez besoin</p>
        </div>
        <div className="diamant-service-hero-art">
          <img
            src="/support-avatar.png"
            alt="Conseillère DIAMANT du service client"
            draggable={false}
          />
          <span className="diamant-service-hero-laptop" aria-hidden="true">
            <span />
          </span>
          <span className="diamant-service-hero-headset" aria-hidden="true">
            <Headset size={15} />
          </span>
        </div>
      </section>

      <main className="diamant-service-content">
        <section className="diamant-service-card diamant-service-deposit">
          <div className="diamant-service-icon diamant-service-icon-deposit" aria-hidden="true">
            <CircleDollarSign size={36} strokeWidth={2.1} />
          </div>
          <div className="diamant-service-card-copy">
            <h2>Votre dépôt n'a pas encore été reçu&nbsp;?</h2>
            <p>
              Après avoir réussi à créditer votre compte, si le solde n'est pas apparu,
              veuillez le signaler ici et notre service client vous assistera&nbsp;!
            </p>
            {depositHelpLink && (
              <button
                type="button"
                className="diamant-service-text-action"
                onClick={() => openSupportLink(depositHelpLink.href)}
                data-testid="button-deposit-support"
              >
                Signaler mon dépôt
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        <section className="diamant-service-card diamant-service-hours-card">
          <div className="diamant-service-icon diamant-service-icon-hours" aria-hidden="true">
            <Clock3 size={34} strokeWidth={2.1} />
          </div>
          <div className="diamant-service-card-copy">
            <div className="diamant-service-card-heading">
              <h2>Service en ligne</h2>
              <span
                className="diamant-service-status"
                data-online={isServiceOnline}
                aria-live="polite"
              >
                {isServiceOnline ? t.serviceOnlineNow : t.serviceOfflineNow}
              </span>
            </div>
            <p>
              {hoursLabel} : <span className="diamant-service-hours-value">{hoursDisplay}</span>
            </p>
          </div>
        </section>

        <section className="diamant-service-card diamant-service-telegram-card">
          <div className="diamant-service-icon diamant-service-icon-telegram" aria-hidden="true">
            <img src="/telegram-support-icon.png" alt="" />
          </div>
          <div className="diamant-service-card-copy">
            <h2>Telegram</h2>
            <p>
              Suivez notre chaîne officielle Telegram pour obtenir les dernières nouvelles
              et recevoir les avantages de DIAMANT.
            </p>
            {links.length > 0 && (
              <div className="diamant-service-links">
                {links.map((link) => {
                  const label = rebrandText(link.label || "Support DIAMANT");
                  const handle = label.startsWith("@") ? label : `@${label}`;
                  return (
                    <button
                      key={link.testId}
                      type="button"
                      className="diamant-service-link"
                      onClick={() => openSupportLink(link.href)}
                      data-testid={link.testId}
                    >
                      <span>{handle}</span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="diamant-service-security" aria-labelledby="service-security-title">
          <div className="diamant-service-security-title">
            <ShieldCheck size={20} aria-hidden="true" />
            <h2 id="service-security-title">Conseils de sécurité</h2>
          </div>
          <ol>
            <li>Pour toute question, utilisez uniquement les liens DIAMANT publiés sur cette page.</li>
            <li>Ne partagez jamais votre mot de passe, vos codes de validation ou vos informations de portefeuille.</li>
            <li>Le support officiel DIAMANT ne vous demandera jamais vos codes confidentiels.</li>
            <li>Méfiez-vous des comptes qui prétendent représenter DIAMANT sans lien publié ici.</li>
          </ol>
        </section>
      </main>

      {floatingLink && (
        <button
          type="button"
          className="diamant-service-fab"
          aria-label="Contacter le service client DIAMANT"
          onClick={() => openSupportLink(floatingLink.href)}
          data-testid="button-floating-support"
        >
          <MessageCircleMore size={26} strokeWidth={2.4} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}