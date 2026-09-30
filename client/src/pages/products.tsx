import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ChevronDown, Loader2, MessageCircleMore, MessageSquare } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { formatCurrency } from "@/lib/countries";
import { LanguagePicker } from "@/components/language-picker";
import { FloatingSupport } from "@/components/floating-support";
import type { Product } from "@shared/schema";
import { getProductVisual } from "@/lib/product-visuals";
import { getContent, rebrandText } from "@/lib/content";
import "./products.css";

const PRODUCT_ACCENT = "#00ef24";
const CURRENCY = "USDT";
interface ProductWithOwnership extends Product {
  isOwned: boolean;
  ownedCount?: number;
}

const INVEST_COPY: Record<Lang, {
  introTitle: string;
  growthLine: string;
  marketLine: string;
  moreLine: string;
  more: string;
  less: string;
  myInvestments: string;
  days: string;
  daily: string;
  term: string;
  minimum: string;
  total: string;
  fixedDuration: string;
  investNow: string;
  chat: string;
}> = {
  fr: {
    introTitle: "Introduction aux produits d'investissement et de gestion de patrimoine",
    growthLine: "Nous vous aidons à réaliser une croissance rapide de votre patrimoine !",
    marketLine: "Dans ce marché en constante évolution, nous proposons des produits d'investissement et de gestion",
    moreLine: "de patrimoine conçus pour vos objectifs.",
    more: "Plus",
    less: "Moins",
    myInvestments: "Investir des données",
    days: "jours",
    daily: "Tous les jours",
    term: "Terme",
    minimum: "Investissement minimum",
    total: "Investissement total",
    fixedDuration: "Durée déterminée",
    investNow: "INVESTISSEZ MAINTENANT",
    chat: "Assistance",
  },
  en: {
    introTitle: "Introduction to investment products and wealth management",
    growthLine: "We help you achieve rapid growth in your wealth!",
    marketLine: "In a constantly evolving market, we offer investment and wealth management products",
    moreLine: "designed to support your goals.",
    more: "More",
    less: "Less",
    myInvestments: "My investments",
    days: "days",
    daily: "Every day",
    term: "Term",
    minimum: "Minimum investment",
    total: "Total investment",
    fixedDuration: "Fixed duration",
    investNow: "INVEST NOW",
    chat: "Support",
  },
  ar: {
    introTitle: "مقدمة عن منتجات الاستثمار وإدارة الثروات",
    growthLine: "نساعدك على تحقيق نمو سريع لثروتك!",
    marketLine: "في هذا السوق المتطور باستمرار، نقدم منتجات استثمارية ومنتجات لإدارة الثروات",
    moreLine: "مصممة لدعم أهدافك.",
    more: "المزيد",
    less: "أقل",
    myInvestments: "استثماراتي",
    days: "أيام",
    daily: "يوميًا",
    term: "المدة",
    minimum: "الحد الأدنى للاستثمار",
    total: "إجمالي الاستثمار",
    fixedDuration: "العائد المحدد",
    investNow: "استثمر الآن",
    chat: "الدعم",
  },
  zh: {
    introTitle: "投资产品与财富管理简介",
    growthLine: "助您实现财富快速增长！",
    marketLine: "在不断变化的市场中，我们提供投资和财富管理产品",
    moreLine: "以支持您的财务目标。",
    more: "更多",
    less: "收起",
    myInvestments: "我的投资",
    days: "天",
    daily: "每日",
    term: "期限",
    minimum: "最低投资",
    total: "投资总数",
    fixedDuration: "固定期限",
    investNow: "立即投资",
    chat: "客服",
  },
};

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

function IelpProductMark({ label }: { label: string }) {
  return (
    <svg className="ielp-invest-product-mark" viewBox="0 0 112 112" role="img" aria-label={label}>
      <rect width="112" height="112" rx="7" fill="#346b96" />
      <g fill="#f4f7fa" fontFamily="Georgia, serif" textAnchor="middle">
        <text x="76" y="47" fontSize="12">ICAHN</text>
        <text x="76" y="62" fontSize="12">ENTERPRISES</text>
        <text x="76" y="77" fontSize="12">L.P.</text>
      </g>
    </svg>
  );
}

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
  const copy = INVEST_COPY[lang];
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithOwnership[]>({
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
    onError: (error: any) => {
      setConfirmProduct(null);
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const depositBalance = Number.isFinite(parseFloat(user.balance || "0"))
    ? parseFloat(user.balance || "0")
    : 0;
  const earningsBalance = Number.isFinite(parseFloat(user.totalEarnings || "0"))
    ? parseFloat(user.totalEarnings || "0")
    : 0;
  const availableBalance = depositBalance + earningsBalance;
  const currency = CURRENCY;
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";

  const paidProducts = (products || []).filter(p => !p.isFree);
  const filtered = paidProducts;
  const pageTitle = getContent(settings, "content_products_headerTitle", "Nos produits DIAMANT");
  const getDisplayName = (product: ProductWithOwnership) => rebrandText(product.name);
  const getProductImage = (product: ProductWithOwnership, index: number) => {
    return getProductVisual(product.imageUrl, index);
  };
  const confirmProductIndex = confirmProduct
    ? Math.max(0, filtered.findIndex((product) => product.id === confirmProduct.id))
    : 0;

  /* ─── Ouvre toujours le popup — la vérification du solde se fait dedans ─── */
  const handleBuy = (product: ProductWithOwnership) => {
    setConfirmProduct(product);
  };

  return (
    <main className="ielp-home-page ielp-invest-page" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="ielp-home-shell ielp-invest-shell">
        <header className="ielp-home-header">
          <Link className="ielp-home-brand" href="/" aria-label="IELP accueil">
            <IelpSeal />
            <span>IELP</span>
          </Link>
          <div className="ielp-home-header__actions">
            <LanguagePicker variant="home" />
            <Link
              className="ielp-home-chat-top"
              href="/service"
              aria-label={copy.chat}
              data-testid="button-home-chat"
            >
              <MessageSquare size={21} fill="white" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="ielp-home-content ielp-invest-content">
          <h1 className="sr-only">{pageTitle}</h1>
          <section className="ielp-invest-intro" aria-label={copy.introTitle}>
            <p className="ielp-invest-intro__title">{copy.introTitle}</p>
            <p>{copy.growthLine}</p>
            <p>
              {copy.marketLine}
              {introExpanded && <> {copy.moreLine}</>}
            </p>
            <button
              className="ielp-invest-more"
              type="button"
              aria-expanded={introExpanded}
              onClick={() => setIntroExpanded((expanded) => !expanded)}
            >
              <span>{introExpanded ? copy.less : copy.more}</span>
              <ChevronDown size={16} strokeWidth={2.2} className={introExpanded ? "is-open" : ""} aria-hidden="true" />
            </button>
          </section>

          <Link className="ielp-invest-owned-link" href="/my-products">
            {copy.myInvestments}
          </Link>

          <section className="ielp-invest-list" aria-label={pageTitle}>
            {productsLoading ? (
              <div className="ielp-invest-loading" aria-label={t.loading}>
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="ielp-invest-empty">
                <p>{t.noProducts}</p>
              </div>
            ) : (
              filtered.map((product, index) => {
                const price = Number(product.price) || 0;
                const dailyEarnings = Number(product.dailyEarnings) || 0;
                const totalReturn = Number(product.totalReturn) || 0;
                const dailyPercent = price > 0 ? (dailyEarnings / price) * 100 : 0;
                const fixedDurationPercent = price > 0 ? ((price + totalReturn) / price) * 100 : 100;
                const isPending = purchaseMutation.isPending && purchaseMutation.variables === product.id;
                const stock = Math.min(100, Math.max(0, Number(product.stockPercentage) || 0));
                const isSoldOut = stock >= 100;
                const isUnavailable = !!product.isUnavailable;
                const isBlocked = isSoldOut || isUnavailable;
                const displayName = `IELP Investment Products ${index + 1}`;

                return (
                  <article
                    key={product.id}
                    className="ielp-invest-product-card"
                    data-testid={`product-card-${product.id}`}
                  >
                    <h2 className="ielp-invest-product-title" dir="ltr">{displayName}</h2>
                    <div className="ielp-invest-product-details">
                      <IelpProductMark label={displayName} />
                      <dl className="ielp-invest-product-info">
                        <div className="ielp-invest-info-row">
                          <dt>{copy.daily}:</dt>
                          <dd className="ielp-invest-daily-rate">{dailyPercent.toFixed(2)}%</dd>
                        </div>
                        <div className="ielp-invest-info-row">
                          <dt>{copy.term}:</dt>
                          <dd>{product.cycleDays} {copy.days}</dd>
                        </div>
                        <div className="ielp-invest-info-row ielp-invest-info-row--minimum">
                          <dt>{copy.minimum}:</dt>
                          <dd>{formatUsdt(price)} USDT</dd>
                        </div>
                        <div className="ielp-invest-info-row">
                          <dt>{copy.total}:</dt>
                          <dd>{Number(product.ownedCount || 0).toLocaleString(locale)}</dd>
                        </div>
                        <div className="ielp-invest-info-row">
                          <dt>{copy.fixedDuration}:</dt>
                          <dd>{Math.round(fixedDurationPercent)}%</dd>
                        </div>
                      </dl>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isBlocked && handleBuy(product)}
                      disabled={purchaseMutation.isPending || isBlocked}
                      className={`ielp-invest-buy${isBlocked ? " is-disabled" : ""}`}
                      aria-label={`${copy.investNow}: ${displayName}`}
                      data-testid={`button-purchase-${product.id}`}
                    >
                      {isPending ? (
                        <Loader2 size={22} className="animate-spin" />
                      ) : isBlocked ? (
                        lang === "en" ? "SOLD OUT" : "ÉPUISÉ"
                      ) : (
                        copy.investNow
                      )}
                    </button>
                  </article>
                );
              })
            )}
          </section>
        </div>

        <FloatingSupport placement="home" />
        <Link className="ielp-home-chat-float" href="/service" aria-label={copy.chat} data-testid="button-home-chat-floating">
          <MessageCircleMore size={32} strokeWidth={2.6} aria-hidden="true" />
        </Link>

      {/* ══ POPUP CONFIRMATION ACHAT ══ */}
      <Dialog open={!!confirmProduct} onOpenChange={(open) => !open && setConfirmProduct(null)}>
        {confirmProduct && (
          <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl">
            <DialogTitle className="sr-only">Confirmer l'achat de {getDisplayName(confirmProduct)}</DialogTitle>
            {/* Image produit */}
            <div className="flex items-center justify-center" style={{ background: "#f8f8f8", height: 200 }}>
              <img
                src={getProductImage(confirmProduct, confirmProductIndex)}
                alt={getDisplayName(confirmProduct)}
                style={{ height: 180, maxWidth: "90%", objectFit: "contain" }}
              />
            </div>

            {/* Prix + nom */}
            <div className="px-5 pt-4 pb-2">
              <p className="font-black" style={{ fontSize: 24, color: PRODUCT_ACCENT, lineHeight: 1.2 }}>
                {currency} {Number(confirmProduct.price).toLocaleString(locale)}
              </p>
              <p style={{ fontSize: 14, color: "#555", marginTop: 2 }}>{getDisplayName(confirmProduct)}</p>
            </div>

            {/* Séparateur */}
            <div style={{ height: 1, background: "#f0f0f0", margin: "0 20px" }} />

            {/* Description */}
            <div className="px-5 py-3 text-center">
              <p style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>
                {t.investConfirmDesc}
              </p>
              <p style={{ fontSize: 12, color: "#888", marginTop: 3, lineHeight: 1.5 }}>
                {lang === "en" ? "You can buy multiple devices to increase your earnings" : "Vous pouvez acheter plusieurs appareils pour augmenter vos revenus"}
              </p>
            </div>

            {/* Alerte solde insuffisant */}
            {availableBalance < parseFloat(String(confirmProduct.price)) && (
              <div className="mx-5 mb-2 flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "#fff2f2", border: "1px solid #fca5a5" }}>
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: PRODUCT_ACCENT }} />
                <p className="text-xs" style={{ color: "#149a39" }}>
                  {t.investInsufficient.replace("{0}", formatCurrency(
                    parseFloat(String(confirmProduct.price)) - availableBalance, user.country
                  ))}
                </p>
              </div>
            )}

            {/* Le solde des dépôts est débité en priorité, puis le solde des gains. */}
            {(() => {
              const price = parseFloat(String(confirmProduct.price));
              const depositDebit = Math.min(Math.max(0, depositBalance), price);
              const earningsDebit = Math.max(0, price - depositDebit);
              const labels = lang === "en"
                ? { title: "Payment breakdown", deposit: "Deposit balance", earnings: "Earnings balance" }
                : lang === "ar"
                  ? { title: "تفاصيل الدفع", deposit: "رصيد الإيداعات", earnings: "رصيد الأرباح" }
                  : lang === "zh"
                    ? { title: "支付明细", deposit: "存款余额", earnings: "收益余额" }
                    : { title: "Répartition du paiement", deposit: "Solde des dépôts", earnings: "Solde des gains" };
              return (
                <div className="mx-5 mb-4 rounded-xl border border-[#e8e8e8] bg-[#fafafa] px-4 py-3">
                  <p className="mb-2 text-xs font-bold text-[#444]">{labels.title}</p>
                  <div className="flex justify-between text-xs text-[#666]">
                    <span>{labels.deposit}</span>
                    <span className="font-semibold text-[#222]">-{currency} {depositDebit.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                  </div>
                  {earningsDebit > 0 && (
                    <div className="mt-1 flex justify-between text-xs text-[#666]">
                      <span>{labels.earnings}</span>
                      <span className="font-semibold text-[#222]">-{currency} {earningsDebit.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Stats 3 colonnes */}
            <div className="flex" style={{ margin: "0 20px 16px", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
              {[
                { value: `${confirmProduct.cycleDays} ${t.ordersDaysLbl}`, label: t.duration },
                { value: `${currency} ${Number(confirmProduct.dailyEarnings).toLocaleString(locale)}`, label: t.dailyRevenue },
                { value: `${currency} ${Number(confirmProduct.totalReturn).toLocaleString(locale)}`, label: t.totalRevenue },
              ].map((stat, i) => (
                <div key={i} className="flex-1 flex flex-col items-center py-3"
                  style={{ borderRight: i < 2 ? "1px solid #eee" : "none" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#12bc3e", lineHeight: 1.3 }}>{stat.value}</p>
                  <p style={{ fontSize: 11, color: "#888", marginTop: 2, textAlign: "center", lineHeight: 1.3 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Boutons */}
            <div className="flex" style={{ borderTop: "1px solid #f0f0f0" }}>
              <button
                onClick={() => setConfirmProduct(null)}
                className="flex-1 font-semibold active:opacity-70"
                style={{ padding: "17px 0", fontSize: 16, color: "#555", background: "#e8e8e8", border: "none", borderBottomLeftRadius: 24 }}
                data-testid="button-cancel-purchase"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => purchaseMutation.mutate(confirmProduct.id)}
                disabled={purchaseMutation.isPending || availableBalance < parseFloat(String(confirmProduct.price))}
                className="flex-1 font-bold text-white flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
                style={{ padding: "17px 0", fontSize: 16, background: "#12bc3e", border: "none", borderBottomRightRadius: 24 }}
                data-testid="button-confirm-purchase"
              >
                {purchaseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
