import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getContent } from "@/lib/content";
import { localeForLang, useI18n } from "@/lib/i18n";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Coins, Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

const DAILY_REWARD_MIN = 0.1;
const DAILY_REWARD_MAX = 0.4;

export default function CheckinPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const locale = localeForLang(lang);
  const [claimedRewardMessage, setClaimedRewardMessage] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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
      const message = data.message || t.checkinBonusDesc;
      setClaimedRewardMessage(message);
      toast({ title: t.checkinBonusTitle, description: message });
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
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const showingCurrentMonth = dateKey(calendarMonth) === dateKey(currentMonth);
  const monthTitle = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(calendarMonth);
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const changeMonth = (amount: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  // The page title follows the selected UI language. Admin content settings are
  // language-neutral and may contain the legacy French title.
  const headerTitle = t.checkinHeading;
  const rewardTitle = getContent(settings, "content_checkin_cardTitle", "Récompense du jour");
  const rewardDescription = getContent(
    settings,
    "content_checkin_cardSubtitle",
    "Recevez une récompense aléatoire chaque jour",
  );
  const streakLabel = getContent(settings, "content_checkin_streakLabel", "Jours de pointage");
  const totalLabel = getContent(settings, "content_checkin_totalLabel", "Bonus cumulé");
  const configuredRule1 = getContent(
    settings,
    "content_checkin_rule1",
    `1. À chaque pointage, vous recevez aléatoirement entre ${formatReward(DAILY_REWARD_MIN, locale)} et ${formatReward(DAILY_REWARD_MAX, locale)} ${currency}.`,
  );
  const rule1 = configuredRule1
    .replace(/0[,.]20/g, formatReward(DAILY_REWARD_MIN, locale))
    .replace(/0[,.]90/g, formatReward(DAILY_REWARD_MAX, locale));
  const rule2 = getContent(settings, "content_checkin_rule2", "2. Connectez-vous une fois par jour.");

  if (!user) return null;

  return (
    <main
      className="ielp-checkin-page min-h-screen w-full overflow-clip"
      style={{ maxWidth: 480, margin: "0 auto", background: "#f2f2f2", color: "#262626" }}
    >
      <section
        className="ielp-checkin-hero relative isolate overflow-hidden"
        style={{
          minHeight: 264,
          color: "#ffffff",
          background: "linear-gradient(112deg, #ffb400 0%, #ff8a00 53%, #ff5a2e 100%)",
          borderBottomLeftRadius: "36% 8%",
          borderBottomRightRadius: "36% 8%",
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle at 15% 18%, rgba(255,255,255,.9) 0 2px, transparent 3px), radial-gradient(circle at 76% 18%, rgba(255,255,255,.75) 0 2px, transparent 3px)",
            backgroundSize: "48px 42px, 60px 54px",
          }}
        />

        <div className="relative z-10 flex items-center justify-between px-4 pt-4">
          <Link href="/account">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ color: "#ffffff", background: "rgba(255,255,255,.18)" }}
              data-testid="button-back"
              aria-label="Retour"
            >
              <ChevronLeft size={27} strokeWidth={2.2} />
            </button>
          </Link>
          <h1 className="ielp-checkin-title text-center font-semibold" style={{ fontSize: 21, lineHeight: 1.2 }}>
            {headerTitle}
          </h1>
          <span className="h-10 w-10" aria-hidden="true" />
        </div>

        <div
          className="absolute right-5 top-[82px] h-[126px] w-[150px] rotate-[-5deg] rounded-2xl p-3"
          aria-hidden="true"
          style={{
            background: "rgba(255,255,255,.92)",
            boxShadow: "0 12px 28px rgba(155, 70, 0, .22)",
          }}
        >
          <div className="flex items-center justify-between border-b border-orange-100 pb-2" style={{ color: "#f47a18" }}>
            <CalendarDays size={22} strokeWidth={2.2} />
            <Sparkles size={18} />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }, (_, index) => (
              <span
                key={index}
                className="h-4 rounded-sm"
                style={{ background: index === 2 || index === 6 ? "#ffc247" : "#ffe8bd" }}
              />
            ))}
          </div>
          <div
            className="absolute -bottom-3 -left-3 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ color: "#fff8dc", background: "linear-gradient(145deg, #ffe477, #f7a900)", boxShadow: "0 4px 10px rgba(180, 100, 0, .25)" }}
          >
            <Coins size={23} />
          </div>
        </div>

        <div className="relative z-10 max-w-[58%] px-5 pb-8 pt-7">
          <p className="font-semibold" style={{ fontSize: 19, lineHeight: 1.25 }}>
            {rewardTitle}
          </p>
          <p className="mt-2 whitespace-pre-line" style={{ maxWidth: 205, fontSize: 13, lineHeight: 1.4, color: "rgba(255,255,255,.9)" }}>
            {rewardDescription}
          </p>
          <p
            className="mt-3 inline-flex items-center rounded-full px-3 py-1.5 font-semibold"
            style={{ background: "rgba(255,255,255,.2)", fontSize: 12 }}
          >
            {currency} {formatReward(DAILY_REWARD_MIN, locale)} – {formatReward(DAILY_REWARD_MAX, locale)}
          </p>
        </div>
      </section>

      <section className="relative z-20 mx-3 -mt-4">
        <div
          className="ielp-checkin-stat grid grid-cols-[1fr_1.2fr_auto] items-center gap-2 px-3 py-4"
          style={{
            minHeight: 104,
            border: "1px solid rgba(255,145,31,.35)",
            borderRadius: 16,
            background: "#ffffff",
            boxShadow: "0 6px 20px rgba(87, 55, 20, .08)",
          }}
        >
          <div className="min-w-0 text-center">
            <p className="ielp-checkin-balance whitespace-nowrap font-semibold" style={{ fontSize: 23, lineHeight: 1.1 }}>
              {daysPointed.toLocaleString(locale)}
            </p>
            <p className="ielp-checkin-caption mt-1 text-balance" style={{ fontSize: 11, lineHeight: 1.2, color: "#777777" }}>
              {streakLabel}
            </p>
          </div>
          <div className="min-w-0 text-center">
            <p className="ielp-checkin-balance whitespace-nowrap font-semibold" style={{ fontSize: 19, lineHeight: 1.1 }}>
              {currency} {formatReward(totalBonusClaimed, locale)}
            </p>
            <p className="ielp-checkin-caption mt-1 text-balance" style={{ fontSize: 11, lineHeight: 1.2, color: "#777777" }}>
              {totalLabel}
            </p>
          </div>
          {!bonusStatus || bonusStatusLoading ? (
            <button
              type="button"
              disabled
              className="flex h-11 min-w-[82px] items-center justify-center gap-1 rounded-full px-3 font-semibold text-white"
              style={{ background: "#c9c9c9", fontSize: 13 }}
              aria-label={t.loading}
            >
              <Loader2 size={17} className="animate-spin" />
            </button>
          ) : bonusStatus.canClaim ? (
            <button
              type="button"
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="flex h-11 min-w-[82px] items-center justify-center rounded-full px-3 font-semibold text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(110deg, #ffb000, #f36b22)",
                boxShadow: "0 4px 10px rgba(240, 113, 24, .28)",
                fontSize: 14,
              }}
              data-testid="button-pointer"
            >
              {claimMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : t.checkinBtn}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex h-11 min-w-[82px] items-center justify-center rounded-full px-2 text-center font-medium"
              style={{ background: "#eeeeee", color: "#777777", fontSize: 10, lineHeight: 1.2 }}
              data-testid="button-pointer-disabled"
            >
              {t.checkinComeBack.replace("{0}", String(bonusStatus.hoursRemaining))}
            </button>
          )}
        </div>
      </section>

      {claimedRewardMessage && (
        <p
          className="mx-4 mt-3 rounded-xl px-3 py-2 text-center text-sm font-medium"
          style={{ color: "#2d6b34", background: "#e8f6e8" }}
          role="status"
          data-testid="checkin-claim-success"
        >
          {claimedRewardMessage}
        </p>
      )}

      <section className="px-3 pb-5 pt-5">
        <div
          className="rounded-2xl p-3"
          style={{ background: "#ffffff", boxShadow: "0 4px 16px rgba(40, 30, 20, .05)" }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="ielp-checkin-calendar-label font-semibold" style={{ color: "#333333", fontSize: 16 }}>
                {t.checkinCalendarTitle}
              </h2>
              <p className="mt-0.5 capitalize" style={{ color: "#f1781b", fontSize: 13, fontWeight: 600 }}>
                {monthTitle}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "#fff4e4", color: "#e87819" }}
                aria-label={t.checkinPreviousMonth}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                disabled={showingCurrentMonth}
                className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40"
                style={{ background: "#fff4e4", color: "#e87819" }}
                aria-label={t.checkinNextMonth}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2" role="list" aria-label={t.checkinCalendarTitle}>
            {days.map((day) => {
              const dayDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
              const amount = checkinsByDay.get(dateKey(dayDate));
              const isClaimed = amount !== undefined;
              const isToday = dateKey(dayDate) === dateKey(now);
              const displayDate = `${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              return (
                <div
                  key={day}
                  role="listitem"
                  aria-label={`${displayDate}: ${isClaimed ? `${t.checkinDayClaimed}, ${formatReward(amount, locale)} ${currency}` : t.checkinDayNotClaimed}`}
                  className="flex min-h-[105px] flex-col items-center justify-between rounded-xl px-1.5 py-2"
                  style={{
                    border: `1px solid ${isClaimed ? "#ffd28c" : isToday ? "#ff9d42" : "#e7e7e7"}`,
                    background: isClaimed ? "#fff3de" : "#f1f1f1",
                    boxShadow: isToday && !isClaimed ? "inset 0 0 0 1px rgba(255,157,66,.22)" : "none",
                  }}
                  data-testid={`checkin-day-${day}`}
                  data-claimed={isClaimed}
                >
                  <span style={{ color: "#777777", fontSize: 11, lineHeight: 1.2 }}>
                    {displayDate}
                  </span>
                  <span
                    className="whitespace-nowrap font-medium"
                    style={{ color: isClaimed ? "#333333" : "#9a9a9a", fontSize: 13, lineHeight: 1.1 }}
                  >
                    {isClaimed ? formatReward(amount, locale) : "—"}
                  </span>
                  {isClaimed ? (
                    <span
                      className="relative flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ color: "#fff8df", background: "linear-gradient(145deg, #ffd85d, #ed9d00)", boxShadow: "0 2px 5px rgba(194, 128, 0, .25)" }}
                      aria-hidden="true"
                    >
                      <Coins size={19} />
                      <Check className="absolute right-0 top-0 rounded-full" size={10} strokeWidth={3.5} />
                    </span>
                  ) : (
                    <Coins size={22} color="#c6c6c6" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-3 pb-8">
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "#ffffff", boxShadow: "0 4px 16px rgba(40, 30, 20, .05)" }}
        >
          <p className="ielp-checkin-rule-text" style={{ color: "#666666", fontSize: 13, lineHeight: 1.55 }}>
            {rule1}
          </p>
          <p className="ielp-checkin-rule-text mt-1" style={{ color: "#666666", fontSize: 13, lineHeight: 1.55 }}>
            {rule2}
          </p>
          <p
            className="ielp-checkin-rule-text mt-1"
            style={{ color: "#666666", fontSize: 13, lineHeight: 1.55 }}
            data-testid="text-random-reward-description"
          >
            {t.checkinDayClaimed}: {formatReward(DAILY_REWARD_MIN, locale)}–{formatReward(DAILY_REWARD_MAX, locale)} {currency} par pointage.
          </p>
        </div>
      </section>
    </main>
  );
}