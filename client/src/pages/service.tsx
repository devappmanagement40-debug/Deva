import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { getContent } from "@/lib/content";

/* ── Palette TGOOD ───────────────────────── */
const GREEN = "#078438";

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
    <div className="ielp-service-page flex flex-col min-h-screen" style={{ background: "#f2f2f2" }}>

       {/* ══ HEADER TGOOD ══ */}
      <div
        className="ielp-service-header flex items-center px-4 py-3"
        style={{ background: GREEN }}
      >
        <Link href="/account">
          <button
            className="w-9 h-9 flex items-center justify-center active:opacity-70"
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </Link>
        <h1 className="flex-1 text-center text-white font-semibold text-base mr-9">
          {servicePageTitle}
        </h1>
      </div>

      {/* ══ HERO — logo + personnages ══ */}
      <div
        className="ielp-service-hero"
        style={{
          background: "linear-gradient(160deg, #078438 0%, #034c25 100%)",
          paddingBottom: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Logo officiel TGOOD */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            padding: "10px 28px",
            marginTop: 16,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          <img src="/tgood-logo.gif" alt="TGOOD" style={{ height: 48, objectFit: "contain" }} />
        </div>

        <p className="text-white text-sm font-medium tracking-wide">ENERGY, FAST!</p>
      </div>

      {/* ══ CARTE HORAIRES ══ */}
      <div className="px-3 mt-3">
        <div
          className="ielp-service-hours rounded-2xl text-center py-5 px-4"
          style={{ background: GREEN }}
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
            color: "#333",
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
              onClick={() => window.open(link.href, "_blank", "noopener,noreferrer")}
              className="w-full flex items-center justify-between active:opacity-80 transition-opacity"
              style={{
                background: GREEN,
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
                @{link.label}
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
            color: "#111",
            marginBottom: 10,
            letterSpacing: 0.5,
          }}
        >
          CONSEILS :
        </p>
        <div className="ielp-service-guidance-copy" style={{ color: "#444", fontSize: 13, lineHeight: 1.8 }}>
           <p>
             1. Pour toute question concernant la plateforme, utilisez uniquement
             les liens TGOOD publiés dans cette page.
           </p>
           <p style={{ marginTop: 6 }}>
             2. Ne partagez jamais votre mot de passe, vos codes de validation ou
             vos informations de portefeuille.
           </p>
           <p style={{ marginTop: 6 }}>
             3. Le support officiel TGOOD ne vous demandera jamais vos codes confidentiels.
           </p>
           <p style={{ marginTop: 6 }}>
             4. Méfiez-vous des comptes qui prétendent représenter TGOOD sans lien publié ici.
           </p>
        </div>
      </div>

    </div>
  );
}
