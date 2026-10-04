import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getContent } from "@/lib/content";
import { localeForLang, useI18n } from "@/lib/i18n";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import checkinHeroArt from "@assets/generated_images/diamant-checkin-wheel-hero-visible-512.png";
import checkinCoin from "@assets/generated_images/diamant-checkin-wheel-coin-128.png";
import wheelBackground from "@assets/generated_images/spin-wheel-palace-bg-optimized.jpg";

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
      style={{
        maxWidth: 480,
        margin: "0 auto",
        backgroundColor: "#ff745d",
        backgroundImage: `linear-gradient(180deg, rgba(255,59,43,.72) 0%, rgba(255,112,83,.34) 34%, rgba(255,211,173,.16) 52%, rgba(255,83,67,.50) 100%), url("${wheelBackground}")`,
        backgroundSize: "100% max(760px, 82dvh)",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        color: "#713823",
        fontFamily: "Roboto, Arial, sans-serif",
      }}
    >
      <header
        className="ielp-checkin-hero relative w-full overflow-hidden"
        style={{
          aspectRatio: "576 / 310",
          border: "5px solid #ffd2a5",
          borderBottom: "7px solid #ffe3c8",
          borderRadius: "0 0 34px 34px",
          background: "radial-gradient(circle at 78% 25%, rgba(255,237,196,.28), transparent 35%), linear-gradient(180deg, #ff533d 0%, #f33328 78%, #ed271f 100%)",
          boxShadow: "0 5px 14px rgba(66,29,17,.24)",
        }}
      >
        <img
          src={checkinHeroArt}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute"
          style={{
            zIndex: 1,
            right: "-2%",
            bottom: "-11%",
            width: "56%",
            height: "94%",
            objectFit: "contain",
            objectPosition: "center bottom",
            filter: "drop-shadow(0 6px 8px rgba(87,30,18,.28))",
            pointerEvents: "none",
          }}
        />
        <h1
          className="ielp-checkin-title absolute font-semibold"
          style={{
            zIndex: 2,
            left: "19%",
            top: "5%",
            margin: 0,
            maxWidth: "58%",
            color: "#fffdf8",
            fontSize: "clamp(16px, 5vw, 24px)",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            textShadow: "0 2px 5px rgba(97,37,19,.5)",
          }}
        >
          {headerTitle}
        </h1>

        <Link href="/account">
          <button
            type="button"
            className="absolute flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{
              left: "3.5%",
              top: "8%",
              width: "11%",
              height: "20%",
              zIndex: 3,
              color: "#fff7db",
              background: "rgba(97,37,19,.25)",
              border: "1px solid rgba(255,255,255,.55)",
              textShadow: "0 1px 4px rgba(75,18,16,.45)",
            }}
            data-testid="button-back"
            aria-label={t.back}
          >
            <ChevronLeft size={23} strokeWidth={2.2} />
          </button>
        </Link>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            zIndex: 2,
            left: "12%",
            right: "12%",
            bottom: 1,
            height: 14,
            borderBottom: "4px solid #ffe9d7",
            borderRadius: "0 0 50% 50%",
            pointerEvents: "none",
          }}
        />
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
          border: "4px solid #fffdf8",
          borderRadius: 20,
          background: "#fff0f2",
          boxShadow: "0 8px 20px rgba(66,29,17,.24), 0 2px 0 rgba(139,66,36,.32), inset 0 1px 0 #fff",
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
            style={{
              border: "2px solid #f5b6a8",
              background: "linear-gradient(180deg, #fff7dc 0%, #ffe0a0 100%)",
              color: "#713823",
            }}
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
              border: "2px solid #ff8e85",
              background: "linear-gradient(180deg, #fff7dc 0%, #ffe0a0 100%)",
              color: "#713823",
              boxShadow: "0 3px 8px rgba(112,41,26,.22), inset 0 1px 0 rgba(255,255,255,.95)",
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
            style={{
              border: "2px solid #f5b6a8",
              background: "#fff0f2",
              color: "#713823",
              fontSize: 9,
              lineHeight: 1.1,
            }}
            data-testid="button-pointer-disabled"
          >
            {t.checkinComeBack.replace("{0}", String(bonusStatus.hoursRemaining))}
          </button>
        )}
      </section>

      <section
        className="ielp-checkin-calendar"
        style={{ width: "92%", margin: "5px auto 0", paddingBottom: 12 }}
      >
        <div
          className="ielp-checkin-calendar-frame relative"
          style={{
            padding: "12px 12px 13px",
            borderRadius: "22px 22px 34px 34px",
            border: "5px solid #fffdf8",
            background: "linear-gradient(180deg, #fffdf8 0%, #fff0f2 70%, #fff9f2 100%)",
            boxShadow: "0 15px 30px rgba(66,29,17,.3), 0 3px 0 rgba(139,66,36,.38)",
          }}
        >
          <div
            className="grid"
            style={{
              position: "relative",
              zIndex: 2,
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 7,
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
                    height: 86,
                    padding: "7px 2px 6px",
                    borderRadius: 11,
                    border: "1px solid #f5b6a8",
                    background: "linear-gradient(180deg, #fffaf8 0%, #fff0f2 100%)",
                    boxShadow: "0 2px 4px rgba(112,41,26,.06)",
                  }}
                  data-testid={`checkin-day-${day}`}
                  data-claimed={isClaimed}
                >
                  <span style={{ color: "#713823", fontSize: 13, lineHeight: 1.1 }}>
                    {displayDate}
                  </span>
                  <span
                    className="whitespace-nowrap font-medium"
                    style={{ color: "#c76437", fontSize: 14, lineHeight: 1.1 }}
                  >
                    {isClaimed ? formatReward(amount, locale) : "—"}
                  </span>
                  <img
                    src={checkinCoin}
                    alt=""
                    aria-hidden="true"
                    width={24}
                    height={24}
                    style={{
                      width: 24,
                      height: 24,
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