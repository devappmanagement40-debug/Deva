import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import rewardLevel01 from "@assets/generated_images/diamant-gift-reward-01.webp";
import rewardLevel02 from "@assets/generated_images/diamant-gift-reward-02.webp";
import rewardLevel03 from "@assets/generated_images/diamant-gift-reward-03.webp";
import rewardLevel04 from "@assets/generated_images/diamant-gift-reward-04.webp";
import rewardLevel05 from "@assets/generated_images/diamant-gift-reward-05.webp";
import rewardLevel06 from "@assets/generated_images/diamant-gift-reward-06.webp";
import rewardLevel07 from "@assets/generated_images/diamant-gift-reward-07.webp";
import rewardLevel08 from "@assets/generated_images/diamant-gift-reward-08.webp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft } from "lucide-react";
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

      <div
        className="flex-1 overflow-y-auto px-4 pt-4 space-y-3"
        style={{ paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
      >

        {/* ── Reward cards ── */}
        {isLoading ? null : (
          (tasks as any[]).map((task, index) => {
            const current = task.currentInvites || 0;
            const required = task.isCompleted && task.claimedRequiredInvites != null
              ? task.claimedRequiredInvites
              : task.requiredInvites || 1;
            const displayedReward = task.isCompleted && task.claimedReward != null
              ? task.claimedReward
              : task.reward || 0;
            const progress = Math.min(current, required);
            const pct = Math.min((progress / required) * 100, 100);
            const isThisClaiming = claimingId === task.id;
            const status = task.isCompleted
              ? { label: t.salaryClaimed, className: "bg-green-600" }
              : task.canClaim
                ? { label: t.salaryUnlocked, className: "bg-amber-600" }
                : { label: t.salaryIncomplete, className: "bg-gray-400" };
            const illustration =
              rewardIllustrations[index] ??
              rewardIllustrations[rewardIllustrations.length - 1];

            return (
              <div
                key={task.id}
                className="relative pt-3"
                data-testid={`reward-card-${index + 1}`}
              >
                <span
                  className={`absolute left-0 top-0 z-10 rounded-tl-xl rounded-br-xl px-3 py-1 text-[11px] font-semibold text-white ${status.className}`}
                >
                  {task.isCompleted && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                  {status.label}
                </span>
                <div className="rounded-xl border border-gray-100 bg-white px-3 pb-3 pt-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={illustration}
                      alt=""
                      loading="lazy"
                      className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium leading-snug text-gray-700 sm:text-[13px]">
                        {t.salaryRequiredInvites.replace("{0}", String(required))}
                      </p>
                      <p className="mt-1 text-[12px] leading-snug text-gray-600 sm:text-[13px]">
                        {t.salaryRewardLabel} :{" "}
                        <span className="font-bold text-[#1d4ed8]">
                          {currency} {displayedReward.toLocaleString()}
                        </span>
                      </p>
                      <div className="mt-2 flex items-center gap-2.5">
                        <div
                          role="progressbar"
                          aria-label={t.salaryProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(pct)}
                          className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200"
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: "#653de9" }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-bold text-gray-600">
                          {progress} / {required}
                        </span>
                      </div>
                      {!task.isCompleted && task.canClaim && (
                        <button
                          className="mt-2.5 min-h-[40px] w-full rounded-lg text-xs font-bold text-white transition-opacity disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                          disabled={isThisClaiming}
                          onClick={() => {
                            setClaimingId(task.id);
                            claimMutation.mutate(task.id);
                          }}
                        >
                          {isThisClaiming ? "..." : t.salaryClaim}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}
