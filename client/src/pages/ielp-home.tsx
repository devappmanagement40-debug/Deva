import { useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  MessageSquare,
  Send,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";
import { DiamantBrand } from "@/components/diamant-brand";
import { FloatingSupport } from "@/components/floating-support";
import { FloatingCheckin } from "@/components/floating-checkin";
import { FloatingWheel } from "@/components/floating-wheel";
import HomeAnnouncementModal from "@/components/home-announcement-modal";
import BannerCarousel from "@/components/banner-carousel";
import type { Product } from "@shared/schema";
import { getProductVisual } from "@/lib/product-visuals";
import { rebrandText } from "@/lib/content";
import productsHero from "@assets/generated_images/diamant-home-products-hero.jpg";
import chargingHero from "@assets/generated_images/diamant-charging-station-hero.jpg";
import scooterHero from "@assets/generated_images/diamant-scooter.jpg";

type IncomeSummary = {
  productEarnings?: number | string;
  teamEarnings?: number | string;
};

type HomeStats = {
  totalUsers: number;
  totalProduction: number;
};

type TeamStats = {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: number;
};

type HomeCopy = {
  chat: string;
  bannerLabel: string;
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
  checkinTitle: string;
  go: string;
  loading: string;
  retry: string;
  retryLabel: string;
  popularProducts: string;
  seeAllProducts: string;
  previousProduct: string;
  nextProduct: string;
  productsEmpty: string;
  productsError: string;
  statsTitle: string;
  totalMembers: string;
  totalProduction: string;
  myTeamMembers: string;
  teamCommissions: string;
  productPrice: string;
  dailyIncome: string;
};

const COPY: Record<Lang, HomeCopy> = {
  fr: {
    chat: "Service client",
    bannerLabel: "Bannière d’accueil",
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
    checkinTitle: "Pointage",
    go: "Aller",
    loading: "Chargement",
    retry: "Réessayer",
    retryLabel: "Réessayer le chargement des revenus produits",
    popularProducts: "Produits populaires",
    seeAllProducts: "Voir tout",
    previousProduct: "Produit précédent",
    nextProduct: "Produit suivant",
    productsEmpty: "Aucun produit sélectionné pour le carrousel.",
    productsError: "Impossible de charger les produits.",
    statsTitle: "DIAMANT en chiffres",
    totalMembers: "Membres inscrits",
    totalProduction: "Production totale",
    myTeamMembers: "Membres de mon équipe",
    teamCommissions: "Commissions d’équipe",
    productPrice: "Prix",
    dailyIncome: "Revenu quotidien",
  },
  en: {
    chat: "Customer service",
    bannerLabel: "Home banner",
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
    checkinTitle: "Daily Check-in",
    go: "Go",
    loading: "Loading",
    retry: "Retry",
    retryLabel: "Retry loading product revenue",
    popularProducts: "Popular products",
    seeAllProducts: "View all",
    previousProduct: "Previous product",
    nextProduct: "Next product",
    productsEmpty: "No products have been selected for the carousel.",
    productsError: "Could not load the products.",
    statsTitle: "DIAMANT in numbers",
    totalMembers: "Registered members",
    totalProduction: "Total production",
    myTeamMembers: "My team members",
    teamCommissions: "Team commissions",
    productPrice: "Price",
    dailyIncome: "Daily income",
  },
  ar: {
    chat: "خدمة العملاء",
    bannerLabel: "لافتة الصفحة الرئيسية",
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
    checkinTitle: "تسجيل الحضور",
    go: "اذهب",
    loading: "جارٍ التحميل",
    retry: "إعادة المحاولة",
    retryLabel: "إعادة تحميل أرباح المنتجات",
    popularProducts: "المنتجات الشائعة",
    seeAllProducts: "عرض الكل",
    previousProduct: "المنتج السابق",
    nextProduct: "المنتج التالي",
    productsEmpty: "لم يتم اختيار منتجات لشريط العرض بعد.",
    productsError: "تعذر تحميل المنتجات.",
    statsTitle: "DIAMANT بالأرقام",
    totalMembers: "الأعضاء المسجلون",
    totalProduction: "إجمالي الإنتاج",
    myTeamMembers: "أعضاء فريقي",
    teamCommissions: "عمولات الفريق",
    productPrice: "السعر",
    dailyIncome: "الدخل اليومي",
  },
  zh: {
    chat: "客户服务",
    bannerLabel: "首页横幅",
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
    checkinTitle: "每日签到",
    go: "前往",
    loading: "加载中",
    retry: "重试",
    retryLabel: "重新加载产品收益",
    popularProducts: "热门产品",
    seeAllProducts: "查看全部",
    previousProduct: "上一个产品",
    nextProduct: "下一个产品",
    productsEmpty: "尚未选择轮播产品。",
    productsError: "无法加载产品。",
    statsTitle: "DIAMANT 数据",
    totalMembers: "注册会员",
    totalProduction: "总产值",
    myTeamMembers: "我的团队成员",
    teamCommissions: "团队佣金",
    productPrice: "价格",
    dailyIncome: "每日收入",
  },
};

const FALLBACK_BANNERS = [productsHero, chargingHero, scooterHero];
const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const COUNT_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

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

function formatCount(value: unknown) {
  const count = Number(value);
  return COUNT_FORMAT.format(Number.isFinite(count) ? count : 0);
}

function parseProductIds(value?: string) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const productIds = parsed
      .map((id) => Number(id))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
    return productIds.filter((id, index) => productIds.indexOf(id) === index);
  } catch {
    return [];
  }
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

  const configuredLinks = [
    { url: settings.groupLink, enabled: settings.groupEnabled },
    { url: settings.channelLink, enabled: settings.channelEnabled },
    { url: settings.supportLink, enabled: settings.supportEnabled },
    { url: settings.support2Link, enabled: settings.support2Enabled },
  ]
    .filter(({ url, enabled: linkEnabled }) =>
      Boolean(url) && !(linkEnabled && /^(false|0|off|disabled|no)$/i.test(linkEnabled.trim()))
    )
    .map(({ url }) => url);
  const telegramSupportLinks = [
    settings.telegramLink,
    settings.telegramUrl,
    settings.telegramGroupUrl,
    settings.telegramChannelUrl,
    settings.telegramSupportLink,
    settings.telegramGroup,
    settings.telegramChannel,
  ];

  return [...telegramSupportLinks, ...configuredLinks]
    .find((url): url is string => Boolean(url && isTelegramUrl(url.trim())))?.trim();
}

function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { lang } = useI18n();
  const copy = COPY[lang];
  const popularProductsRef = useRef<HTMLDivElement>(null);

  const { data: settings = {}, isLoading: isSettingsLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const {
    data: catalogProducts = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 60_000,
  });
  const {
    data: homeStats,
    isLoading: isHomeStatsLoading,
    isError: isHomeStatsError,
    refetch: refetchHomeStats,
  } = useQuery<HomeStats>({
    queryKey: ["/api/home/stats"],
    staleTime: 60_000,
  });
  const {
    data: teamStats,
    isLoading: isTeamStatsLoading,
    isError: isTeamStatsError,
    refetch: refetchTeamStats,
  } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
    staleTime: 60_000,
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
  const selectedPopularIds = useMemo(
    () => parseProductIds(settings.specialProductIds),
    [settings.specialProductIds],
  );
  const popularProducts = useMemo(() => {
    const productsById = new Map(catalogProducts.map((product) => [product.id, product]));
    return selectedPopularIds
      .map((id) => productsById.get(id))
      .filter((product): product is Product => Boolean(product && !product.isFree));
  }, [catalogProducts, selectedPopularIds]);
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

  function scrollPopularProducts(direction: -1 | 1) {
    const track = popularProductsRef.current;
    if (!track) return;
    const rtlFactor = lang === "ar" ? -1 : 1;
    track.scrollBy({
      left: direction * rtlFactor * Math.max(220, track.clientWidth * 0.78),
      behavior: "smooth",
    });
  }

  function retryHomeStats() {
    if (isHomeStatsError) void refetchHomeStats();
    if (isTeamStatsError) void refetchTeamStats();
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
  ];

  const teamMemberCount = teamStats
    ? Number(teamStats.level1Count || 0) + Number(teamStats.level2Count || 0) + Number(teamStats.level3Count || 0)
    : undefined;
  const infoCards: {
    id: string;
    label: string;
    value?: string;
    loading: boolean;
    Icon: LucideIcon;
  }[] = [
    {
      id: "members",
      label: copy.totalMembers,
      value: homeStats ? formatCount(homeStats.totalUsers) : undefined,
      loading: isHomeStatsLoading,
      Icon: UsersRound,
    },
    {
      id: "production",
      label: copy.totalProduction,
      value: homeStats ? `XOF ${formatMoney(homeStats.totalProduction)}` : undefined,
      loading: isHomeStatsLoading,
      Icon: CircleDollarSign,
    },
    {
      id: "team-members",
      label: copy.myTeamMembers,
      value: teamMemberCount === undefined ? undefined : formatCount(teamMemberCount),
      loading: isTeamStatsLoading,
      Icon: UserRound,
    },
    {
      id: "team-commissions",
      label: copy.teamCommissions,
      value: teamStats ? `XOF ${formatMoney(teamStats.totalCommission)}` : undefined,
      loading: isTeamStatsLoading,
      Icon: WalletCards,
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
          <section className="ielp-home-refresh__carousel" aria-label={copy.bannerLabel}>
            <BannerCarousel images={bannerImages} height={238} autoPlayMs={4200} rounded />
          </section>

          <section className="ielp-home-refresh__account" aria-label={copy.depositBalance}>
            <div className="ielp-home-refresh__balances">
              {balances.map(({ id, label, value }) => (
                <div className="ielp-home-refresh__balance" key={id}>
                  <span className="ielp-home-refresh__balance-label">{label}</span>
                  <strong><small>XOF</small> {formatMoney(value)}</strong>
                </div>
              ))}
              <div className="ielp-home-refresh__balance">
                <span className="ielp-home-refresh__balance-label">{copy.productRevenue}</span>
                {isIncomeLoading ? (
                  <span className="ielp-home-refresh__amount-skeleton" role="status" aria-label={copy.loading} />
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
                  <strong><small>XOF</small> {formatMoney(incomeSummary?.productEarnings)}</strong>
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

          <section className="ielp-home-popular" aria-labelledby="ielp-home-popular-title">
            <div className="ielp-home-section-heading">
              <h2 id="ielp-home-popular-title">{copy.popularProducts}</h2>
              <div className="ielp-home-popular__controls">
                <button
                  type="button"
                  aria-label={copy.previousProduct}
                  title={copy.previousProduct}
                  onClick={() => scrollPopularProducts(-1)}
                  disabled={popularProducts.length < 2}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={copy.nextProduct}
                  title={copy.nextProduct}
                  onClick={() => scrollPopularProducts(1)}
                  disabled={popularProducts.length < 2}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                <button
                  className="ielp-home-popular__all"
                  type="button"
                  onClick={() => navigate("/products")}
                >
                  {copy.seeAllProducts}<ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            {isSettingsLoading || isProductsLoading ? (
              <p className="ielp-home-popular__message" role="status">{copy.loading}</p>
            ) : isProductsError ? (
              <div className="ielp-home-popular__message">
                <span>{copy.productsError}</span>
                <button type="button" onClick={() => void refetchProducts()}>{copy.retry}</button>
              </div>
            ) : popularProducts.length === 0 ? (
              <p className="ielp-home-popular__message">{copy.productsEmpty}</p>
            ) : (
              <div
                className="ielp-home-popular__track"
                ref={popularProductsRef}
                dir={lang === "ar" ? "rtl" : "ltr"}
                role="region"
                aria-label={copy.popularProducts}
                tabIndex={0}
              >
                {popularProducts.map((product, index) => {
                  const name = rebrandText(product.name);
                  return (
                    <button
                      className="ielp-home-product-card"
                      type="button"
                      key={product.id}
                      onClick={() => navigate("/products")}
                      aria-label={`${name} — ${copy.seeAllProducts}`}
                      data-testid={`home-popular-product-${product.id}`}
                    >
                      <img
                        className="ielp-home-product-card__image"
                        src={getProductVisual(product.imageUrl, index)}
                        alt=""
                        loading="lazy"
                        draggable={false}
                      />
                      <span className="ielp-home-product-card__name">{name}</span>
                      <span className="ielp-home-product-card__details">
                        <span>
                          <small>{copy.productPrice}</small>
                          <strong><small>XOF</small> {formatMoney(product.price)}</strong>
                        </span>
                        <span>
                          <small>{copy.dailyIncome}</small>
                          <strong><small>XOF</small> {formatMoney(product.dailyEarnings)}</strong>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="ielp-home-info" aria-labelledby="ielp-home-info-title">
            <h2 id="ielp-home-info-title">{copy.statsTitle}</h2>
            <div className="ielp-home-info__grid">
              {infoCards.map(({ id, label, value, loading, Icon }) => (
                <article className="ielp-home-info-card" key={id}>
                  <span className="ielp-home-info-card__icon"><Icon size={20} aria-hidden="true" /></span>
                  <strong className="ielp-home-info-card__value">
                    {loading ? (
                      <span className="ielp-home-info-card__skeleton" role="status" aria-label={copy.loading} />
                    ) : value ?? "—"}
                  </strong>
                  <span className="ielp-home-info-card__label">{label}</span>
                </article>
              ))}
            </div>
            {(isHomeStatsError || isTeamStatsError) && (
              <button className="ielp-home-info__retry" type="button" onClick={retryHomeStats}>
                {copy.retry}
              </button>
            )}
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
      <FloatingWheel bottomOffset={76} />
      <FloatingCheckin label={copy.checkinTitle} bottomOffset={24} />
      <HomeAnnouncementModal />
    </main>
  );
}

export default HomePage;