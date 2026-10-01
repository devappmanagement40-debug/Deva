import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getContent } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import checkinHero from "@/assets/images/diamant-checkin-hero.png";
import bonusIcon from "@/assets/images/checkin-bonus-icon-reference.png";
import bonusChat from "@/assets/images/checkin-bonus-chat-reference.png";
import rewardBike from "@/assets/images/checkin-reward-bike-reference.png";
import streakBike from "@/assets/images/checkin-streak-bike-reference.png";

interface BonusStatus {
  canClaim: boolean;
  hoursRemaining: number;
  totalBonusClaimed: number;
  daysPointed: number;
}

const DAILY_REWARD_MIN = 0.1;
const DAILY_REWARD_MAX = 0.4;

function formatReward(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export default function CheckinPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [claimedRewardMessage, setClaimedRewardMessage] = useState<string | null>(null);

  const { data: bonusStatus } = useQuery<BonusStatus>({
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

  if (!user) return null;

  const currency = "XOF";
  const totalBonusClaimed = bonusStatus?.totalBonusClaimed || 0;
  const daysPointed = bonusStatus?.daysPointed || 0;
  // The page title follows the selected UI language. Admin content settings are
  // language-neutral and may contain the legacy French title.
  const headerTitle = t.checkinBtn;
  const rewardTitle = getContent(settings, "content_checkin_cardTitle", "Récompense de\npointage quotidien");
  const rewardDescription = getContent(
    settings,
    "content_checkin_cardSubtitle",
    "Recevez une récompense aléatoire\nchaque jour",
  );
  const streakLabel = getContent(settings, "content_checkin_streakLabel", "Jours de pointage");
  const totalLabel = getContent(settings, "content_checkin_totalLabel", "Bonus cumulé");
  const configuredRule1 = getContent(
    settings,
    "content_checkin_rule1",
    `1. À chaque pointage, vous recevez aléatoirement entre ${formatReward(DAILY_REWARD_MIN)} et ${formatReward(DAILY_REWARD_MAX)} ${currency}.`,
  );
  const rule1 = configuredRule1
    .replace(/0[,.]20/g, formatReward(DAILY_REWARD_MIN))
    .replace(/0[,.]90/g, formatReward(DAILY_REWARD_MAX));
  const rule2 = getContent(settings, "content_checkin_rule2", "2. Connectez-vous une fois par jour.");

  return (
    <main
      className="ielp-checkin-page min-h-screen w-full overflow-clip"
      style={{ maxWidth: 480, margin: "0 auto", background: "#f2f2f2", color: "#151515" }}
    >
      <header className="relative w-full bg-white" style={{ height: 82 }}>
        <Link href="/account">
          <button
            className="absolute flex items-center justify-center"
            style={{ left: 22, top: 20, width: 42, height: 42 }}
            data-testid="button-back"
            aria-label="Retour"
          >
            <ChevronLeft size={35} strokeWidth={1.8} color="#0e0e0e" />
          </button>
        </Link>
        <img
          src="/diamant-mark.svg"
          alt="DIAMANT"
          className="absolute object-contain"
          style={{ left: "25.5%", top: 20, width: 36, height: 36 }}
        />
        <h1
          className="ielp-checkin-title absolute font-normal"
          style={{ left: "49.5%", top: 32, color: "#00a92d", fontSize: 20, lineHeight: 1 }}
        >
          {headerTitle}
        </h1>
      </header>

      <section className="w-full" style={{ aspectRatio: "720 / 318" }}>
        <img src={checkinHero} alt="Vélo électrique" className="block h-full w-full object-cover" />
      </section>

      <section className="px-[11px] pt-[18px]">
        <div
          className="ielp-checkin-stat relative w-full bg-white"
          style={{ height: 120, border: "1px solid #0cad32", borderRadius: 6 }}
        >
          <img
            src={bonusIcon}
            alt=""
            aria-hidden="true"
            className="absolute object-contain"
            style={{ left: 10, top: 8, width: 84, height: 94 }}
          />
          <div className="absolute text-center" style={{ left: "23%", right: "19%", top: 24 }}>
            <p className="ielp-checkin-balance font-normal whitespace-nowrap" style={{ color: "#00b52a", fontSize: 39, lineHeight: 1 }}>
              {currency} {totalBonusClaimed.toLocaleString()}
            </p>
            <p className="ielp-checkin-caption mt-3 font-normal" style={{ color: "#151515", fontSize: 16, lineHeight: 1 }}>
              {totalLabel}
            </p>
          </div>
          <img
            src={bonusChat}
            alt=""
            aria-hidden="true"
            className="absolute object-contain"
            style={{ right: 9, top: 12, width: 82, height: 84 }}
          />
        </div>
      </section>

      <section
        className="ielp-checkin-reward-surface relative mt-[10px] w-full overflow-hidden"
        style={{ height: 372, background: "#00b90a", color: "#ffffff" }}
      >
        <img
          src={rewardBike}
          alt=""
          aria-hidden="true"
          className="absolute object-cover"
          style={{ left: 10, top: 72, width: "37.3%", aspectRatio: "270 / 139" }}
        />
        <div className="absolute" style={{ left: "42%", top: 13 }}>
          <p className="font-normal whitespace-pre-line" style={{ fontSize: 25, lineHeight: 1.58 }}>
            {rewardTitle}
          </p>
          <p className="mt-1 font-normal whitespace-pre-line" style={{ fontSize: 20, lineHeight: 1.52 }}>
            {rewardDescription}
          </p>
          <p className="mt-3 font-normal whitespace-nowrap" style={{ fontSize: 50, lineHeight: 1 }}>
            {currency} {formatReward(DAILY_REWARD_MIN)} – {formatReward(DAILY_REWARD_MAX)}
          </p>
        </div>

        <div className="absolute text-center" style={{ left: 0, top: 235, width: "61%" }}>
          <p className="font-normal" style={{ fontSize: 25, lineHeight: 1.25 }}>
            {streakLabel}
          </p>
          <p className="mt-2 whitespace-nowrap font-normal" style={{ fontSize: 19, lineHeight: 1.15 }}>
            Nombre total de jours pointés
          </p>
          <p className="mt-3 font-normal whitespace-nowrap" style={{ fontSize: 43, lineHeight: 1 }}>
            {daysPointed} jours
          </p>
        </div>
        <img
          src={streakBike}
          alt=""
          aria-hidden="true"
          className="absolute object-cover"
          style={{ left: "60.5%", top: 254, width: "37.3%", aspectRatio: "270 / 139" }}
        />
      </section>

      <section className="px-[10px] pt-5 pb-7">
        {bonusStatus?.canClaim ? (
          <button
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            className="mx-auto block font-normal text-white disabled:opacity-60"
            style={{
              width: "66.7%",
              height: 51,
              borderRadius: 999,
              background: "#00bd08",
              boxShadow: "0 2px 4px rgba(0, 134, 29, 0.12)",
              fontSize: 32,
              lineHeight: 1,
            }}
            data-testid="button-pointer"
          >
            {claimMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                {t.loading}
              </span>
            ) : t.checkinBtn}
          </button>
        ) : (
          <button
            disabled
            className="mx-auto block font-normal"
            style={{
              width: "66.7%",
              height: 51,
              borderRadius: 999,
              background: "#d2d2d2",
              color: "#767676",
              fontSize: 17,
            }}
            data-testid="button-pointer-disabled"
          >
            {t.checkinComeBack.replace("{0}", String(bonusStatus?.hoursRemaining || 0))}
          </button>
        )}

        {claimedRewardMessage && (
          <p
            className="mx-auto mt-3 max-w-[320px] rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-800"
            role="status"
            data-testid="checkin-claim-success"
          >
            {claimedRewardMessage}
          </p>
        )}

        <div className="mt-[22px] space-y-0">
          <p className="ielp-checkin-rule-text font-normal" style={{ color: "#5e646b", fontSize: 15, lineHeight: 1.55 }}>
            {rule1}
          </p>
          <p className="ielp-checkin-rule-text font-normal" style={{ color: "#5e646b", fontSize: 15, lineHeight: 1.55 }}>
            {rule2}
          </p>
          <p
            className="ielp-checkin-rule-text font-normal"
            style={{ color: "#5e646b", fontSize: 15, lineHeight: 1.55 }}
            data-testid="text-random-reward-description"
          >
            Récompense aléatoire : entre {formatReward(DAILY_REWARD_MIN)} et {formatReward(DAILY_REWARD_MAX)} {currency} par pointage.
          </p>
          <p className="ielp-checkin-rule-text font-normal" style={{ color: "#5e646b", fontSize: 15, lineHeight: 1.55 }}>
            3. Connectez-vous à nouveau après minuit chaque jour.
          </p>
        </div>
      </section>
    </main>
  );
}