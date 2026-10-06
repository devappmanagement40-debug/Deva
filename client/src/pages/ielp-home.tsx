import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Image as ImageIcon,
  MessageSquare,
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
import { getProductImageUrl } from "@/lib/product-visuals";
import { rebrandText } from "@/lib/content";
import { resolveInfoArticles } from "@/data/diamant-info-articles";
import { HOME_BANNER_DEFAULT_IMAGES } from "@/lib/banner-defaults";
import { parseBannerImages } from "@/lib/banner-images";

type IncomeSummary = {
  productEarnings?: number | string;
  teamEarnings?: number | string;
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
  proofs: string;
  checkinTitle: string;
  loading: string;
  retry: string;
  retryLabel: string;
  popularProducts: string;
  viewProducts: string;
  previousProduct: string;
  nextProduct: string;
  productsEmpty: string;
  productsError: string;
  information: string;
  informationEmpty: string;
  productPrice: string;
  dailyIncome: string;
  totalReturn: string;
  cycle: string;
  returnRatio: string;
};

const COPY: Record<Lang, HomeCopy> = {
  fr: {
    chat: "Service client",
    bannerLabel: "Bannière d’accueil",
    depositBalance: "Solde de Recharge",
    withdrawalBalance: "Solde de Retrait",
    productRevenue: "Revenu total",
    recharge: "Recharger",
    withdraw: "Retirer",
    team: "Équipe",
    proofs: "Preuves",
    checkinTitle: "Pointage",
    loading: "Chargement",
    retry: "Réessayer",
    retryLabel: "Réessayer le chargement du revenu total",
    popularProducts: "Produits populaires",
    viewProducts: "Voir les produits",
    previousProduct: "Produit précédent",
    nextProduct: "Produit suivant",
    productsEmpty: "Aucun produit payant actif n’est disponible.",
    productsError: "Impossible de charger les produits.",
    information: "Information",
    informationEmpty: "Aucune information disponible.",
    productPrice: "Prix",
    dailyIncome: "Revenu quotidien",
    totalReturn: "Revenu total",
    cycle: "Cycle",
    returnRatio: "Ratio du total",
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
    proofs: "Proofs",
    checkinTitle: "Daily Check-in",
    loading: "Loading",
    retry: "Retry",
    retryLabel: "Retry loading product revenue",
    popularProducts: "Popular products",
    viewProducts: "View products",
    previousProduct: "Previous product",
    nextProduct: "Next product",
    productsEmpty: "No active paid products are available.",
    productsError: "Could not load the products.",
    information: "Information",
    informationEmpty: "No information is available.",
    productPrice: "Price",
    dailyIncome: "Daily income",
    totalReturn: "Total return",
    cycle: "Cycle",
    returnRatio: "Total ratio",
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
    proofs: "إثباتات",
    checkinTitle: "تسجيل الحضور",
    loading: "جارٍ التحميل",
    retry: "إعادة المحاولة",
    retryLabel: "إعادة تحميل أرباح المنتجات",
    popularProducts: "المنتجات الشائعة",
    viewProducts: "عرض المنتجات",
    previousProduct: "المنتج السابق",
    nextProduct: "المنتج التالي",
    productsEmpty: "لا توجد منتجات مدفوعة نشطة متاحة.",
    productsError: "تعذر تحميل المنتجات.",
    information: "المعلومات",
    informationEmpty: "لا توجد معلومات متاحة.",
    productPrice: "السعر",
    dailyIncome: "الدخل اليومي",
    totalReturn: "الإجمالي",
    cycle: "الدورة",
    returnRatio: "نسبة الإجمالي",
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
    proofs: "凭证",
    checkinTitle: "每日签到",
    loading: "加载中",
    retry: "重试",
    retryLabel: "重新加载产品收益",
    popularProducts: "热门产品",
    viewProducts: "查看产品",
    previousProduct: "上一个产品",
    nextProduct: "下一个产品",
    productsEmpty: "暂无启用的付费产品。",
    productsError: "无法加载产品。",
    information: "信息",
    informationEmpty: "暂无信息。",
    productPrice: "价格",
    dailyIncome: "每日收入",
    totalReturn: "总回报",
    cycle: "周期",
    returnRatio: "总额比例",
  },
};

const FALLBACK_BANNERS = HOME_BANNER_DEFAULT_IMAGES;
const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const COUNT_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const QUICK_ACTIONS: {
  id: "recharge" | "withdraw" | "team" | "proofs";
  Icon: LucideIcon;
  href: string;
}[] = [
  { id: "recharge", Icon: WalletCards, href: "/deposit" },
  { id: "withdraw", Icon: ArrowDownToLine, href: "/withdrawal" },
  { id: "team", Icon: UsersRound, href: "/team" },
  { id: "proofs", Icon: FileCheck2, href: "/withdrawal-proofs" },
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

function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { lang } = useI18n();
  const copy = COPY[lang];
  const popularProductsRef = useRef<HTMLDivElement>(null);
  const popularProductsPointerInsideRef = useRef(false);
  const popularProductsFocusInsideRef = useRef(false);
  const popularProductsManualPauseUntilRef = useRef(0);

  const { data: settings = {}, isLoading: isSettingsLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const informationArticles = useMemo(() => resolveInfoArticles(settings), [settings]);
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
    data: incomeSummary,
    isLoading: isIncomeLoading,
    isError: isIncomeError,
    refetch: refetchIncome,
  } = useQuery<IncomeSummary>({
    queryKey: ["/api/user/income-summary"],
  });

  const bannerImages = useMemo(
    () => parseBannerImages(settings.banner1Images, FALLBACK_BANNERS),
    [settings.banner1Images],
  );
  const selectedPopularIds = useMemo(
    () => parseProductIds(settings.specialProductIds),
    [settings.specialProductIds],
  );
  const popularProducts = useMemo(() => {
    const productsById = new Map(catalogProducts.map((product) => [product.id, product]));
    if (selectedPopularIds.length > 0) {
      return selectedPopularIds
        .map((id) => productsById.get(id))
        .filter((product): product is Product => Boolean(product && product.isActive && !product.isFree))
        .slice(0, 4);
    }
    return catalogProducts
      .filter((product) => product.isActive && !product.isFree)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .slice(0, 4);
  }, [catalogProducts, selectedPopularIds]);
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const track = popularProductsRef.current;
    if (!isAuthenticated || !track || popularProducts.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState !== "visible"
        || popularProductsPointerInsideRef.current
        || popularProductsFocusInsideRef.current
        || Date.now() < popularProductsManualPauseUntilRef.current
      ) {
        return;
      }

      const trackBounds = track.getBoundingClientRect();
      if (trackBounds.width === 0 || trackBounds.bottom <= 0 || trackBounds.top >= window.innerHeight) return;

      const cards = Array.from(track.querySelectorAll<HTMLButtonElement>(".ielp-home-product-card"));
      if (cards.length < 2) return;

      const isRtl = lang === "ar";
      let currentIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const cardBounds = card.getBoundingClientRect();
        const distance = Math.abs(isRtl
          ? cardBounds.right - trackBounds.right
          : cardBounds.left - trackBounds.left);
        if (distance < closestDistance) {
          closestDistance = distance;
          currentIndex = index;
        }
      });

      cards[(currentIndex + 1) % cards.length].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, lang, popularProducts.length]);

  if (!user) return null;

  function scrollPopularProducts(direction: -1 | 1) {
    const track = popularProductsRef.current;
    if (!track) return;
    popularProductsManualPauseUntilRef.current = Date.now() + 5000;
    const rtlFactor = lang === "ar" ? -1 : 1;
    track.scrollBy({
      left: direction * rtlFactor * Math.max(220, track.clientWidth * 0.78),
      behavior: "smooth",
    });
  }

  const balances = [
    { id: "deposit", label: copy.depositBalance, value: user.balance },
    { id: "withdrawal", label: copy.withdrawalBalance, value: user.totalEarnings },
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
                  onClick={() => navigate(href)}
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
                onPointerDown={() => {
                  popularProductsManualPauseUntilRef.current = Date.now() + 5000;
                }}
                onPointerEnter={() => { popularProductsPointerInsideRef.current = true; }}
                onPointerLeave={() => { popularProductsPointerInsideRef.current = false; }}
                onFocusCapture={() => { popularProductsFocusInsideRef.current = true; }}
                onBlurCapture={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    popularProductsFocusInsideRef.current = false;
                  }
                }}
              >
                {popularProducts.map((product, index) => {
                  const name = rebrandText(product.name);
                  const price = Number(product.price);
                  const totalReturn = Number(product.totalReturn);
                  const ratio = Number.isFinite(price) && price > 0 && Number.isFinite(totalReturn)
                    ? (totalReturn / price) * 100
                    : undefined;
                  return (
                    <button
                      className="ielp-home-product-card"
                      type="button"
                      key={product.id}
                      style={product.cardColor ? {
                        borderColor: product.cardColor,
                        background: `color-mix(in srgb, ${product.cardColor} 34%, var(--home-panel))`,
                      } : undefined}
                      onClick={() => navigate("/invest")}
                      aria-label={`${name} — ${copy.viewProducts}`}
                      data-testid={`home-popular-product-${product.id}`}
                    >
                      {getProductImageUrl(product.imageUrl) ? (
                        <img
                          className="ielp-home-product-card__image"
                          src={getProductImageUrl(product.imageUrl)!}
                          alt=""
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <span className="ielp-home-product-card__image flex items-center justify-center bg-slate-100 text-slate-400" aria-hidden="true">
                          <ImageIcon className="h-7 w-7" />
                        </span>
                      )}
                      <span className="ielp-home-product-card__content">
                        <span className="ielp-home-product-card__topline">
                          <span className="ielp-home-product-card__name">{name}</span>
                          <span
                            className="ielp-home-product-card__ratio"
                            aria-label={ratio === undefined ? copy.returnRatio : `${copy.returnRatio}: ${ratio.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                          >
                            {ratio === undefined
                              ? "—"
                              : `${ratio.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
                          </span>
                        </span>
                        <span className="ielp-home-product-card__details">
                          <span>
                            <small>{copy.totalReturn}</small>
                            <strong><small>XOF</small> {formatMoney(product.totalReturn)}</strong>
                          </span>
                          <span>
                            <small>{copy.dailyIncome}</small>
                            <strong><small>XOF</small> {formatMoney(product.dailyEarnings)}</strong>
                          </span>
                          <span>
                            <small>{copy.cycle}</small>
                            <strong>{formatCount(product.cycleDays)} {lang === "fr" ? "j" : lang === "zh" ? "天" : lang === "ar" ? "يوم" : "days"}</strong>
                          </span>
                          <span>
                            <small>{copy.productPrice}</small>
                            <strong><small>XOF</small> {formatMoney(product.price)}</strong>
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="ielp-home-info" aria-labelledby="ielp-home-info-title">
            <h2 id="ielp-home-info-title">{copy.information}</h2>
            {informationArticles.length ? (
              <div className="ielp-home-info__articles">
                {informationArticles.map((article) => {
                  const articleCopy = article.copy[lang];
                  return (
                    <button
                      className="ielp-home-info-card"
                      type="button"
                      key={article.id}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      onClick={() => navigate(`/news/${article.id}`)}
                      aria-label={`${articleCopy.title}. ${articleCopy.summary}`}
                      data-testid={`home-information-${article.id}`}
                    >
                      <span className="ielp-home-info-card__copy">
                        <strong className="ielp-home-info-card__title">{articleCopy.title}</strong>
                        <span className="ielp-home-info-card__summary">{articleCopy.summary}</span>
                      </span>
                      <img className="ielp-home-info-card__image" src={article.image} alt={`${articleCopy.title} — illustration`} loading="lazy" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="ielp-home-info__empty">{copy.informationEmpty}</p>
            )}
          </section>

        </div>
      </div>

      <FloatingSupport placement="home" />
      <FloatingWheel bottomOffset={84} />
      <FloatingCheckin label={copy.checkinTitle} bottomOffset={24} />
      <HomeAnnouncementModal />
    </main>
  );
}

export default HomePage;