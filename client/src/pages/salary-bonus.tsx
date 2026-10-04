import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import newBannerImg from "@assets/piedestal-realiste-trophees-gobelets-metal-composition-rubans-_1785144220204.jpg";
import rewardLevel01 from "@assets/generated_images/diamant-referral-reward-01.webp";
import rewardLevel02 from "@assets/generated_images/diamant-referral-reward-02.webp";
import rewardLevel03 from "@assets/generated_images/diamant-referral-reward-03.webp";
import rewardLevel04 from "@assets/generated_images/diamant-referral-reward-04.webp";
import rewardLevel05 from "@assets/generated_images/diamant-referral-reward-05.webp";
import rewardLevel06 from "@assets/generated_images/diamant-referral-reward-06.webp";
import rewardLevel07 from "@assets/generated_images/diamant-referral-reward-07.webp";
import rewardLevel08 from "@assets/generated_images/diamant-referral-reward-08.webp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Users, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SalaryBonusPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 30000,
    staleTime: 0,
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || t.errorOccurred);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({
        title: t.tasksRewardClaimed,
        description: data.message || t.tasksRewardClaimedDesc,
      });
      setClaimingId(null);
    },
    onError: (err: any) => {
      toast({ title: t.errorOccurred, description: err.message, variant: "destructive" });
      setClaimingId(null);
    },
  });

  if (!user) return null;

  const currency = "XOF";
  const rewardIllustrations = [
    rewardLevel01,
    rewardLevel02,
    rewardLevel03,
    rewardLevel04,
    rewardLevel05,
    rewardLevel06,
    rewardLevel07,
    rewardLevel08,
  ];
  const activeMembers = tasks.length > 0 ? ((tasks[0] as any).currentInvites || 0) : 0;
  const totalClaimed = (tasks as any[])
    .filter((tk) => tk.isCompleted)
    .reduce((sum, tk) => sum + (tk.reward || 0), 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#000000" }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 bg-white shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate("/account")}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100"
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <p className="flex-1 text-center text-gray-900 font-extrabold text-lg pr-9">
          {t.salaryPageTitle}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 px-4 pt-4 space-y-4">

        {/* ── Stats banner ── */}
        <div className="rounded-2xl overflow-hidden relative" style={{ minHeight: 96 }}>
          <div
            className="absolute inset-0"
            style={{
              background: `url(${newBannerImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0" style={{ background: "rgba(15,35,90,0.68)" }} />
          <div className="relative z-10 flex items-center px-4 py-5 gap-4">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Users className="w-4 h-4 text-blue-200" />
                <p className="text-blue-100 text-[11px] font-medium">{t.salaryActiveMembers}</p>
              </div>
              <p className="text-white font-extrabold text-2xl">{activeMembers}</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <Trophy className="w-4 h-4 text-yellow-200" />
                <p className="text-blue-100 text-[11px] font-medium">{t.salaryTotalRewards}</p>
              </div>
              <p className="text-white font-extrabold text-2xl">
                {totalClaimed.toLocaleString()}{" "}
                <span className="text-sm font-normal">{currency}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Info note ── */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white/70 text-xs leading-relaxed">
          <span className="font-bold">✦ {t.salaryActiveMemberDef}</span>
        </div>

        {/* ── Reward cards ── */}
        {isLoading ? null : (
          (tasks as any[]).map((task, index) => {
            const current = task.currentInvites || 0;
            const required = task.requiredInvites || 1;
            const progress = Math.min(current, required);
            const pct = Math.min((progress / required) * 100, 100);
            const missing = Math.max(0, required - current);
            const isThisClaiming = claimingId === task.id;

            const headerGradient = task.isCompleted
              ? "linear-gradient(135deg, #16a34a, #15803d)"
              : task.canClaim
              ? "linear-gradient(135deg, #d97706, #b45309)"
              : "linear-gradient(135deg, #1d4ed8, #1e40af)";

            const barGradient = task.isCompleted
              ? "linear-gradient(90deg, #22c55e, #16a34a)"
              : task.canClaim
              ? "linear-gradient(90deg, #f59e0b, #d97706)"
              : "linear-gradient(90deg, #60a5fa, #1d4ed8)";

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                data-testid={`reward-card-${index + 1}`}
              >
                {/* Compact header with a distinct illustration for each reward level */}
                <div
                  className="px-3 py-2 flex items-center justify-between gap-2"
                  style={{ background: headerGradient }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={rewardIllustrations[index % rewardIllustrations.length]}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/30 shadow-sm"
                    />
                    <span className="text-white font-bold text-sm sm:text-base leading-tight">
                      {t.salaryRewardLabel} {index + 1}
                    </span>
                  </div>
                  {task.isCompleted ? (
                    <span className="flex items-center gap-1 bg-white/20 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.salaryClaimed}
                    </span>
                  ) : task.canClaim ? (
                    <span className="bg-white/20 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shrink-0">
                      {t.salaryUnlocked}
                    </span>
                  ) : null}
                </div>

                {/* Card body */}
                <div className="px-3.5 py-3">
                  <div className="flex items-end justify-between gap-3 mb-2">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <p className="text-2xl sm:text-[28px] leading-none font-extrabold tracking-tight" style={{ color: "#1d4ed8" }}>
                        {(task.reward || 0).toLocaleString()}
                      </p>
                      <span className="text-[11px] text-gray-400 font-semibold">{currency}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-gray-500 text-[10px] font-medium leading-tight">{t.salaryProgress}</p>
                      <p className="font-bold text-sm text-gray-800 leading-tight">
                        {progress}/{required}
                      </p>
                    </div>
                  </div>

                  {/* Animated progress bar */}
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: barGradient }}
                    />
                  </div>

                  {/* CTA */}
                  {task.isCompleted ? (
                    <div className="w-full min-h-[40px] py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t.salaryClaimed}
                    </div>
                  ) : task.canClaim ? (
                    <button
                      className="w-full min-h-[40px] py-2 rounded-lg text-white font-bold text-xs transition-opacity disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                      disabled={isThisClaiming}
                      onClick={() => {
                        setClaimingId(task.id);
                        claimMutation.mutate(task.id);
                      }}
                    >
                      {isThisClaiming ? "..." : t.salaryClaim}
                    </button>
                  ) : (
                    <button
                      className="w-full min-h-[40px] py-2 rounded-lg bg-gray-100 text-gray-400 font-semibold text-xs cursor-not-allowed"
                      disabled
                    >
                      {t.salaryMissing.replace("{0}", String(missing))}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}
