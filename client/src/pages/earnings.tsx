import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronLeft, CreditCard, Loader2, Package, TrendingUp, UsersRound, Wifi } from "lucide-react";
import { localeForLang, useI18n, type Lang } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getProductVisual } from "@/lib/product-visuals";
import { rebrandText } from "@/lib/content";
import { DiamantBrand } from "@/components/diamant-brand";

const MEMBER_ACCENT = "#00c83c";
type IncomeSummary = { productEarnings: number; teamEarnings: number };

const BALANCE_COPY: Record<Lang, {
  title: string;
  deposits: string;
  earnings: string;
  summaryTitle: string;
  combinedTotal: string;
  productIncome: string;
  teamIncome: string;
  summaryUnavailable: string;
}> = {
  fr: {
    title: "Mes soldes",
    deposits: "Solde des dépôts",
    earnings: "Solde des gains",
    summaryTitle: "Récapitulatif des revenus et gains",
    combinedTotal: "Total produits + équipe",
    productIncome: "Revenus reçus des produits",
    teamIncome: "Gains générés par l’équipe",
    summaryUnavailable: "Récapitulatif indisponible pour le moment.",
  },
  en: {
    title: "My balances",
    deposits: "Deposit balance",
    earnings: "Earnings balance",
    summaryTitle: "Income and earnings summary",
    combinedTotal: "Products + team total",
    productIncome: "Product earnings received",
    teamIncome: "Team-generated earnings",
    summaryUnavailable: "Summary is temporarily unavailable.",
  },
  ar: {
    title: "أرصدتي",
    deposits: "رصيد الإيداعات",
    earnings: "رصيد الأرباح",
    summaryTitle: "ملخص الإيرادات والأرباح",
    combinedTotal: "إجمالي المنتجات والفريق",
    productIncome: "إيرادات المنتجات المستلمة",
    teamIncome: "أرباح الفريق",
    summaryUnavailable: "الملخص غير متاح مؤقتًا.",
  },
  zh: {
    title: "我的余额",
    deposits: "存款余额",
    earnings: "收益余额",
    summaryTitle: "收入与收益汇总",
    combinedTotal: "产品与团队总额",
    productIncome: "已收到的产品收益",
    teamIncome: "团队产生的收益",
    summaryUnavailable: "暂时无法获取汇总。",
  },
};

function EmptyEarningsIllustration() {
  return (
    <svg width="210" height="170" viewBox="0 0 210 170" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="earnings-silver" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#f5f5f5" />
          <stop offset="1" stopColor="#969696" />
        </linearGradient>
      </defs>
      <path d="M18 103h42v-50H18v50Z" fill="url(#earnings-silver)" />
      <path d="M145 103h40V24h-40v79Z" fill="url(#earnings-silver)" />
      <path d="M184 103h19V43h-19v60Z" fill="url(#earnings-silver)" />
      <rect x="63" y="23" width="85" height="99" rx="2" fill="#fafafa" />
      <rect x="71" y="32" width="69" height="69" rx="2" fill="#fff" />
      <rect x="85" y="45" width="41" height="6" rx="2" fill="#e6e8eb" />
      <rect x="85" y="62" width="41" height="6" rx="2" fill="#e6e8eb" />
      <rect x="85" y="79" width="41" height="6" rx="2" fill="#e6e8eb" />
      <rect x="51" y="101" width="111" height="36" fill="#ebedf0" />
      <rect x="90" y="114" width="35" height="7" rx="2" fill="#fff" />
      <path d="M39 29c7-11 25-5 23 7-2 9-14 8-23 8-10 0-13-9 0-15Z" fill="url(#earnings-silver)" />
      <path d="M127 10c13-20 43-7 39 13-3 14-22 12-39 12-17 0-22-15 0-25Z" fill="url(#earnings-silver)" />
    </svg>
  );
}

export default function EarningsPage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();
  const balanceCopy = BALANCE_COPY[lang];
  const { toast } = useToast();
  const [collectingId, setCollectingId] = useState<number | null>(null);
  const { data: userProducts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/user/products"] });
  const incomeSummaryQuery = useQuery<IncomeSummary>({
    queryKey: ["/api/user/income-summary"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const collectMutation = useMutation({
    mutationFn: async (userProductId: number) => {
      const response = await apiRequest("POST", "/api/user/collect-earnings", { userProductId });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t.errorOccurred);
      return data;
    },
    onMutate: (userProductId) => setCollectingId(userProductId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/income-summary"] });
      refreshUser();
      toast({
        title: t.rewardsSuccessTitle,
        description: `${Number(data.collected).toLocaleString(localeForLang(lang))} XOF ${t.rewardsReceived.toLowerCase()}.`,
      });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
    onSettled: () => setCollectingId(null),
  });

  if (!user) return null;

  const totalEarnings = Number.isFinite(Number(user.totalEarnings)) ? Number(user.totalEarnings) : 0;
  const depositBalance = Number.isFinite(Number(user.balance)) ? Number(user.balance) : 0;
  const hasProducts = userProducts.length > 0;
  const pendingTotal = userProducts.reduce((sum: number, item: any) => sum + Number(item.pendingEarnings || 0), 0);
  const productIncome = Number.isFinite(Number(incomeSummaryQuery.data?.productEarnings))
    ? Number(incomeSummaryQuery.data?.productEarnings)
    : 0;
  const teamIncome = Number.isFinite(Number(incomeSummaryQuery.data?.teamEarnings))
    ? Number(incomeSummaryQuery.data?.teamEarnings)
    : 0;
  const formatSummaryAmount = (amount: number) => {
    if (incomeSummaryQuery.isLoading) return "…";
    if (incomeSummaryQuery.isError) return "—";
    return `XOF ${amount.toLocaleString(localeForLang(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const balanceCards = [
    { id: "deposits", label: balanceCopy.deposits, amount: depositBalance, currency: "XOF" },
    { id: "earnings", label: balanceCopy.earnings, amount: totalEarnings, currency: "XOF" },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-black">
      <header className="flex h-[80px] items-center border-b border-[#e5e5e5] bg-white px-5">
        <button onClick={() => navigate("/invest")} className="w-12 active:opacity-60" aria-label={t.back}>
          <ChevronLeft size={34} strokeWidth={1.8} />
        </button>
        <div className="flex flex-1 items-center justify-center">
          <DiamantBrand variant="on-dark" markSize={24} className="text-[12px]" />
        </div>
        <Link href="/my-products" className="ielp-member-products-link w-[142px] text-center font-medium active:opacity-60" style={{ color: MEMBER_ACCENT, fontSize: 19 }}>
          {t.myProductsTitle}
        </Link>
      </header>
      <section className="flex flex-1 flex-col bg-black pb-20">
        <div className="px-5 pt-4 text-white">
          <h1 className="mb-3 text-center text-base font-semibold">{balanceCopy.title}</h1>
          <div className="space-y-4">
            {balanceCards.map((card) => (
              <article
                key={card.id}
                aria-label={`${card.label}: ${card.currency} ${card.amount.toLocaleString(localeForLang(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="relative block h-[256px] w-full overflow-hidden rounded-[20px] text-left text-white shadow-[0_12px_20px_rgba(0,76,43,0.26)]"
                style={{ background: "linear-gradient(126deg, #063d2b 0%, #087a38 46%, #00b85a 100%)" }}
                data-testid={`balance-card-${card.id}`}
              >
                <div className="absolute -left-12 -top-20 h-80 w-20 rotate-[-18deg] bg-white/[0.12]" />
                <div className="absolute left-[23%] -top-10 h-80 w-10 rotate-[-18deg] bg-white/[0.10]" />
                <div className="absolute right-[11%] -top-12 h-80 w-10 rotate-[-18deg] bg-white/[0.09]" />
                <div className="absolute left-5 top-5 flex items-center gap-2 text-[13px] font-semibold tracking-[.12em] text-white/90">
                  <CreditCard className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
                  DIAMANT
                </div>
                <p className="absolute left-[14px] top-[108px] max-w-[82%] break-all text-[23px] font-semibold leading-[28px] tracking-[.01em]">
                  {card.currency} {card.amount.toLocaleString(localeForLang(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="absolute bottom-[35px] right-[39px] h-[47px] w-[70px] rounded-[9px] border border-white/45 bg-[linear-gradient(135deg,#fbf5cf,#c7b16b)] shadow-inner">
                  <div className="absolute inset-x-0 top-[15px] border-t border-[#9d8440]/40" />
                  <div className="absolute inset-x-0 top-[30px] border-t border-[#9d8440]/40" />
                  <div className="absolute bottom-0 left-[25px] top-0 border-l border-[#9d8440]/35" />
                </div>
                <div className="absolute bottom-5 left-5 flex max-w-[68%] items-center gap-2 truncate text-[12px] text-white/75">
                  <Wifi className="h-4 w-4 shrink-0 rotate-90" aria-hidden="true" />
                  <span className="truncate">{card.label}</span>
                </div>
              </article>
            ))}
          </div>
          <article
            className="mt-4 rounded-[20px] border border-white/10 bg-[#171717] p-4 text-white shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
            aria-label={balanceCopy.summaryTitle}
            data-testid="income-summary-card"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#00c83c]/15 text-[#00c83c]">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-semibold">{balanceCopy.summaryTitle}</h2>
            </div>
            <div className="mt-4 rounded-xl bg-white/[0.055] p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/55">{balanceCopy.combinedTotal}</p>
              <p className="mt-1 text-xl font-bold text-[#00c83c]" data-testid="income-summary-total">
                {formatSummaryAmount(productIncome + teamIncome)}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="min-w-0 rounded-xl bg-white/[0.04] p-3">
                <div className="flex min-h-8 items-start gap-2 text-[11px] leading-4 text-white/65">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-[#00c83c]" aria-hidden="true" />
                  <span>{balanceCopy.productIncome}</span>
                </div>
                <p className="mt-2 break-words text-sm font-semibold" data-testid="income-summary-products">
                  {formatSummaryAmount(productIncome)}
                </p>
              </div>
              <div className="min-w-0 rounded-xl bg-white/[0.04] p-3">
                <div className="flex min-h-8 items-start gap-2 text-[11px] leading-4 text-white/65">
                  <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-[#00c83c]" aria-hidden="true" />
                  <span>{balanceCopy.teamIncome}</span>
                </div>
                <p className="mt-2 break-words text-sm font-semibold" data-testid="income-summary-team">
                  {formatSummaryAmount(teamIncome)}
                </p>
              </div>
            </div>
            {incomeSummaryQuery.isError && (
              <p className="mt-3 text-xs text-amber-200" role="alert">{balanceCopy.summaryUnavailable}</p>
            )}
          </article>
          {pendingTotal > 0 && (
            <p className="mt-3 text-center text-sm text-white/70">
              {t.myProductsPending}: XOF {pendingTotal.toLocaleString(localeForLang(lang))}
            </p>
          )}
        </div>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
        ) : !hasProducts ? (
          <div className="flex flex-1 flex-col items-center pt-28 text-center">
            <EmptyEarningsIllustration />
            <p className="mt-7 max-w-[230px]" style={{ color: "#a5a5a5", fontSize: 18, lineHeight: 1.45 }}>
              {t.myProductsNone}
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-5 pt-8">
            {userProducts.map((item: any, index: number) => {
              const product = item.product || {};
              const pending = Number(item.pendingEarnings || 0);
              const totalEarned = Number(item.totalEarned || 0);
              const isReady = pending > 0;
              const isCollecting = collectingId === item.id && collectMutation.isPending;

              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#171717] text-white">
                  <div className="flex gap-3 p-3">
                    <img
                      src={getProductVisual(product.imageUrl, index)}
                      alt={rebrandText(product.name || "Produit DIAMANT")}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{rebrandText(product.name || "Produit DIAMANT")}</p>
                      <p className="mt-1 text-xs text-white/60">
                        {t.dailyRevenue}: XOF {Number(product.dailyEarnings || 0).toLocaleString(localeForLang(lang))}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        {t.myProductsEarned}: XOF {totalEarned.toLocaleString(localeForLang(lang))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-xs text-white/60">{t.myProductsPending}</p>
                      <p className="font-semibold" style={{ color: isReady ? MEMBER_ACCENT : "#a5a5a5" }}>
                        XOF {pending.toLocaleString(localeForLang(lang))}
                      </p>
                      {!isReady && item.isActive && item.nextCollectionAt && !Number.isNaN(new Date(item.nextCollectionAt).getTime()) && (
                        <p className="mt-1 text-[11px] text-white/45">
                          {t.myProductsNextCollection}: {new Date(item.nextCollectionAt).toLocaleString(localeForLang(lang), { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => collectMutation.mutate(item.id)}
                      disabled={!isReady || collectMutation.isPending}
                      className="flex min-w-[132px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                      style={{ background: isReady ? MEMBER_ACCENT : "#555" }}
                      data-testid={`button-collect-earnings-${item.id}`}
                    >
                      {isCollecting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isReady ? t.myProductsCollect : t.myProductsNextCollection}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}