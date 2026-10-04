import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getContent } from "@/lib/content";
import { localeForLang, useI18n } from "@/lib/i18n";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import checkinBanner from "@/assets/images/diamant-checkin-orange-banner.png";
import checkinBannerArt from "@/assets/images/diamant-checkin-banner-art.png";
import checkinCoin from "@/assets/images/diamant-checkin-coin-reference.png";

interface BonusStatus {
  canClaim: boolean;
  hoursRemaining: number;
  totalBonusClaimed: number;
  daysPointed: number;
  checkinHistory: Array<{
    claimedAt: string;
    amount: number;
  }>;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatReward(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function CheckinPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const locale = localeForLang(lang);
  const isFrench = lang.toLowerCase().startsWith("fr");

  const { data: bonusStatus, isLoading: bonusStatusLoading } = useQuery<BonusStatus>({
    queryKey: ["/api/daily-bonus-status"],
    refetchInterval: 60000,
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const claimMutation = useMutation<{ message?: string }>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/claim-daily-bonus", {});
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t.errorOccurred);
      }
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus-status"] });
      await refreshUser();
      toast({
        title: t.checkinBonusTitle,
        description: data.message || t.checkinBonusDesc,
      });
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  const currency = "XOF";
  const totalBonusClaimed = bonusStatus?.totalBonusClaimed ?? 0;
  const daysPointed = bonusStatus?.daysPointed ?? 0;
  const checkinsByDay = useMemo(() => {
    const history = new Map<string, number>();

    for (const entry of bonusStatus?.checkinHistory ?? []) {
      const claimedAt = new Date(entry.claimedAt);
      if (Number.isNaN(claimedAt.getTime())) continue;
      const key = dateKey(claimedAt);
      history.set(key, (history.get(key) ?? 0) + (Number(entry.amount) || 0));
    }

    return history;
  }, [bonusStatus?.checkinHistory]);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const headerTitle = t.checkinHeading;
  const streakLabel = getContent(settings, "content_checkin_streakLabel", "Jours de connexion");
  const totalLabel = getContent(settings, "content_checkin_totalLabel", "Profit capturé");

  if (!user) return null;

  return (
    <main
      className="ielp-checkin-page min-h-screen w-full"
      style={{ maxWidth: 480, margin: "0 auto", background: "#f4f4f4", color: "#2b2b2b" }}
    >
      <header
        className="ielp-checkin-hero relative w-full overflow-hidden"
        style={{
          aspectRatio: "576 / 310",
          background: "linear-gradient(90deg, #fea901 0%, #fe9216 50%, #fe7129 100%)",
        }}
      >
        {isFrench ? (
          <img
            src={checkinBanner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: "fill" }}
          />
        ) : (
          <>
            <img
              src={checkinBannerArt}
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-0 w-full"
            />
            <h1
              className="ielp-checkin-title absolute font-semibold"
              style={{
                left: "21.2%",
                top: "13.2%",
                margin: 0,
                color: "#fff6dd",
                fontSize: "clamp(16px, 4.85vw, 25px)",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              {headerTitle}
            </h1>
          </>
        )}

        {isFrench && <h1 className="sr-only">{headerTitle}</h1>}

        <Link href="/account">
          <button
            type="button"
            className="absolute flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{
              left: "3.5%",
              top: "8%",
              width: "11%",
              height: "20%",
              color: "#fff7db",
              background: isFrench ? "transparent" : "rgba(255,255,255,.12)",
            }}
            data-testid="button-back"
            aria-label={isFrench ? "Retour" : "Back"}
          >
            {isFrench ? <span className="sr-only">Retour</span> : <ChevronLeft size={23} strokeWidth={2.2} />}
          </button>
        </Link>
      </header>

      <section
        className="ielp-checkin-stat grid items-center"
        style={{
          width: "92%",
          height: 76,
          margin: "9px auto 0",
          padding: "6px 9px",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1.15fr) 64px",
          gap: 4,
          border: 0,
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,.035)",
        }}
      >
        <div className="min-w-0 text-center">
          <p
            className="ielp-checkin-balance m-0 whitespace-nowrap font-semibold"
            style={{ fontSize: "clamp(15px, 3.9vw, 19px)", lineHeight: 1.05 }}
          >
            {daysPointed.toLocaleString(locale)}
          </p>
          <p
            className="ielp-checkin-caption m-0 mt-1 whitespace-nowrap"
            style={{ color: "#858585", fontSize: "clamp(9px, 3vw, 15px)", lineHeight: 1.15 }}
          >
            {streakLabel}
          </p>
        </div>

        <div className="min-w-0 text-center">
          <p
            className="ielp-checkin-balance m-0 whitespace-nowrap font-semibold"
            style={{ fontSize: "clamp(13px, 3.8vw, 18px)", lineHeight: 1.05 }}
          >
            FCFA{formatReward(totalBonusClaimed, locale)}
          </p>
          <p
            className="ielp-checkin-caption m-0 mt-1 whitespace-nowrap"
            style={{ color: "#858585", fontSize: "clamp(9px, 3vw, 15px)", lineHeight: 1.15 }}
          >
            {totalLabel}
          </p>
        </div>

        {!bonusStatus || bonusStatusLoading ? (
          <button
            type="button"
            disabled
            className="flex h-8 w-full items-center justify-center rounded-full text-white"
            style={{ background: "#c9c9c9" }}
            aria-label={t.loading}
          >
            <Loader2 size={17} className="animate-spin" />
          </button>
        ) : bonusStatus.canClaim ? (
          <button
            type="button"
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            className="flex h-8 w-full items-center justify-center rounded-full font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-60"
            style={{
              background: "linear-gradient(110deg, #f7a400, #f47a19)",
              boxShadow: "0 2px 5px rgba(211,113,18,.17)",
              fontSize: 14,
            }}
            data-testid="button-pointer"
            aria-label={t.checkinBtn}
          >
            {claimMutation.isPending ? (
              <Loader2 size={17} className="animate-spin" />
            ) : isFrench ? (
              "Se"
            ) : (
              t.checkinBtn
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-8 w-full items-center justify-center rounded-full px-1 text-center"
            style={{ background: "#eeeeee", color: "#777777", fontSize: 9, lineHeight: 1.1 }}
            data-testid="button-pointer-disabled"
          >
            {t.checkinComeBack.replace("{0}", String(bonusStatus.hoursRemaining))}
          </button>
        )}
      </section>

      <section
        className="ielp-checkin-calendar"
        style={{ width: "92%", margin: "5px auto 0", paddingBottom: 18 }}
      >
        <div
          style={{
            padding: "14px 14px 16px",
            borderRadius: 14,
            background: "#ffffff",
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 8,
            }}
            role="list"
            aria-label={t.checkinCalendarTitle}
          >
            {days.map((day) => {
              const dayDate = new Date(now.getFullYear(), now.getMonth(), day);
              const amount = checkinsByDay.get(dateKey(dayDate));
              const isClaimed = amount !== undefined;
              const displayDate = `${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              return (
                <div
                  key={day}
                  role="listitem"
                  aria-label={`${displayDate}: ${isClaimed ? `${t.checkinDayClaimed}, ${formatReward(amount, locale)} ${currency}` : t.checkinDayNotClaimed}`}
                  className="flex min-w-0 flex-col items-center justify-between"
                  style={{
                    height: 101,
                    padding: "10px 2px 8px",
                    borderRadius: 11,
                    background: "#f2f2f2",
                  }}
                  data-testid={`checkin-day-${day}`}
                  data-claimed={isClaimed}
                >
                  <span style={{ color: "#858585", fontSize: 14, lineHeight: 1.1 }}>
                    {displayDate}
                  </span>
                  <span
                    className="whitespace-nowrap font-medium"
                    style={{ color: "#777777", fontSize: 15, lineHeight: 1.1 }}
                  >
                    {isClaimed ? formatReward(amount, locale) : "—"}
                  </span>
                  <img
                    src={checkinCoin}
                    alt=""
                    aria-hidden="true"
                    width={28}
                    height={28}
                    style={{
                      width: 28,
                      height: 28,
                      objectFit: "contain",
                      filter: isClaimed ? "none" : "grayscale(1) opacity(.55)",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}