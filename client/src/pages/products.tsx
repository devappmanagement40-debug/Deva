import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronDown, CircleHelp, Loader2, MessageCircleMore, MessageSquare, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useI18n, type Lang } from "@/lib/i18n";
import { formatCurrency } from "@/lib/countries";
import { LanguagePicker } from "@/components/language-picker";
import { FloatingSupport } from "@/components/floating-support";
import { DiamantBrand } from "@/components/diamant-brand";
import type { Product } from "@shared/schema";
import { getProductVisual } from "@/lib/product-visuals";
import { getContent, rebrandText } from "@/lib/content";
import "./products.css";

interface ProductWithOwnership extends Product {
  isOwned: boolean;
  ownedCount?: number;
}

const INVEST_COPY: Record<Lang, {
  title: string;
  subtitle: string;
  tabs: [string, string, string];
  overview: string;
  more: string;
  less: string;
  myInvestments: string;
  available: string;
  days: string;
  daily: string;
  term: string;
  priceLabel: string;
  total: string;
  owned: string;
  investNow: string;
  soldOut: string;
  unavailable: string;
  support: string;
  purchaseHint: string;
  multipleHint: string;
  paymentBreakdown: string;
  depositBalance: string;
  earningsBalance: string;
  loading: string;
  retry: string;
}> = {
  fr: {
    title: "Investir avec DIAMANT",
    subtitle: "Des produits sélectionnés pour faire grandir votre portefeuille.",
    tabs: ["Stabiliser", "Bien-être", "Activité"],
    overview: "Découvrez les produits d’investissement DIAMANT",
    more: "En savoir plus",
    less: "Réduire",
    myInvestments: "Mes investissements",
    available: "Solde disponible",
    days: "jours",
    daily: "Revenu quotidien",
    term: "Jours de revenu",
    priceLabel: "Prix",
    total: "Revenu total",
    owned: "Possédés",
    investNow: "Acheter",
    soldOut: "Épuisé",
    unavailable: "Bientôt disponible",
    support: "Assistance",
    purchaseHint: "Le premier revenu est disponible après l’achat. Les revenus suivants se collectent toutes les 24 heures.",
    multipleHint: "Vous pouvez acheter plusieurs produits pour augmenter vos revenus.",
    paymentBreakdown: "Répartition du paiement",
    depositBalance: "Solde des dépôts",
    earningsBalance: "Solde des gains",
    loading: "Chargement des produits",
    retry: "Réessayer",
  },
  en: {
    title: "Invest with DIAMANT",
    subtitle: "Selected products to help your portfolio grow.",
    tabs: ["Stability", "Wellness", "Activity"],
    overview: "Explore DIAMANT investment products",
    more: "Read more",
    less: "Show less",
    myInvestments: "My investments",
    available: "Available balance",
    days: "days",
    daily: "Daily revenue",
    term: "Revenue days",
    priceLabel: "Price",
    total: "Total revenue",
    owned: "Owned",
    investNow: "Buy",
    soldOut: "Sold out",
    unavailable: "Unavailable",
    support: "Support",
    purchaseHint: "Your first earnings are available after purchase. Collect subsequent earnings every 24 hours.",
    multipleHint: "You can purchase multiple products to increase your earnings.",
    paymentBreakdown: "Payment breakdown",
    depositBalance: "Deposit balance",
    earningsBalance: "Earnings balance",
    loading: "Loading products",
    retry: "Try again",
  },
  ar: {
    title: "استثمر مع DIAMANT",
    subtitle: "منتجات مختارة للمساعدة على تنمية محفظتك.",
    tabs: ["الاستقرار", "العافية", "النشاط"],
    overview: "اكتشف منتجات DIAMANT الاستثمارية",
    more: "اقرأ المزيد",
    less: "عرض أقل",
    myInvestments: "استثماراتي",
    available: "الرصيد المتاح",
    days: "أيام",
    daily: "العائد اليومي",
    term: "أيام الربح",
    priceLabel: "السعر",
    total: "إجمالي العائد",
    owned: "مملوك",
    investNow: "شراء",
    soldOut: "نفد المخزون",
    unavailable: "غير متاح",
    support: "الدعم",
    purchaseHint: "تتوفر أرباحك الأولى بعد الشراء. اجمع الأرباح التالية كل 24 ساعة.",
    multipleHint: "يمكنك شراء عدة منتجات لزيادة أرباحك.",
    paymentBreakdown: "تفاصيل الدفع",
    depositBalance: "رصيد الإيداعات",
    earningsBalance: "رصيد الأرباح",
    loading: "جارٍ تحميل المنتجات",
    retry: "إعادة المحاولة",
  },
  zh: {
    title: "与 DIAMANT 一起投资",
    subtitle: "精选产品，助力您的资产稳步增长。",
    tabs: ["稳健", "健康", "活力"],
    overview: "探索 DIAMANT 投资产品",
    more: "了解更多",
    less: "收起",
    myInvestments: "我的投资",
    available: "可用余额",
    days: "天",
    daily: "每日收益",
    term: "收益天数",
    priceLabel: "价格",
    total: "总收益",
    owned: "已拥有",
    investNow: "购买",
    soldOut: "已售罄",
    unavailable: "暂不可用",
    support: "客服",
    purchaseHint: "购买后即可获得首笔收益，之后每 24 小时可领取一次。",
    multipleHint: "您可以购买多个产品以增加收益。",
    paymentBreakdown: "支付明细",
    depositBalance: "存款余额",
    earningsBalance: "收益余额",
    loading: "正在加载产品",
    retry: "重试",
  },
};

function formatUsdt(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
}

export default function ProductsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [confirmProduct, setConfirmProduct] = useState<ProductWithOwnership | null>(null);
  const [introExpanded, setIntroExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const copy = INVEST_COPY[lang];
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const pageTitle = getContent(settings, "content_products_headerTitle", copy.title);

  const { data: products, isLoading: productsLoading, isError, refetch } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      refreshUser();
      setConfirmProduct(null);
      toast({ title: t.purchaseSuccess, description: t.purchaseSuccessDescription });
    },
    onError: (error: Error) => {
      setConfirmProduct(null);
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const depositBalance = Number.isFinite(parseFloat(user.balance || "0")) ? parseFloat(user.balance || "0") : 0;
  const earningsBalance = Number.isFinite(parseFloat(user.totalEarnings || "0")) ? parseFloat(user.totalEarnings || "0") : 0;
  const availableBalance = depositBalance + earningsBalance;
  const paidProducts = (products || []).filter((product) => !product.isFree);
  const getDisplayName = (product: ProductWithOwnership) => rebrandText(product.name);
  const getProductImage = (product: ProductWithOwnership, index: number) => getProductVisual(product.imageUrl, index);
  const confirmProductIndex = confirmProduct
    ? Math.max(0, paidProducts.findIndex((product) => product.id === confirmProduct.id))
    : 0;
  const handleBuy = (product: ProductWithOwnership) => setConfirmProduct(product);

  return (
    <main className="ielp-home-page diamant-invest-page" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="ielp-home-shell diamant-invest-shell">
        <header className="ielp-home-header diamant-invest-header">
          <Link className="diamant-invest-brand" href="/" aria-label="DIAMANT">
            <DiamantBrand variant="on-dark" markSize={33} />
          </Link>
          <div className="ielp-home-header__actions">
            <LanguagePicker variant="home" />
            <Link className="ielp-home-chat-top" href="/service" aria-label={copy.support} data-testid="button-invest-support">
              <MessageSquare size={20} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="diamant-invest-content">
          <section className="diamant-invest-hero" aria-labelledby="invest-title">
            <div className="diamant-invest-hero__eyebrow">
              <span className="diamant-invest-hero__line" />
              <span>DIAMANT · USDT</span>
            </div>
            <div className="diamant-invest-hero__row">
              <div>
                <h1 id="invest-title">{pageTitle}</h1>
                <p>{copy.subtitle}</p>
              </div>
              <Link className="diamant-invest-balance" href="/account">
                <span>{copy.available}</span>
                <strong>{formatUsdt(availableBalance)} <small>USDT</small></strong>
              </Link>
            </div>
          </section>

          <section className="diamant-invest-intro" aria-label={copy.overview}>
            <div className="diamant-invest-intro__copy">
              <span className="diamant-invest-intro__index">01 / CATALOG</span>
              <p>{copy.overview}</p>
              {introExpanded && <p className="diamant-invest-intro__detail">{copy.subtitle}</p>}
            </div>
            <button
              className="diamant-invest-more"
              type="button"
              aria-expanded={introExpanded}
              onClick={() => setIntroExpanded((expanded) => !expanded)}
            >
              <span>{introExpanded ? copy.less : copy.more}</span>
              <ChevronDown size={16} className={introExpanded ? "is-open" : ""} aria-hidden="true" />
            </button>
          </section>

          <div className="diamant-invest-tabs" role="group" aria-label={copy.overview}>
            {copy.tabs.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={selectedTab === index}
                className={selectedTab === index ? "is-selected" : ""}
                onClick={() => setSelectedTab(index)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="diamant-invest-list-heading">
            <div>
              <span>{lang === "en" ? "THE COLLECTION" : lang === "ar" ? "المجموعة" : lang === "zh" ? "精选系列" : "LA COLLECTION"}</span>
              <h2>{copy.tabs[selectedTab]}</h2>
            </div>
            <Link className="diamant-invest-owned-link" href="/my-products">
              {copy.myInvestments}
            </Link>
          </div>

          <section className="diamant-invest-list" aria-label={copy.title}>
            {productsLoading ? (
              <div className="diamant-invest-skeletons" aria-label={copy.loading} aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="diamant-invest-skeleton">
                    <div className="diamant-invest-skeleton__title" />
                    <div className="diamant-invest-skeleton__image" />
                    <div className="diamant-invest-skeleton__copy"><i /><i /><i /></div>
                    <div className="diamant-invest-skeleton__action" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="diamant-invest-state">
                <CircleHelp size={29} aria-hidden="true" />
                <p>{t.errorOccurred}</p>
                <button type="button" onClick={() => void refetch()}><RefreshCw size={15} />{copy.retry}</button>
              </div>
            ) : paidProducts.length === 0 ? (
              <div className="diamant-invest-state">
                <span className="diamant-invest-state__mark"><DiamantBrand markSize={34} showWordmark={false} /></span>
                <p>{t.noProducts}</p>
              </div>
            ) : (
              paidProducts.map((product, index) => {
                const price = Number(product.price) || 0;
                const dailyEarnings = Number(product.dailyEarnings) || 0;
                const totalReturn = Number(product.totalReturn) || 0;
                const isPending = purchaseMutation.isPending && purchaseMutation.variables === product.id;
                const stock = Math.min(100, Math.max(0, Number(product.stockPercentage) || 0));
                const isSoldOut = stock >= 100;
                const isUnavailable = !!product.isUnavailable;
                const isBlocked = isSoldOut || isUnavailable;
                const displayName = getDisplayName(product) || `${copy.tabs[2]} ${index + 1}`;

                return (
                  <article key={product.id} className="diamant-invest-product-card" data-testid={`product-card-${product.id}`}>
                    <div className="diamant-invest-card-topline">
                      <span className="diamant-invest-card-kicker">DIAMANT / {String(index + 1).padStart(2, "0")}</span>
                      {product.isOwned && <span className="diamant-invest-owned-badge"><Check size={12} />{copy.owned} · {product.ownedCount || 1}</span>}
                    </div>
                    <div className="diamant-invest-product-main">
                      <div className="diamant-invest-product-copy">
                        <h3>{displayName}</h3>
                        <dl>
                          <div><dt>{copy.daily}</dt><dd>{formatUsdt(dailyEarnings)} <small>USDT</small></dd></div>
                          <div><dt>{copy.term}</dt><dd>{product.cycleDays} {copy.days}</dd></div>
                          <div><dt>{copy.total}</dt><dd>{formatUsdt(totalReturn)} <small>USDT</small></dd></div>
                        </dl>
                      </div>
                      <div className="diamant-invest-product-visual">
                        <img src={getProductImage(product, index)} alt={displayName} loading="lazy" />
                        <span>DIAMANT</span>
                      </div>
                    </div>
                    <div className="diamant-invest-product-footer">
                      <div className="diamant-invest-price">
                        <span>{copy.priceLabel}</span>
                        <strong>{formatUsdt(price)} <small>USDT</small></strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => !isBlocked && handleBuy(product)}
                        disabled={purchaseMutation.isPending || isBlocked}
                        className={`diamant-invest-buy${isBlocked ? " is-disabled" : ""}`}
                        aria-label={`${copy.investNow}: ${displayName}`}
                        data-testid={`button-purchase-${product.id}`}
                      >
                        {isPending ? <Loader2 size={19} className="animate-spin" /> : isUnavailable ? copy.unavailable : isSoldOut ? copy.soldOut : copy.investNow}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>

        <FloatingSupport placement="home" />
        <Link className="ielp-home-chat-float diamant-invest-chat-float" href="/service" aria-label={copy.support} data-testid="button-invest-chat-floating">
          <MessageCircleMore size={30} strokeWidth={2.4} aria-hidden="true" />
        </Link>

        <Dialog open={!!confirmProduct} onOpenChange={(open) => !open && setConfirmProduct(null)}>
          {confirmProduct && (
            <DialogContent className="diamant-purchase-dialog">
              <DialogTitle className="sr-only">{t.investConfirmDesc} — {getDisplayName(confirmProduct)}</DialogTitle>
              <div className="diamant-purchase-dialog__visual">
                <img src={getProductImage(confirmProduct, confirmProductIndex)} alt={getDisplayName(confirmProduct)} />
              </div>
              <div className="diamant-purchase-dialog__body">
                <div className="diamant-purchase-dialog__heading">
                  <div><span>DIAMANT / USDT</span><h2>{getDisplayName(confirmProduct)}</h2></div>
                  <strong>{formatUsdt(Number(confirmProduct.price))}<small> USDT</small></strong>
                </div>
                <p className="diamant-purchase-dialog__hint">{copy.purchaseHint}</p>
                <p className="diamant-purchase-dialog__hint diamant-purchase-dialog__hint--subtle">{copy.multipleHint}</p>
                {availableBalance < parseFloat(String(confirmProduct.price)) && (
                  <div className="diamant-purchase-alert">
                    <AlertTriangle size={17} aria-hidden="true" />
                    <p>{t.investInsufficient.replace("{0}", formatCurrency(
                      parseFloat(String(confirmProduct.price)) - availableBalance, user.country
                    ))}</p>
                  </div>
                )}
                <div className="diamant-payment-breakdown">
                  <p>{copy.paymentBreakdown}</p>
                  <div><span>{copy.depositBalance}</span><strong>−{formatUsdt(Math.min(Math.max(0, depositBalance), Number(confirmProduct.price)))} USDT</strong></div>
                  {Math.max(0, Number(confirmProduct.price) - Math.max(0, depositBalance)) > 0 && (
                    <div><span>{copy.earningsBalance}</span><strong>−{formatUsdt(Math.max(0, Number(confirmProduct.price) - Math.max(0, depositBalance)))} USDT</strong></div>
                  )}
                </div>
                <div className="diamant-purchase-stats">
                  {[
                    { value: `${confirmProduct.cycleDays} ${t.ordersDaysLbl}`, label: t.duration },
                    { value: `${formatUsdt(Number(confirmProduct.dailyEarnings))} USDT`, label: t.dailyRevenue },
                    { value: `${formatUsdt(Number(confirmProduct.totalReturn))} USDT`, label: t.totalRevenue },
                  ].map((stat) => (
                    <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>
                  ))}
                </div>
              </div>
              <div className="diamant-purchase-actions">
                <button type="button" onClick={() => setConfirmProduct(null)} data-testid="button-cancel-purchase">{t.cancel}</button>
                <button
                  type="button"
                  onClick={() => purchaseMutation.mutate(confirmProduct.id)}
                  disabled={purchaseMutation.isPending || availableBalance < parseFloat(String(confirmProduct.price))}
                  data-testid="button-confirm-purchase"
                >
                  {purchaseMutation.isPending && <Loader2 size={17} className="animate-spin" />}
                  {t.confirm}
                </button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </main>
  );
}