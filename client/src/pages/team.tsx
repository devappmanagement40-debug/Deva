import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CalendarDays, MessageCircleMore, MessageSquare, Send, UsersRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { LanguagePicker } from "@/components/language-picker";
import { FloatingSupport } from "@/components/floating-support";
import "./team.css";

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1ValidCount: number;
  level2ValidCount: number;
  level3ValidCount: number;
  totalCommission: number;
  teamTotalDeposits: number;
  teamTotalWithdrawals: number;
}

const COPY: Record<Lang, {
  commissionDetails: string;
  invitationCode: string;
  sharePrompt: string;
  copy: string;
  copiedCode: string;
  copiedLink: string;
  copyFailed: string;
  share: string;
  chooseDate: string;
  clearDate: string;
  teamSize: string;
  commissions: string;
  deposits: string;
  withdrawals: string;
  count: string;
  valid: string;
  details: string;
  statsUnavailable: string;
}> = {
  fr: {
    commissionDetails: "Détails de la commission »»»",
    invitationCode: "Code d'invitation :",
    sharePrompt: "Partagez votre lien et gagnez",
    copy: "Copie",
    copiedCode: "Code copié",
    copiedLink: "Lien copié",
    copyFailed: "La copie a échoué.",
    share: "Partager",
    chooseDate: "Choisissez une date",
    clearDate: "Effacer la date",
    teamSize: "Taille de l'équipe",
    commissions: "Commissions de référence",
    deposits: "Dépôts d'équipe",
    withdrawals: "Retraits d'équipes",
    count: "Compter",
    valid: "Valide",
    details: "Détails",
    statsUnavailable: "Impossible de charger les statistiques de l'équipe.",
  },
  en: {
    commissionDetails: "Commission details »»»",
    invitationCode: "Invitation code:",
    sharePrompt: "Share your link and earn",
    copy: "Copy",
    copiedCode: "Code copied",
    copiedLink: "Link copied",
    copyFailed: "Copy failed.",
    share: "Share",
    chooseDate: "Choose a date",
    clearDate: "Clear date",
    teamSize: "Team size",
    commissions: "Referral commissions",
    deposits: "Team deposits",
    withdrawals: "Team withdrawals",
    count: "Count",
    valid: "Valid",
    details: "Details",
    statsUnavailable: "Could not load team statistics.",
  },
  ar: {
    commissionDetails: "تفاصيل العمولة »»»",
    invitationCode: "رمز الدعوة:",
    sharePrompt: "شارك رابطك واكسب",
    copy: "نسخ",
    copiedCode: "تم نسخ الرمز",
    copiedLink: "تم نسخ الرابط",
    copyFailed: "تعذر النسخ.",
    share: "مشاركة",
    chooseDate: "اختر تاريخًا",
    clearDate: "مسح التاريخ",
    teamSize: "حجم الفريق",
    commissions: "عمولات الإحالة",
    deposits: "إيداعات الفريق",
    withdrawals: "سحوبات الفريق",
    count: "العدد",
    valid: "صالح",
    details: "التفاصيل",
    statsUnavailable: "تعذر تحميل إحصاءات الفريق.",
  },
  zh: {
    commissionDetails: "佣金详情 »»»",
    invitationCode: "邀请码：",
    sharePrompt: "分享链接并赚取奖励",
    copy: "复制",
    copiedCode: "代码已复制",
    copiedLink: "链接已复制",
    copyFailed: "复制失败。",
    share: "分享",
    chooseDate: "选择日期",
    clearDate: "清除日期",
    teamSize: "团队规模",
    commissions: "推荐佣金",
    deposits: "团队充值",
    withdrawals: "团队提现",
    count: "人数",
    valid: "有效",
    details: "详情",
    statsUnavailable: "无法加载团队统计。",
  },
};

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const SOCIALS = [
  { id: "x", label: "X", mark: "𝕏" },
  { id: "facebook", label: "Facebook", mark: "f" },
  { id: "telegram", label: "Telegram", mark: "" },
  { id: "linkedin", label: "LinkedIn", mark: "in" },
  { id: "whatsapp", label: "WhatsApp", mark: "☎" },
  { id: "instagram", label: "Instagram", mark: "◎" },
  { id: "tiktok", label: "TikTok", mark: "♪" },
  { id: "native", label: "Share", mark: "" },
] as const;

function IelpSeal() {
  return (
    <svg className="ielp-home-seal" viewBox="0 0 90 90" role="img" aria-label="Icahn Enterprises L.P.">
      <circle cx="45" cy="45" r="45" fill="#3775a8" />
      <text x="57" y="36" textAnchor="middle">ICAHN</text>
      <text x="45" y="49" textAnchor="middle">ENTERPRISES</text>
      <text x="60" y="62" textAnchor="middle">L.P.</text>
    </svg>
  );
}

function TeamChatIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path d="M8 8.5h18a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-9l-5.4 4v-4H8a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="12.2" cy="16.5" r="1.5" fill="currentColor" />
      <circle cx="17" cy="16.5" r="1.5" fill="currentColor" />
      <circle cx="21.8" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function formatMoney(value: unknown) {
  const amount = Number(value);
  return `USDT ${numberFormat.format(Number.isFinite(amount) ? amount : 0)}`;
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lang, t } = useI18n();
  const [, navigate] = useLocation();
  const copy = COPY[lang];
  const [selectedDate, setSelectedDate] = useState("");
  const statsUrl = selectedDate
    ? `/api/team/stats?date=${encodeURIComponent(selectedDate)}`
    : "/api/team/stats";
  const { data: stats, isError } = useQuery<TeamStats>({
    queryKey: [statsUrl],
    staleTime: 60_000,
  });

  if (!user) return null;

  const referralCode = user.referralCode || "";
  const referralLink = `${window.location.origin}/#/register?invite_code=${encodeURIComponent(referralCode)}`;
  const levelCounts = [stats?.level1Count || 0, stats?.level2Count || 0, stats?.level3Count || 0];
  const levelValidCounts = [
    stats?.level1ValidCount || 0,
    stats?.level2ValidCount || 0,
    stats?.level3ValidCount || 0,
  ];
  const levelCards = levelCounts.map((count, index) => ({
    level: index + 1,
    count,
    valid: levelValidCounts[index],
  }));
  const totalUsers = levelCounts.reduce((total, count) => total + count, 0);
  const displayedDate = selectedDate
    ? new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" })
      .format(new Date(`${selectedDate}T12:00:00`))
    : copy.chooseDate;

  async function copyValue(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: message });
    } catch {
      toast({ title: copy.copyFailed, variant: "destructive" });
    }
  }

  async function shareTo(target: string) {
    const encodedUrl = encodeURIComponent(referralLink);
    const encodedMessage = encodeURIComponent(copy.sharePrompt);
    const destinations: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
    };
    const destination = destinations[target];
    if (destination) {
      window.open(destination, "_blank", "noopener,noreferrer");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: "IELP", text: copy.sharePrompt, url: referralLink });
      } catch {
        // The user can dismiss the native share sheet without an error.
      }
      return;
    }
    await copyValue(referralLink, copy.copiedLink);
  }

  return (
    <main className="ielp-home-page ielp-team-page" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="ielp-home-shell ielp-team-shell">
        <header className="ielp-home-header">
          <a
            className="ielp-home-brand"
            href="#/"
            aria-label="IELP accueil"
            onClick={(event) => {
              event.preventDefault();
              navigate("/");
            }}
          >
            <IelpSeal />
            <span>IELP</span>
          </a>
          <div className="ielp-home-header__actions">
            <LanguagePicker variant="home" />
            <button
              className="ielp-home-chat-top"
              type="button"
              onClick={() => navigate("/service")}
              aria-label={t.customerService}
              data-testid="button-team-chat"
            >
              <MessageSquare size={21} fill="white" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="ielp-team-content">
          <button
            className="ielp-team-commission-link"
            type="button"
            onClick={() => navigate("/team-details")}
            data-testid="button-team-commission-details"
          >
            {copy.commissionDetails}
          </button>

          <section className="ielp-team-invitation" aria-label={copy.invitationCode}>
            <p className="ielp-team-label">{copy.invitationCode}</p>
            <div className="ielp-team-code-row">
              <div className="ielp-team-code" data-testid="text-referral-code">{referralCode}</div>
              <button
                type="button"
                className="ielp-team-copy-button"
                onClick={() => void copyValue(referralCode, copy.copiedCode)}
                data-testid="button-copy-code"
              >
                {copy.copy}
              </button>
            </div>

            <div className="ielp-team-link-heading">
              <span>{copy.sharePrompt}</span>
              <button
                type="button"
                className="ielp-team-copy-button"
                onClick={() => void copyValue(referralLink, copy.copiedLink)}
                data-testid="button-copy-link"
              >
                {copy.copy}
              </button>
            </div>
            <button
              type="button"
              className="ielp-team-link-value"
              onClick={() => void copyValue(referralLink, copy.copiedLink)}
              aria-label={`${copy.copy}: ${referralLink}`}
              data-testid="text-referral-link"
            >
              {referralLink}
            </button>
          </section>

          <section className="ielp-team-share" aria-label={copy.share}>
            <h2>{copy.share}</h2>
            <div className="ielp-home-socials ielp-team-socials">
              {SOCIALS.map((social) => (
                <button
                  type="button"
                  key={social.id}
                  aria-label={social.label}
                  onClick={() => void shareTo(social.id)}
                >
                  {social.id === "telegram" ? (
                    <Send size={18} strokeWidth={2.3} aria-hidden="true" />
                  ) : social.id === "native" ? (
                    <UsersRound size={19} strokeWidth={1.8} aria-hidden="true" />
                  ) : (
                    <span className={`ielp-social-${social.id}`}>{social.mark}</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <div className="ielp-team-date-row">
            <label className="ielp-team-date-selector">
              <CalendarDays size={21} strokeWidth={2.2} aria-hidden="true" />
              <span>{displayedDate}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                aria-label={copy.chooseDate}
                data-testid="input-team-date"
              />
            </label>
            {selectedDate && (
              <button
                type="button"
                className="ielp-team-date-clear"
                aria-label={copy.clearDate}
                onClick={() => setSelectedDate("")}
              >
                ×
              </button>
            )}
          </div>

          {isError && <p className="ielp-team-error" role="alert">{copy.statsUnavailable}</p>}

          <section className="ielp-team-stats-grid" aria-label={copy.teamSize}>
            <button
              type="button"
              className="ielp-team-stat-card"
              onClick={() => navigate("/members")}
              data-testid="button-total-users"
            >
              <span>{copy.teamSize}</span>
              <strong>{totalUsers.toLocaleString(lang)}</strong>
            </button>
            <button
              type="button"
              className="ielp-team-stat-card"
              onClick={() => navigate("/team-details")}
              data-testid="button-total-rewards"
            >
              <span>{copy.commissions}</span>
              <strong>{formatMoney(stats?.totalCommission)}</strong>
            </button>
            <article className="ielp-team-stat-card">
              <span>{copy.deposits}</span>
              <strong>{formatMoney(stats?.teamTotalDeposits)}</strong>
            </article>
            <article className="ielp-team-stat-card">
              <span>{copy.withdrawals}</span>
              <strong>{formatMoney(stats?.teamTotalWithdrawals)}</strong>
            </article>
          </section>

          <section className="ielp-team-levels" aria-label={copy.teamSize}>
            {levelCards.map(({ level, count, valid }) => (
              <article className="ielp-team-level-card" key={level}>
                <h2>LEV {level}</h2>
                <div className="ielp-team-level-metric">
                  <span>{copy.count}</span>
                  <strong>{count.toLocaleString(lang)}</strong>
                </div>
                <div className="ielp-team-level-metric ielp-team-level-metric--valid">
                  <span>{copy.valid}</span>
                  <strong>{valid.toLocaleString(lang)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/team-details")}
                  data-testid={`button-team-level-${level}`}
                >
                  {copy.details} <span aria-hidden="true">›</span>
                </button>
              </article>
            ))}
          </section>
        </div>
      </div>

      <button
        className="ielp-home-chat-float"
        type="button"
        aria-label={t.customerService}
        onClick={() => navigate("/service")}
        data-testid="button-team-chat-floating"
      >
        <TeamChatIcon />
      </button>
      <FloatingSupport placement="home" />
    </main>
  );
}