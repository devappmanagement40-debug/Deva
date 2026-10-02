import { useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  CircleDot,
  Gift,
  MessageSquare,
  Send,
  Sparkles,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";
import { DiamantBrand } from "@/components/diamant-brand";
import { FloatingSupport } from "@/components/floating-support";
import HomeAnnouncementModal from "@/components/home-announcement-modal";
import BannerCarousel from "@/components/banner-carousel";
import productsHero from "@assets/generated_images/diamant-home-products-hero.jpg";
import chargingHero from "@assets/generated_images/diamant-charging-station-hero.jpg";
import scooterHero from "@assets/generated_images/diamant-scooter.jpg";

type IncomeSummary = {
  productEarnings?: number | string;
  teamEarnings?: number | string;
};

type HomeCopy = {
  chat: string;
  depositBalance: string;
  withdrawalBalance: string;
  productRevenue: string;
  recharge: string;
  withdraw: string;
  team: string;
  telegram: string;
  inviteTitle: string;
  inviteDescription: string;
  wheelTitle: string;
  wheelDescription: string;
  checkinTitle: string;
  checkinDescription: string;
  go: string;
  retry: string;
  retryLabel: string;
};

const COPY: Record<Lang, HomeCopy> = {
  fr: {
    chat: "Service client",
    depositBalance: "Solde de Recharge",
    withdrawalBalance: "Solde de Retrait",
    productRevenue: "Revenu des Produits",
    recharge: "Recharger",
    withdraw: "Retirer",
    team: "Équipe",
    telegram: "Telegram",
    inviteTitle: "Inviter des Amis",
    inviteDescription: "Invitez des amis pour gagner des commissions",
    wheelTitle: "Roue de la Chance",
    wheelDescription: "Divers Cadeaux, 100% de Gain",
    checkinTitle: "Se Connecter",
    checkinDescription: "Récompenses quotidiennes de connexion",
    go: "Aller",
    retry: "Réessayer",
    retryLabel: "Réessayer le chargement des revenus produits",
  },
  en: {
    chat: "Customer service",
    depositBalance: "Deposit balance",
    withdrawalBalance: "Withdrawal balance",
    productRevenue: "Product revenue",
    recharge: "Deposit",
    withdraw: "Withdraw",
    team: "Team",
    telegram: "Telegram",
    inviteTitle: "Invite Friends",
    inviteDescription: "Invite friends and earn commissions",
    wheelTitle: "Lucky Wheel",
    wheelDescription: "Many gifts, 100% chance to win",
    checkinTitle: "Daily Check-in",
    checkinDescription: "Daily login rewards",
    go: "Go",
    retry: "Retry",
    retryLabel: "Retry loading product revenue",
  },
  ar: {
    chat: "خدمة العملاء",
    depositBalance: "رصيد الإيداع",
    withdrawalBalance: "رصيد السحب",
    productRevenue: "أرباح المنتجات",
    recharge: "إيداع",
    withdraw: "سحب",
    team: "الفريق",
    telegram: "تيليجرام",
    inviteTitle: "ادعُ الأصدقاء",
    inviteDescription: "ادعُ أصدقاءك واربح العمولات",
    wheelTitle: "عجلة الحظ",
    wheelDescription: "هدايا متنوعة وفرصة ربح 100٪",
    checkinTitle: "تسجيل الحضور",
    checkinDescription: "مكافآت تسجيل الدخول اليومية",
    go: "اذهب",
    retry: "إعادة المحاولة",
    retryLabel: "إعادة تحميل أرباح المنتجات",
  },
  zh: {
    chat: "客户服务",
    depositBalance: "充值余额",
    withdrawalBalance: "提现余额",
    productRevenue: "产品收益",
    recharge: "充值",
    withdraw: "提现",
    team: "团队",
    telegram: "Telegram",
    inviteTitle: "邀请好友",
    inviteDescription: "邀请好友，赚取佣金",
    wheelTitle: "幸运转盘",
    wheelDescription: "多种礼品，赢取机会百分百",
    checkinTitle: "每日签到",
    checkinDescription: "每日登录奖励",
    go: "前往",
    retry: "重试",
    retryLabel: "重新加载产品收益",
  },
};

const FALLBACK_BANNERS = [productsHero, chargingHero, scooterHero];
const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const QUICK_ACTIONS: {
  id: "recharge" | "withdraw" | "team" | "telegram";
  Icon: LucideIcon;
  href: string;
}[] = [
  { id: "recharge", Icon: WalletCards, href: "/deposit" },
  { id: "withdraw", Icon: ArrowDownToLine, href: "/withdrawal" },
  { id: "team", Icon: UsersRound, href: "/team" },
  { id: "telegram", Icon: Send, href: "/service" },
];

function formatMoney(value: unknown) {
  const amount = Number(value);
  return AMOUNT_FORMAT.format(Number.isFinite(amount) ? amount : 0);
}

function parseBanners(value?: string) {
  if (!value) return FALLBACK_BANNERS;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const images = parsed.filter((image): image is string => typeof image === "string" && image.trim().length > 0);
      if (images.length) return images;
    }
  } catch {
    return FALLBACK_BANNERS;
  }
  return FALLBACK_BANNERS;
}

function isTelegramUrl(value: string) {
  try {
    const url = new URL(value);
    return ["t.me", "www.t.me", "telegram.me", "www.telegram.me", "telegram.org"].includes(url.hostname.toLowerCase())
      && (url.protocol === "https:" || url.protocol === "http:");
  } catch {
    return false;
  }
}

function getTelegramDestination(settings: Record<string, string>) {
  const enabled = settings.telegramEnabled ?? settings.enableTelegram ?? settings.telegram_enabled;
  if (enabled && /^(false|0|off|disabled|no)$/i.test(enabled.trim())) return undefined;

  const telegramSupportLinks = [
    settings.telegramLink,
    settings.telegramUrl,
    settings.telegramGroupUrl,
    settings.telegramChannelUrl,
    settings.telegramSupportLink,
    settings.telegramGroup,
    settings.telegramChannel,
  ];
  const supportLinks = [
    { url: settings.supportLink, type: settings.supportType },
    { url: settings.support2Link, type: settings.support2Type },
  ]
    .filter(({ url, type }) => url && (type || "").toLowerCase().includes("telegram"))
    .map(({ url }) => url);

  return [...telegramSupportLinks, ...supportLinks, settings.supportLink, settings.support2Link]
    .find((url): url is string => Boolean(url && isTelegramUrl(url.trim())))?.trim();
}

function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { lang } = useI18n();
  const copy = COPY[lang];

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const {
    data: incomeSummary,
    isLoading: isIncomeLoading,
    isError: isIncomeError,
    refetch: refetchIncome,
  } = useQuery<IncomeSummary>({
    queryKey: ["/api/user/income-summary"],
  });

  const bannerImages = useMemo(() => parseBanners(settings.banner1Images), [settings.banner1Images]);
  const telegramUrl = getTelegramDestination(settings);

  if (!user) return null;

  function handleQuickAction(id: (typeof QUICK_ACTIONS)[number]["id"], href: string) {
    if (id !== "telegram") {
      navigate(href);
      return;
    }
    if (!telegramUrl) {
      navigate("/service");
      return;
    }
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  }

  const balances = [
    { id: "deposit", label: copy.depositBalance, value: user.balance },
    { id: "withdrawal", label: copy.withdrawalBalance, value: user.totalEarnings },
  ];

  const promotions = [
    {
      id: "invite",
      title: copy.inviteTitle,
      description: copy.inviteDescription,
      href: "/team",
      ArtIcon: UsersRound,
      AccentIcon: Sparkles,
    },
    {
      id: "wheel",
      title: copy.wheelTitle,
      description: copy.wheelDescription,
      href: "/spin-wheel",
      ArtIcon: Gift,
      AccentIcon: CircleDot,
    },
    {
      id: "checkin",
      title: copy.checkinTitle,
      description: copy.checkinDescription,
      href: "/checkin",
      ArtIcon: CalendarDays,
      AccentIcon: CircleDollarSign,
    },
  ];

  return (
    <main className="ielp-home-page" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="ielp-home-shell">
        <header className="ielp-home-header">
          <a className="ielp-home-brand" href="#/" aria-label="DIAMANT accueil" onClick={(event) => { event.preventDefault(); navigate("/"); }}>
            <DiamantBrand variant="on-dark" markSize={36} className="diamant-home-brand" />
          </a>
          <div className="ielp-home-header__actions">
            <LanguagePicker variant="home" />
            <button
              className="ielp-home-chat-top"
              type="button"
              onClick={() => navigate("/service")}
              aria-label={copy.chat}
              data-testid="button-home-chat"
            >
              <MessageSquare size={21} fill="white" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="ielp-home-content ielp-home-refresh">
          <section className="ielp-home-refresh__carousel" aria-label={copy.productRevenue}>
            <BannerCarousel images={bannerImages} height={238} autoPlayMs={4200} rounded />
          </section>

          <section className="ielp-home-refresh__account" aria-label={copy.depositBalance}>
            <div className="ielp-home-refresh__balances">
              {balances.map(({ id, label, value }) => (
                <div className="ielp-home-refresh__balance" key={id}>
                  <span className="ielp-home-refresh__balance-label">{label}</span>
                  <strong><small>FCFA</small> {formatMoney(value)}</strong>
                </div>
              ))}
              <div className="ielp-home-refresh__balance">
                <span className="ielp-home-refresh__balance-label">{copy.productRevenue}</span>
                {isIncomeLoading ? (
                  <span className="ielp-home-refresh__amount-skeleton" aria-label="Loading balance" />
                ) : isIncomeError ? (
                  <button
                    className="ielp-home-refresh__retry"
                    type="button"
                    onClick={() => void refetchIncome()}
                    aria-label={copy.retryLabel}
                  >
                    {copy.retry}
                  </button>
                ) : (
                  <strong><small>FCFA</small> {formatMoney(incomeSummary?.productEarnings)}</strong>
                )}
              </div>
            </div>
            <div className="ielp-home-refresh__actions">
              {QUICK_ACTIONS.map(({ id, Icon, href }) => (
                <button
                  className="ielp-home-refresh__action"
                  type="button"
                  key={id}
                  onClick={() => handleQuickAction(id, href)}
                  data-testid={`home-action-${id}`}
                >
                  <span className="ielp-home-refresh__action-icon"><Icon size={25} strokeWidth={2} aria-hidden="true" /></span>
                  <span>{copy[id]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="ielp-home-refresh__promotions" aria-label={copy.inviteTitle}>
            {promotions.map(({ id, title, description, href, ArtIcon, AccentIcon }) => (
              <button
                className={`ielp-home-refresh__promo ielp-home-refresh__promo--${id}`}
                type="button"
                key={id}
                onClick={() => navigate(href)}
                data-testid={`home-promo-${id}`}
              >
                <span className="ielp-home-refresh__promo-copy">
                  <strong>{title}</strong>
                  <span>{description}</span>
                  <span className="ielp-home-refresh__promo-cta">
                    {copy.go}<ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </span>
                <span className="ielp-home-refresh__promo-art" aria-hidden="true">
                  <span className="ielp-home-refresh__promo-art-orbit" />
                  <ArtIcon className="ielp-home-refresh__promo-art-main" size={39} strokeWidth={1.8} />
                  <AccentIcon className="ielp-home-refresh__promo-art-accent" size={20} strokeWidth={2} />
                </span>
              </button>
            ))}
          </section>
        </div>
      </div>

      <FloatingSupport placement="home" />
      <HomeAnnouncementModal />
    </main>
  );
}

export default HomePage;