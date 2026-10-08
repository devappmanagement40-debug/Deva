import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleHelp, Image as ImageIcon, Loader2, MessageSquare, Minus, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useI18n, type Lang } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";
import { FloatingSupport } from "@/components/floating-support";
import { DiamantBrand } from "@/components/diamant-brand";
import type { Product } from "@shared/schema";
import { normalizeProductType } from "@shared/product-categories";
import { getProductImageUrl } from "@/lib/product-visuals";
import { rebrandText } from "@/lib/content";
import { PRODUCT_CARD_COPY } from "@/lib/product-card-copy";
import { ProductCatalogCard } from "@/components/product-catalog-card";
import {
  amountToXofCents,
  calculatePurchaseDebitAllocation,
  getMaxAffordableProductQuantity,
} from "@shared/product-purchase-policy";
import "./products.css";

const PRODUCT_TAB_TYPES = ["stability", "wellness", "activity"] as const;

const INVEST_COPY: Record<Lang, {
  tabs: [string, string, string];
  overview: string;
  days: string;
  daily: string;
  term: string;
  priceLabel: string;
  total: string;
  investNow: string;
  soldOut: string;
  unavailable: string;
  stabilityRequired: string;
  stabilityRequiredButton: string;
  vipRequired: string;
  support: string;
  purchaseHint: string;
  multipleHint: string;
  purchaseLimit: string;
  unlimitedPurchases: string;
  quantity: string;
  maxQuantity: string;
  increaseQuantity: string;
  decreaseQuantity: string;
  purchaseLimitReached: string;
  totalAmount: string;
  unitPrice: string;
  paymentBreakdown: string;
  depositBalance: string;
  earningsBalance: string;
  loading: string;
  retry: string;
}> = {
  fr: {
    ...PRODUCT_CARD_COPY.fr,
    tabs: ["Explore", "Parcours", "Offres"],
    overview: "Découvrez les produits d’investissement DIAMANT",
    investNow: "Acheter",
    soldOut: "Épuisé",
    unavailable: "Bientôt disponible",
    stabilityRequired: "Pour acheter un produit Parcours ou Offres, vous devez d’abord posséder un produit Explore actif.",
    stabilityRequiredButton: "Explore requis",
    vipRequired: "VIP {level} requis",
    support: "Assistance",
    purchaseHint: "Les gains sont crédités automatiquement à la fin du cycle du produit. Aucune collecte manuelle n'est nécessaire.",
    multipleHint: "Vous pouvez acheter plusieurs produits pour augmenter vos revenus.",
    purchaseLimit: "Max. achats par utilisateur : {0}",
    unlimitedPurchases: "Illimité",
    quantity: "Quantité",
    maxQuantity: "Maximum pour cet achat : {0}",
    increaseQuantity: "Augmenter la quantité",
    decreaseQuantity: "Réduire la quantité",
    purchaseLimitReached: "Vous avez atteint la limite d’achats configurée pour ce produit.",
    totalAmount: "Total à payer",
    unitPrice: "Prix unitaire : {0} XOF",
    paymentBreakdown: "Répartition du paiement",
    depositBalance: "Solde des dépôts",
    earningsBalance: "Solde des gains",
    loading: "Chargement des produits",
    retry: "Réessayer",
  },
  en: {
    ...PRODUCT_CARD_COPY.en,
    tabs: ["Stability", "Wellness", "Activity"],
    overview: "Explore DIAMANT investment products",
    investNow: "Buy",
    soldOut: "Sold out",
    unavailable: "Unavailable",
    stabilityRequired: "You must own an active Stability product before buying a Wellness or Activity product.",
    stabilityRequiredButton: "Stability required",
    vipRequired: "VIP {level} required",
    support: "Support",
    purchaseHint: "Product earnings are credited automatically at the end of the cycle. No manual collection is needed.",
    multipleHint: "You can purchase multiple products to increase your earnings.",
    purchaseLimit: "Maximum purchases per user: {0}",
    unlimitedPurchases: "Unlimited",
    quantity: "Quantity",
    maxQuantity: "Maximum for this order: {0}",
    increaseQuantity: "Increase quantity",
    decreaseQuantity: "Decrease quantity",
    purchaseLimitReached: "You have reached the configured purchase limit for this product.",
    totalAmount: "Total to pay",
    unitPrice: "Unit price: {0} XOF",
    paymentBreakdown: "Payment breakdown",
    depositBalance: "Deposit balance",
    earningsBalance: "Earnings balance",
    loading: "Loading products",
    retry: "Try again",
  },
  ar: {
    ...PRODUCT_CARD_COPY.ar,
    tabs: ["الاستقرار", "العافية", "النشاط"],
    overview: "اكتشف منتجات DIAMANT الاستثمارية",
    investNow: "شراء",
    soldOut: "نفد المخزون",
    unavailable: "غير متاح",
    stabilityRequired: "يجب أن تمتلك منتج استقرار نشطًا قبل شراء منتج العافية أو النشاط.",
    stabilityRequiredButton: "الاستقرار مطلوب",
    vipRequired: "مطلوب VIP {level}",
    support: "الدعم",
    purchaseHint: "تُضاف أرباح المنتج تلقائيًا عند انتهاء الدورة. لا حاجة إلى التحصيل اليدوي.",
    multipleHint: "يمكنك شراء عدة منتجات لزيادة أرباحك.",
    purchaseLimit: "الحد الأقصى للمشتريات لكل مستخدم: {0}",
    unlimitedPurchases: "غير محدود",
    quantity: "الكمية",
    maxQuantity: "الحد الأقصى لهذا الطلب: {0}",
    increaseQuantity: "زيادة الكمية",
    decreaseQuantity: "تقليل الكمية",
    purchaseLimitReached: "لقد وصلت إلى حد الشراء المحدد لهذا المنتج.",
    totalAmount: "الإجمالي المطلوب",
    unitPrice: "سعر الوحدة: {0} XOF",
    paymentBreakdown: "تفاصيل الدفع",
    depositBalance: "رصيد الإيداعات",
    earningsBalance: "رصيد الأرباح",
    loading: "جارٍ تحميل المنتجات",
    retry: "إعادة المحاولة",
  },
  zh: {
    ...PRODUCT_CARD_COPY.zh,
    tabs: ["稳健", "健康", "活力"],
    overview: "探索 DIAMANT 投资产品",
    investNow: "购买",
    soldOut: "已售罄",
    unavailable: "暂不可用",
    stabilityRequired: "购买健康或活力产品前，您必须先拥有一个有效的稳健产品。",
    stabilityRequiredButton: "需要稳健产品",
    vipRequired: "需要 VIP {level}",
    support: "客服",
    purchaseHint: "产品周期结束时，收益将自动计入收益余额，无需手动领取。",
    multipleHint: "您可以购买多个产品以增加收益。",
    purchaseLimit: "每位用户最多购买：{0}",
    unlimitedPurchases: "不限",
    quantity: "数量",
    maxQuantity: "本次订单最多：{0}",
    increaseQuantity: "增加数量",
    decreaseQuantity: "减少数量",
    purchaseLimitReached: "您已达到此产品设置的购买上限。",
    totalAmount: "应付总额",
    unitPrice: "单价：{0} XOF",
    paymentBreakdown: "支付明细",
    depositBalance: "存款余额",
    earningsBalance: "收益余额",
    loading: "正在加载产品",
    retry: "重试",
  },
};

function formatXof(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
}

function safeXofCents(value: number): number | null {
  try {
    return amountToXofCents(value);
  } catch {
    return null;
  }
}

type ProductWithOwnership = Product & {
  isOwned?: boolean;
  ownedCount?: number;
  userHasActiveStabilityProduct?: boolean;
  userVipLevel?: number;
  vipLocked?: boolean;
};

export default function ProductsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [confirmProduct, setConfirmProduct] = useState<ProductWithOwnership | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState(0);
  const copy = INVEST_COPY[lang];

  const { data: products, isLoading: productsLoading, isError, refetch } = useQuery<ProductWithOwnership[]>({
    queryKey: ["/api/products"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      expectedUnitPriceCents,
    }: {
      productId: number;
      quantity: number;
      expectedUnitPriceCents: number;
    }) => {
      const response = await apiRequest("POST", `/api/products/${productId}/purchase`, {
        quantity,
        expectedUnitPriceCents,
      });
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
      setPurchaseQuantity(1);
      toast({ title: t.purchaseSuccess, description: t.purchaseSuccessDescription });
    },
    onError: (error: Error) => {
      setConfirmProduct(null);
      setPurchaseQuantity(1);
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const depositBalance = Number.isFinite(parseFloat(user.balance || "0")) ? parseFloat(user.balance || "0") : 0;
  const earningsBalance = Number.isFinite(parseFloat(user.totalEarnings || "0")) ? parseFloat(user.totalEarnings || "0") : 0;
  const depositBalanceCents = safeXofCents(Math.max(0, depositBalance)) ?? 0;
  const earningsBalanceCents = safeXofCents(Math.max(0, earningsBalance)) ?? 0;
  const availableBalanceCents = depositBalanceCents + earningsBalanceCents;
  const rawConfirmUnitPrice = Number(confirmProduct?.price);
  const confirmUnitPriceCentsValue = confirmProduct !== null &&
    Number.isFinite(rawConfirmUnitPrice) && rawConfirmUnitPrice >= 0
    ? safeXofCents(rawConfirmUnitPrice)
    : null;
  const confirmPriceIsValid = confirmUnitPriceCentsValue !== null;
  const confirmUnitPriceCents = confirmUnitPriceCentsValue ?? 0;
  const configuredPurchaseLimit = Math.max(0, Number(confirmProduct?.maxOwned) || 0);
  const activeOwnedCount = Math.max(0, Number(confirmProduct?.ownedCount) || 0);
  const remainingProductLimit = configuredPurchaseLimit > 0
    ? Math.max(0, configuredPurchaseLimit - activeOwnedCount)
    : null;
  const maxSelectableQuantity = confirmPriceIsValid
    ? getMaxAffordableProductQuantity({
      unitPriceCents: confirmUnitPriceCents,
      availableBalanceCents,
      remainingProductLimit,
    })
    : 0;
  const purchaseAllocation = confirmPriceIsValid
    ? calculatePurchaseDebitAllocation({
      unitPriceCents: confirmUnitPriceCents,
      quantity: purchaseQuantity,
      depositBalanceCents,
      earningsBalanceCents,
    })
    : null;
  const totalPurchaseCents = purchaseAllocation?.totalPriceCents ?? 0;
  const totalPurchase = totalPurchaseCents / 100;
  const insufficientAmountCents = purchaseAllocation?.shortfallCents ?? 0;
  const depositDebitCents = purchaseAllocation?.depositDebitCents ?? 0;
  const earningsDebitCents = purchaseAllocation?.earningsDebitCents ?? 0;
  const productLimitReached = remainingProductLimit === 0;
  const paidProducts = (products || []).filter((product) => !product.isFree);
  const selectedProductType = PRODUCT_TAB_TYPES[selectedTab] ?? PRODUCT_TAB_TYPES[0];
  const hasActiveStabilityProduct = products?.some((product) => product.userHasActiveStabilityProduct === true) ?? false;
  const stabilityPrerequisiteApplies = selectedProductType !== "stability" && !hasActiveStabilityProduct;
  const sectionProducts = paidProducts
    .filter((product) => normalizeProductType(product.productType) === selectedProductType)
    .sort((left, right) => selectedProductType === "wellness"
      ? (Number(left.requiredVipLevel) || 0) - (Number(right.requiredVipLevel) || 0)
      : 0);
  const productIndexes = new Map(paidProducts.map((product, index) => [product.id, index]));
  const getDisplayName = (product: Product) => rebrandText(product.name);
  const getProductImage = (product: Product) => getProductImageUrl(product.imageUrl);
  const confirmProductIndex = confirmProduct
    ? Math.max(0, sectionProducts.findIndex((product) => product.id === confirmProduct.id))
    : 0;
  const handleBuy = (product: ProductWithOwnership) => {
    setPurchaseQuantity(1);
    setConfirmProduct(product);
  };

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

          <section className="diamant-invest-list" aria-label={copy.overview}>
            {stabilityPrerequisiteApplies && !productsLoading && !isError && (
              <div className="diamant-invest-prerequisite" role="alert">
                <AlertTriangle size={19} aria-hidden="true" />
                <p>{copy.stabilityRequired}</p>
              </div>
            )}
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
            ) : sectionProducts.length === 0 ? (
              <div className="diamant-invest-state">
                <span className="diamant-invest-state__mark"><DiamantBrand markSize={34} showWordmark={false} /></span>
                <p>{t.noProducts}</p>
              </div>
            ) : (
              sectionProducts.map((product) => {
                const index = productIndexes.get(product.id) ?? 0;
                const isPending = purchaseMutation.isPending && purchaseMutation.variables?.productId === product.id;
                const stock = Math.min(100, Math.max(0, Number(product.stockPercentage) || 0));
                const isSoldOut = stock >= 100;
                const isUnavailable = !!product.isUnavailable;
                const requiredVipLevel = Number(product.requiredVipLevel) || 0;
                const vipLocked = normalizeProductType(product.productType) === "wellness" &&
                  (product.vipLocked ?? Number(product.userVipLevel ?? 0) < requiredVipLevel);
                const isBlocked = isSoldOut || isUnavailable || stabilityPrerequisiteApplies || vipLocked;
                const displayName = getDisplayName(product) || `${copy.tabs[2]} ${index + 1}`;
                const actionStatusLabel = isUnavailable
                  ? copy.unavailable
                  : isSoldOut
                    ? copy.soldOut
                    : stabilityPrerequisiteApplies
                      ? copy.stabilityRequiredButton
                      : vipLocked
                        ? copy.vipRequired.replace("{level}", String(requiredVipLevel))
                        : undefined;

                return (
                  <ProductCatalogCard
                    key={product.id}
                    product={product}
                    displayName={displayName}
                    labels={PRODUCT_CARD_COPY[lang]}
                    actionLabel={copy.investNow}
                    actionStatusLabel={actionStatusLabel}
                    actionAriaLabel={`${actionStatusLabel ?? copy.investNow}: ${displayName}`}
                    onAction={() => !isBlocked && handleBuy(product)}
                    disabled={purchaseMutation.isPending || isBlocked}
                    blocked={isBlocked}
                    pending={isPending}
                    rootTestId={`product-card-${product.id}`}
                    actionTestId={`button-purchase-${product.id}`}
                  />
                );
              })
            )}
          </section>
        </div>

        <FloatingSupport placement="home" />

        <Dialog
          open={!!confirmProduct}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmProduct(null);
              setPurchaseQuantity(1);
            }
          }}
        >
          {confirmProduct && (
            <DialogContent className="diamant-purchase-dialog">
              <DialogTitle className="sr-only">{t.investConfirmDesc} — {getDisplayName(confirmProduct)}</DialogTitle>
              <div className="diamant-purchase-dialog__visual">
                {getProductImage(confirmProduct) ? (
                  <img src={getProductImage(confirmProduct)!} alt={getDisplayName(confirmProduct)} />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/50" aria-label="Aucune image configurée">
                    <ImageIcon size={42} aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="diamant-purchase-dialog__body">
                <div className="diamant-purchase-dialog__heading">
                  <div><span>DIAMANT / {copy.totalAmount}</span><h2>{getDisplayName(confirmProduct)}</h2></div>
                  <strong data-testid="purchase-total">{formatXof(totalPurchase)}<small> XOF</small></strong>
                </div>
                <p className="diamant-purchase-dialog__hint">{copy.purchaseHint}</p>
                <p className="diamant-purchase-dialog__hint diamant-purchase-dialog__hint--subtle">
                  {copy.unitPrice.replace("{0}", formatXof(Number(confirmProduct.price)))}
                </p>
                <p className="diamant-purchase-dialog__hint diamant-purchase-dialog__hint--subtle">{copy.multipleHint}</p>
                <p
                  className="diamant-purchase-dialog__hint diamant-purchase-dialog__hint--subtle"
                  data-testid="purchase-limit"
                >
                  {copy.purchaseLimit.replace(
                    "{0}",
                    Number(confirmProduct.maxOwned) > 0
                      ? String(confirmProduct.maxOwned)
                      : copy.unlimitedPurchases,
                  )}
                </p>
                {maxSelectableQuantity > 0 && (
                  <div className="diamant-purchase-quantity" data-testid="purchase-quantity-control">
                    <div className="diamant-purchase-quantity__heading">
                      <span>{copy.quantity}</span>
                      <small>{copy.maxQuantity.replace("{0}", String(maxSelectableQuantity))}</small>
                    </div>
                    <div className="diamant-purchase-quantity__controls">
                      <button
                        type="button"
                        aria-label={copy.decreaseQuantity}
                        onClick={() => setPurchaseQuantity((quantity) => Math.max(1, quantity - 1))}
                        disabled={purchaseMutation.isPending || purchaseQuantity <= 1}
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <output aria-live="polite" data-testid="purchase-quantity-value">{purchaseQuantity}</output>
                      <button
                        type="button"
                        aria-label={copy.increaseQuantity}
                        onClick={() => setPurchaseQuantity((quantity) => Math.min(maxSelectableQuantity, quantity + 1))}
                        disabled={purchaseMutation.isPending || purchaseQuantity >= maxSelectableQuantity}
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
                {productLimitReached && (
                  <div className="diamant-purchase-alert" role="alert">
                    <AlertTriangle size={17} aria-hidden="true" />
                    <p>{copy.purchaseLimitReached}</p>
                  </div>
                )}
                {insufficientAmountCents > 0 && !productLimitReached && (
                  <div className="diamant-purchase-alert">
                    <AlertTriangle size={17} aria-hidden="true" />
                    <p>{t.investInsufficient.replace("{0}", `${formatXof(insufficientAmountCents / 100)} XOF`)}</p>
                  </div>
                )}
                <div className="diamant-payment-breakdown">
                  <p>{copy.paymentBreakdown}</p>
                  <div><span>{copy.depositBalance}</span><strong>−{formatXof(depositDebitCents / 100)} XOF</strong></div>
                  {earningsDebitCents > 0 && (
                    <div><span>{copy.earningsBalance}</span><strong>−{formatXof(earningsDebitCents / 100)} XOF</strong></div>
                  )}
                </div>
                <div className="diamant-purchase-stats">
                  {[
                    { value: `${confirmProduct.cycleDays} ${t.ordersDaysLbl}`, label: t.duration },
                    { value: `${formatXof(Number(confirmProduct.dailyEarnings) * purchaseQuantity)} XOF`, label: t.dailyRevenue },
                    { value: `${formatXof(Number(confirmProduct.totalReturn) * purchaseQuantity)} XOF`, label: t.totalRevenue },
                  ].map((stat) => (
                    <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>
                  ))}
                </div>
              </div>
              <div className="diamant-purchase-actions">
                <button type="button" onClick={() => { setConfirmProduct(null); setPurchaseQuantity(1); }} data-testid="button-cancel-purchase">{t.cancel}</button>
                <button
                  type="button"
                  onClick={() => purchaseMutation.mutate({
                    productId: confirmProduct.id,
                    quantity: purchaseQuantity,
                    expectedUnitPriceCents: confirmUnitPriceCents,
                  })}
                  disabled={
                    purchaseMutation.isPending ||
                    !confirmPriceIsValid ||
                    !purchaseAllocation ||
                    maxSelectableQuantity === 0 ||
                    purchaseQuantity > maxSelectableQuantity ||
                    purchaseAllocation.shortfallCents > 0
                  }
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