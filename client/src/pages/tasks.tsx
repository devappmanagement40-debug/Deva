import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { Task } from "@shared/schema";
import { FloatingSupport } from "@/components/floating-support";

interface TaskWithStatus extends Task {
  isCompleted: boolean;
  canClaim: boolean;
  currentInvites: number;
}

const REWARD_GREEN = "#08b83a";
const REWARD_SKY = "#87ceeb";

function formatInvitations(count: number, label: string) {
  return `${count} ${label}`;
}

export default function TasksPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<TaskWithStatus[]>({
    queryKey: ["/api/tasks"],
  });

  const claimMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/claim`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refreshUser();
      toast({
        title: t.tasksRewardClaimed,
        description: data.message || t.tasksRewardClaimedDesc,
      });
    },
    onError: (error: any) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  if (!user) return null;

  const taskList = tasks || [];

  return (
    <main
      className="min-h-screen bg-[#fbfbfa] pb-[92px]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="mx-auto min-h-screen w-full max-w-[480px] overflow-clip bg-[#fbfbfa]">
        <header className="relative z-20 flex h-[58px] items-center justify-center border-b border-[#f1f1f1] bg-white">
          <Link href="/" className="absolute left-3 flex h-9 w-9 items-center justify-center">
            <ChevronLeft className="h-6 w-6 text-[#222]" strokeWidth={2.4} />
          </Link>
          <h1 className="text-[20px] font-bold text-[#111]">{t.taskPageTitle}</h1>
        </header>

        <section
          className="ielp-task-hero relative h-[84px] overflow-hidden"
          style={{
            background: `linear-gradient(105deg, #075d34 0%, ${REWARD_GREEN} 53%, ${REWARD_SKY} 125%)`,
          }}
          aria-hidden="true"
        >
          <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border-[18px] border-white/10" />
          <div className="absolute -left-14 -bottom-20 h-44 w-44 rounded-full border-[16px] border-white/10" />
          <div className="absolute bottom-0 left-5 h-1 w-20 rounded-full bg-white/75" />
        </section>

        <section className="px-5 pt-[46px]">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="ielp-brand-marker h-[26px] w-[5px] rounded-full"
              style={{ background: `linear-gradient(180deg, ${REWARD_SKY}, ${REWARD_GREEN})` }}
            />
            <h2 className="text-[18px] font-bold text-[#242424]">{t.taskRewardTitle}</h2>
          </div>
          <p className="max-w-[400px] text-[15px] leading-[1.38] text-[#3f3f3f]">
            {t.taskRewardNote}
          </p>
        </section>

        <section className="mx-5 mt-7 overflow-hidden rounded-[13px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
          {isLoading ? (
            <div className="space-y-1 p-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[76px] w-full rounded-lg" />
              ))}
            </div>
          ) : taskList.length > 0 ? (
            taskList.map((task, index) => {
              const progress = Math.min(
                task.currentInvites / Math.max(task.requiredInvites, 1),
                1,
              );
              const isLast = index === taskList.length - 1;
              const statusLabel = task.isCompleted
                ? t.taskReceived
                : task.canClaim
                  ? t.taskClaim
                  : t.taskWaiting;

              return (
                <div
                  key={task.id}
                  className={`relative flex min-h-[88px] items-center gap-2.5 px-2.5 py-3 ${
                    !isLast ? "border-b border-[#e9e9e9]" : ""
                  }`}
                  data-testid={`task-item-${task.id}`}
                >
                  <div
                    className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-r-[12px] rounded-l-[4px] text-[17px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${REWARD_SKY} 0%, ${REWARD_GREEN} 100%)`,
                      boxShadow: "0 2px 5px rgba(8,184,58,0.25)",
                    }}
                    aria-label={`${index + 1}`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1 self-stretch">
                    <div className="flex min-h-full flex-col justify-center">
                      <p className="truncate text-[17px] font-bold leading-tight text-[#161616]">
                        {formatInvitations(task.requiredInvites, t.taskValidInvitation)}
                      </p>
                      <p className="mt-1 text-[14px] leading-tight text-[#9b9b9b]">
                        {t.taskRewardLabel}:{" "}
                        <span className="font-bold text-[#6db98a]">
                          {task.reward.toLocaleString()} XOF
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#e1e4e7] bg-[#f4f5f6] px-2.5 py-1 text-[13px] text-[#a4a4a4]">
                        {task.currentInvites} / {task.requiredInvites}
                      </span>
                      <button
                        type="button"
                        onClick={() => task.canClaim && !claimMutation.isPending && claimMutation.mutate(task.id)}
                        disabled={!task.canClaim || task.isCompleted || claimMutation.isPending}
                        className="min-w-[57px] rounded-full px-2.5 py-1.5 text-[13px] font-bold text-white shadow-sm transition-transform active:scale-95 disabled:cursor-default disabled:opacity-90"
                        style={{
                          background: task.isCompleted
                            ? "#aeb7b2"
                            : `linear-gradient(105deg, ${REWARD_GREEN}, ${REWARD_SKY})`,
                        }}
                        data-testid={`button-claim-${task.id}`}
                      >
                        {claimMutation.isPending && task.canClaim ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : (
                          statusLabel
                        )}
                      </button>
                    </div>
                    <div className="h-1 w-full max-w-[155px] overflow-hidden rounded-full bg-[#edf1ee]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress * 100}%`, background: REWARD_GREEN }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-14 text-center text-sm text-[#8b8b8b]">{t.taskNone}</div>
          )}
        </section>
      </div>

      <FloatingSupport bottomOffset={76} />
    </main>
  );
}