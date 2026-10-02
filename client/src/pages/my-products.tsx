import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Loader2 } from "lucide-react";
import { getProductVisual } from "@/lib/product-visuals";
import { localeForLang, useI18n } from "@/lib/i18n";
import { rebrandText } from "@/lib/content";
import { DiamantBrand } from "@/components/diamant-brand";

const MEMBER_ACCENT = "#00c83c";
function EmptyProductsIllustration() {
  return (
    <svg width="210" height="170" viewBox="0 0 210 170" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="empty-silver" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#f5f5f5" />
          <stop offset="1" stopColor="#969696" />
        </linearGradient>
      </defs>
      <path d="M18 103h42v-50H18v50Z" fill="url(#empty-silver)" />
      <path d="M145 103h40V24h-40v79Z" fill="url(#empty-silver)" />
      <path d="M184 103h19V43h-19v60Z" fill="url(#empty-silver)" />
      <rect x="63" y="23" width="85" height="99" rx="2" fill="#fafafa" />
      <rect x="71" y="32" width="69" height="69" rx="2" fill="#fff" />
      <rect x="85" y="45" width="41" height="6" rx="2" fill="#e6e8eb" />
      <rect x="85" y="62" width="41" height="6" rx="2" fill="#e6e8eb" />
      <rect x="85" y="79" width="41" height="6" rx="2" fill="#e6e8eb" />
      <rect x="51" y="101" width="111" height="36" fill="#ebedf0" />
      <rect x="90" y="114" width="35" height="7" rx="2" fill="#fff" />
      <path d="M39 29c7-11 25-5 23 7-2 9-14 8-23 8-10 0-13-9 0-15Z" fill="url(#empty-silver)" />
      <path d="M127 10c13-20 43-7 39 13-3 14-22 12-39 12-17 0-22-15 0-25Z" fill="url(#empty-silver)" />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[15px] leading-6">
      <span className="text-white/90">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

function getDisplayName(name: string | undefined, index: number) {
  const value = rebrandText(name || `DIAMANT GreenRide ${index + 1}`);
  const vipMatch = value.match(/^VIP\s*(\d+)$/i);
  return vipMatch ? `VIP${vipMatch[1]} DIAMANT GreenRide` : value;
}

function PageHeader() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  return (
    <>
      <header className="flex h-[80px] items-center border-b border-[#e5e5e5] bg-white px-5">
        <button onClick={() => navigate("/invest")} className="w-12 active:opacity-60" aria-label={t.back}>
          <ChevronLeft size={34} strokeWidth={1.8} />
        </button>
        <div className="flex flex-1 items-center justify-center">
          <DiamantBrand variant="on-dark" markSize={24} className="text-[12px]" />
        </div>
        <Link href="/earnings" className="ielp-member-products-link w-[142px] text-center font-medium active:opacity-60" style={{ color: MEMBER_ACCENT, fontSize: 19 }}>
          {t.earnings}
        </Link>
      </header>
      <div className="flex h-[52px] items-center gap-3 bg-[#f1f2f4] px-7 text-[#5b616a]">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#626975] text-[10px] font-bold text-white">i</span>
        <div style={{ fontSize: 12, lineHeight: 1.55 }}>
          <p>{t.myProductsSettledEvery24h}</p>
        </div>
      </div>
    </>
  );
}

export default function MyProductsPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { data: userProducts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
    refetchInterval: 60_000,
  });

  if (!user) return null;

  const totalEarned = userProducts.reduce((sum: number, item: any) => sum + Number(item.totalEarned || 0), 0);
  return (
    <main className="flex min-h-screen flex-col bg-black">
      <PageHeader />
      <section className="flex flex-1 flex-col bg-black pb-20">
        <div className="pt-3 text-center text-white">
          <p className="font-semibold" style={{ fontSize: 42, lineHeight: 1.1 }}>XOF {totalEarned.toLocaleString(localeForLang(lang))}</p>
          <p className="ielp-products-accent mt-3" style={{ color: MEMBER_ACCENT, fontSize: 16 }}>{t.totalRevenue}</p>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>
        ) : userProducts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center pt-28 text-center">
            <EmptyProductsIllustration />
            <p className="mt-7 max-w-[230px]" style={{ color: "#a5a5a5", fontSize: 18, lineHeight: 1.45 }}>
              {t.myProductsNone}
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-4 pb-6 pt-8">
            {userProducts.map((userProduct: any, index) => {
              const product = userProduct.product || {};
              const cycleDays = Number(product.cycleDays || 0);
              const daysRemaining = Number(userProduct.daysRemaining || 0);
              const completedDays = Math.max(0, cycleDays - daysRemaining);
              const progress = cycleDays > 0 ? Math.min(100, Math.round((completedDays / cycleDays) * 100)) : 0;
              const earned = Number(userProduct.totalEarned || 0);
              const image = getProductVisual(product.imageUrl, index);
              const displayName = getDisplayName(product.name, index);

              return (
                <article
                  key={userProduct.id}
                  className="relative min-h-[326px] overflow-hidden border-b-[6px] border-black bg-[#202020]"
                  data-testid={`product-card-${userProduct.id}`}
                >
                  <img
                    src={image}
                    alt={displayName}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: "center 54%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
                  <div className="relative z-10 min-h-[320px] px-5 pb-5 pt-6 text-white">
                    <h2 className="font-semibold" style={{ fontSize: 27, lineHeight: 1.15 }}>{displayName}</h2>
                    <div className="mt-4 w-[82%] max-w-[350px] bg-black/50 px-2.5 py-2.5">
                      <InfoRow label={`${t.price}:`} value={`XOF ${Number(product.price || 0).toLocaleString(localeForLang(lang))}`} />
                      <InfoRow label={`${t.duration}:`} value={`${cycleDays} ${t.myProductsDays}`} />
                      <InfoRow label={`${t.dailyRevenue}:`} value={`XOF ${Number(product.dailyEarnings || 0).toLocaleString(localeForLang(lang))}`} />
                      <InfoRow label={`${t.totalRevenue}:`} value={`XOF ${Number(product.totalReturn || 0).toLocaleString(localeForLang(lang))}`} />
                      <InfoRow label={`${t.myProductsRevenueReceived}:`} value={`XOF ${earned.toLocaleString(localeForLang(lang))}`} />
                    </div>
                    <div className="mt-3 h-1.5 w-[82%] max-w-[350px] overflow-hidden rounded-full bg-white/25">
                      <div className="ielp-member-products-progress h-full rounded-full" style={{ width: `${progress}%`, background: MEMBER_ACCENT }} />
                    </div>
                    <p className="mt-1 text-xs text-white/75">{completedDays}/{cycleDays} {t.myProductsProgress}</p>
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