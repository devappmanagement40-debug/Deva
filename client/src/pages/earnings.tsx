import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Loader2 } from "lucide-react";
import { localeForLang, useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getProductVisual } from "@/lib/product-visuals";
import { rebrandText } from "@/lib/content";
import { DiamantBrand } from "@/components/diamant-brand";

const MEMBER_ACCENT = "#00c83c";

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
  const { toast } = useToast();
  const [collectingId, setCollectingId] = useState<number | null>(null);
  const { data: userProducts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/user/products"] });

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
  const hasProducts = userProducts.length > 0;
  const pendingTotal = userProducts.reduce((sum: number, item: any) => sum + Number(item.pendingEarnings || 0), 0);

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
      <div className="flex h-[52px] items-center gap-3 bg-[#f1f2f4] px-7 text-[#5b616a]">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#626975] text-[10px] font-bold text-white">i</span>
        <div style={{ fontSize: 12, lineHeight: 1.55 }}>
          <p>{t.myProductsSettledEvery24h}</p>
          <p>{t.purchaseSuccessDescription}</p>
        </div>
      </div>
      <section className="flex flex-1 flex-col bg-black pb-20">
        <div className="pt-3 text-center text-white">
          <p className="font-semibold" style={{ fontSize: 42, lineHeight: 1.1 }}>XOF {totalEarnings.toLocaleString(localeForLang(lang))}</p>
          <p className="ielp-products-accent mt-3" style={{ color: MEMBER_ACCENT, fontSize: 16 }}>{t.totalRevenue}</p>
          {pendingTotal > 0 && (
            <p className="mt-2 text-sm text-white/70">
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