import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import "./_group.css";

const t = {
  serviceTitle: "Service client",
  serviceHoursLabel: "Horaires du service client",
  serviceOnlineNow: "En ligne maintenant",
  serviceOfflineNow: "Hors ligne actuellement",
};

const settings: LinksSettings = {
  supportLink: "#",
  support2Link: "#",
  channelLink: "#",
  groupLink: "#",
  supportType: "telegram",
  support2Type: "telegram",
  channelType: "telegram",
  groupType: "telegram",
  supportLabel: "Service client DIAMANT",
  support2Label: "Assistance DIAMANT",
  channelLabel: "Actualités DIAMANT",
  groupLabel: "Communauté DIAMANT",
  supportEnabled: "true",
  support2Enabled: "true",
  channelEnabled: "true",
  groupEnabled: "true",
  withdrawalStartHour: "8",
  withdrawalEndHour: "17",
};

const contentSettings: Record<string, string> = {};
const getContent = (_settings: Record<string, string>, _key: string, fallback: string) => fallback;
const rebrandText = (value: string) => value;

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
  withdrawalStartHour: string;
  withdrawalEndHour: string;
}

/* Convertit une heure en format AM/PM */
function toAmPm(h: number): string {
  if (h === 0)  return "12:00 AM";
  if (h < 12)   return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

export default function ServicePage() {
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    const timer = window.setInterval(updateHour, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const servicePageTitle = getContent(contentSettings, "content_service_pageTitle", t.serviceTitle);

  const startHour = parseInt(settings?.withdrawalStartHour || "9", 10);
  const endHour   = parseInt(settings?.withdrawalEndHour   || "17", 10);
  const hoursDisplay = `${toAmPm(startHour)}-${toAmPm(endHour)}`;
  const isServiceOnline = startHour < endHour
    ? currentHour >= startHour && currentHour < endHour
    : currentHour >= startHour || currentHour < endHour;

  const allLinks = [
    {
      label:   settings?.supportLabel  || "",
      href:    settings?.supportLink   || "",
      testId:  "button-support-link",
      enabled: settings?.supportEnabled  !== "false" && !!settings?.supportLink,
    },
    {
      label:   settings?.support2Label || "",
      href:    settings?.support2Link  || "",
      testId:  "button-support2-link",
      enabled: settings?.support2Enabled !== "false" && !!settings?.support2Link,
    },
    {
      label:   settings?.groupLabel    || "",
      href:    settings?.groupLink     || "",
      testId:  "button-group-link",
      enabled: settings?.groupEnabled  !== "false" && !!settings?.groupLink,
    },
    {
      label:   settings?.channelLabel  || "",
      href:    settings?.channelLink   || "",
      testId:  "button-channel-link",
      enabled: settings?.channelEnabled !== "false" && !!settings?.channelLink,
    },
  ];
  const links = allLinks.filter(l => l.enabled);

  return (
    <div
      className="ielp-service-page flex flex-col min-h-screen"
      style={{
        color: "#f7f8ff",
        backgroundColor: "#02071d",
        backgroundImage: "url('/__mockup/images/auth-night-sky.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    >

       {/* ══ HEADER DIAMANT ══ */}
      <div
        className="ielp-service-header flex items-center px-4 py-3"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          flexShrink: 0,
          background: "rgba(4, 8, 29, .96)",
        }}
      >
        <a href="#" aria-label="Retour au compte">
          <button
            className="w-9 h-9 flex items-center justify-center active:opacity-70"
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </a>
        <h1 className="flex-1 text-center text-white font-semibold text-base mr-9">
          {servicePageTitle}
        </h1>
      </div>

      {/* ══ HERO — logo + personnages ══ */}
      <div
        className="ielp-service-hero"
        style={{
          background: "linear-gradient(145deg, rgba(5, 9, 35, .76) 0%, rgba(7, 18, 60, .54) 48%, rgba(7, 85, 135, .62) 100%)",
          paddingBottom: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo DIAMANT */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            padding: "8px 20px",
            marginTop: 16,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          <img src="/__mockup/images/diamant-logo-light.png" alt="DIAMANT" style={{ height: 90, width: 120, objectFit: "contain" }} />
        </div>
      </div>

      {/* ══ CARTE HORAIRES ══ */}
      <div className="px-3 mt-3">
        <div
          className="ielp-service-hours rounded-2xl text-center py-5 px-4"
          style={{ background: "linear-gradient(100deg, #078be4, #704cff)" }}
        >
          <p
            className="font-black tracking-wide"
            style={{ fontSize: 26, color: "#fff", lineHeight: 1.1 }}
          >
            {hoursDisplay}
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 6 }}>
            {getContent(contentSettings, "content_service_withdrawalHoursText", t.serviceHoursLabel)}
            <span className="mt-1 block font-semibold" style={{ color: "#fff" }}>
              {isServiceOnline ? t.serviceOnlineNow : t.serviceOfflineNow}
            </span>
          </p>
        </div>
      </div>

      {/* ══ SECTION LIENS ══ */}
      <div className="px-3 mt-4">
        {/* Label "Telegram" */}
        <p
          className="ielp-service-label"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#f7f8ff",
            marginBottom: 10,
            marginLeft: 2,
          }}
        >
           {links.length > 0 ? "Telegram" : "Liens de support non configurés"}
        </p>

        {/* Boutons liens */}
        <div className="space-y-3">
          {links.map((link) => (
            <button
              key={link.testId}
              type="button"
              onClick={() => link.href !== "#" && window.open(link.href, "_blank", "noopener,noreferrer")}
              className="w-full flex items-center justify-between active:opacity-80 transition-opacity"
              style={{
                background: "linear-gradient(100deg, #078be4, #704cff)",
                borderRadius: 999,
                padding: "15px 20px",
                border: "none",
                cursor: "pointer",
              }}
              data-testid={link.testId}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                @{rebrandText(link.label)}
              </span>
              <ChevronRight
                style={{ color: "#fff", width: 20, height: 20, flexShrink: 0 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ══ CONSEILS ══ */}
      <div className="px-4 mt-6 pb-24">
        <p
          className="ielp-service-guidance-title"
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#f7f8ff",
            marginBottom: 10,
            letterSpacing: 0.5,
          }}
        >
          CONSEILS :
        </p>
        <div className="ielp-service-guidance-copy" style={{ color: "#c4cde2", fontSize: 13, lineHeight: 1.8 }}>
           <p>
             1. Pour toute question concernant la plateforme, utilisez uniquement
              les liens DIAMANT publiés dans cette page.
           </p>
           <p style={{ marginTop: 6 }}>
             2. Ne partagez jamais votre mot de passe, vos codes de validation ou
             vos informations de portefeuille.
           </p>
           <p style={{ marginTop: 6 }}>
              3. Le support officiel DIAMANT ne vous demandera jamais vos codes confidentiels.
           </p>
           <p style={{ marginTop: 6 }}>
              4. Méfiez-vous des comptes qui prétendent représenter DIAMANT sans lien publié ici.
           </p>
        </div>
      </div>

    </div>
  );
}
