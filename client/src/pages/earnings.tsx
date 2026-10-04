import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronLeft, CreditCard, Package, UsersRound, Wifi } from "lucide-react";
import { localeForLang, useI18n, type Lang } from "@/lib/i18n";
import { DiamantBrand } from "@/components/diamant-brand";

const MEMBER_ACCENT = "#00c83c";
const BALANCE_CARD_CLASS_NAME =
  "relative block h-[256px] w-full overflow-hidden rounded-[20px] text-left text-white shadow-[0_12px_20px_rgba(0,76,43,0.26)]";
const BALANCE_CARD_STYLE = {
  background: "linear-gradient(135deg, #07113a 0%, #08285f 55%, #075486 100%)",
} as const;
type IncomeSummary = { productEarnings: number; teamEarnings: number };

const BALANCE_COPY: Record<Lang, {
  title: string;
  deposits: string;
  earnings: string;
  summaryTitle: string;
  combinedTotal: string;
  productShort: string;
  teamShort: string;
  summaryUnavailable: string;
}> = {
  fr: {
    title: "Mes soldes",
    deposits: "Solde des dépôts",
    earnings: "Solde des gains",
    summaryTitle: "Récapitulatif des revenus et gains",
    combinedTotal: "Total produits + équipe",
    productShort: "Gains produits",
    teamShort: "Gains équipe",
    summaryUnavailable: "Récapitulatif indisponible pour le moment.",
  },
  en: {
    title: "My balances",
    deposits: "Deposit balance",
    earnings: "Earnings balance",
    summaryTitle: "Income and earnings summary",
    combinedTotal: "Products + team total",
    productShort: "Product earnings",
    teamShort: "Team earnings",
    summaryUnavailable: "Summary is temporarily unavailable.",
  },
  ar: {
    title: "أرصدتي",
    deposits: "رصيد الإيداعات",
    earnings: "رصيد الأرباح",
    summaryTitle: "ملخص الإيرادات والأرباح",
    combinedTotal: "إجمالي المنتجات والفريق",
    productShort: "أرباح المنتجات",
    teamShort: "أرباح الفريق",
    summaryUnavailable: "الملخص غير متاح مؤقتًا.",
  },
  zh: {
    title: "我的余额",
    deposits: "存款余额",
    earnings: "收益余额",
    summaryTitle: "收入与收益汇总",
    combinedTotal: "产品与团队总额",
    productShort: "产品收益",
    teamShort: "团队收益",
    summaryUnavailable: "暂时无法获取汇总。",
  },
};

export default function EarningsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t, lang } = useI18n();
  const balanceCopy = BALANCE_COPY[lang];
  const incomeSummaryQuery = useQuery<IncomeSummary>({
    queryKey: ["/api/user/income-summary"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });

  if (!user) return null;

  const totalEarnings = Number.isFinite(Number(user.totalEarnings)) ? Number(user.totalEarnings) : 0;
  const depositBalance = Number.isFinite(Number(user.balance)) ? Number(user.balance) : 0;
  const productIncome = Number.isFinite(Number(incomeSummaryQuery.data?.productEarnings))
    ? Number(incomeSummaryQuery.data?.productEarnings)
    : 0;
  const teamIncome = Number.isFinite(Number(incomeSummaryQuery.data?.teamEarnings))
    ? Number(incomeSummaryQuery.data?.teamEarnings)
    : 0;
  const formatSummaryValue = (amount: number) => {
    if (incomeSummaryQuery.isLoading) return "…";
    if (incomeSummaryQuery.isError) return "—";
    return amount.toLocaleString(localeForLang(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatSummaryAmount = (amount: number) => {
    const value = formatSummaryValue(amount);
    return value === "…" || value === "—" ? value : `XOF ${value}`;
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
        <Link href="/orders" className="ielp-member-products-link w-[142px] text-center font-medium active:opacity-60" style={{ color: MEMBER_ACCENT, fontSize: 19 }}>
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
                className={BALANCE_CARD_CLASS_NAME}
                style={BALANCE_CARD_STYLE}
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
            <article
              className={BALANCE_CARD_CLASS_NAME}
              style={BALANCE_CARD_STYLE}
              aria-label={balanceCopy.summaryTitle}
              data-testid="income-summary-card"
            >
              <div className="absolute -left-12 -top-20 h-80 w-20 rotate-[-18deg] bg-white/[0.12]" />
              <div className="absolute left-[23%] -top-10 h-80 w-10 rotate-[-18deg] bg-white/[0.10]" />
              <div className="absolute right-[11%] -top-12 h-80 w-10 rotate-[-18deg] bg-white/[0.09]" />
              <div className="absolute left-5 top-5 flex items-center gap-2 text-[13px] font-semibold tracking-[.12em] text-white/90">
                <CreditCard className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
                DIAMANT
              </div>
              <div className="absolute left-[14px] top-[66px] flex items-center gap-1.5 text-[10px] leading-4 text-white/75">
                <Wifi className="h-4 w-4 shrink-0 rotate-90" aria-hidden="true" />
                <span>{balanceCopy.combinedTotal}</span>
              </div>
              <p className="absolute left-[14px] top-[84px] max-w-[82%] break-all text-[23px] font-semibold leading-[28px] tracking-[.01em]" data-testid="income-summary-total">
                {formatSummaryAmount(productIncome + teamIncome)}
              </p>
              <div className="absolute left-[14px] top-[128px] flex w-[calc(100%_-_128px)] flex-col gap-1.5">
                <div className="border-b border-white/25 pb-1">
                  <p className="flex items-center gap-1.5 text-[10px] leading-4 text-white/85">
                    <Package className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{balanceCopy.productShort}</span>
                  </p>
                  <p className="break-all pl-5 text-[23px] font-semibold leading-[28px] tracking-[.01em] tabular-nums" data-testid="income-summary-products">
                    {formatSummaryAmount(productIncome)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] leading-4 text-white/85">
                    <UsersRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{balanceCopy.teamShort}</span>
                  </p>
                  <p className="break-all pl-5 text-[23px] font-semibold leading-[28px] tracking-[.01em] tabular-nums" data-testid="income-summary-team">
                    {formatSummaryAmount(teamIncome)}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-[35px] right-[39px] h-[47px] w-[70px] rounded-[9px] border border-white/45 bg-[linear-gradient(135deg,#fbf5cf,#c7b16b)] shadow-inner">
                <div className="absolute inset-x-0 top-[15px] border-t border-[#9d8440]/40" />
                <div className="absolute inset-x-0 top-[30px] border-t border-[#9d8440]/40" />
                <div className="absolute bottom-0 left-[25px] top-0 border-l border-[#9d8440]/35" />
              </div>
            </article>
          </div>
          {incomeSummaryQuery.isError && (
            <p className="mt-2 text-center text-xs text-amber-200" role="alert">{balanceCopy.summaryUnavailable}</p>
          )}
        </div>
      </section>
    </main>
  );
}