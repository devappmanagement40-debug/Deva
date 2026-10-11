import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import landscapeImg from "@assets/generated_images/diamant-charging-station-hero.jpg";
import { useI18n } from "@/lib/i18n";
import { isUsdtRecord } from "@/lib/usdt-records";

interface Deposit {
  id: number;
  amount: string;
  amountUsdt?: string | null;
  currency?: string | null;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

// STATUS_CONFIG is built inside the component using i18n

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function DepositOrdersPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const STATUS_CONFIG = {
    approved: { label: t.statusApproved, bg: "bg-[#00ff00]", text: "text-black" },
    completed: { label: t.statusApproved, bg: "bg-[#00ff00]", text: "text-black" },
    pending: { label: t.statusPending, bg: "bg-[#5e3de9]", text: "text-white" },
    pending_2fa: { label: t.statusPending, bg: "bg-[#5e3de9]", text: "text-white" },
    processing: { label: t.statusPending, bg: "bg-[#5e3de9]", text: "text-white" },
    rejected: { label: t.statusRejected, bg: "bg-[#ff0000]", text: "text-black" },
    failed: { label: t.statusRejected, bg: "bg-[#ff0000]", text: "text-black" },
    expired: { label: t.statusRejected, bg: "bg-[#ff0000]", text: "text-black" },
    cancelled: { label: t.statusRejected, bg: "bg-[#ff0000]", text: "text-black" },
  } as Record<string, { label: string; bg: string; text: string }>;

  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });
  const usdtDeposits = deposits.filter(isUsdtRecord);

  return (
    <div
      className="deposit-orders-page flex min-h-screen flex-col text-white"
      style={{ background: "linear-gradient(180deg, #050923 0%, #07113a 52%, #07518a 100%)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-[58px] shrink-0 items-center gap-2 border-b border-white/15 bg-gradient-to-r from-[#050923] to-[#09235d] px-4 shadow-[0_2px_8px_rgba(0,5,30,.28)]">
        <Link href="/account">
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10" aria-label="Retour" data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="flex-1 pr-10 text-center text-base font-semibold text-white">
          {t.depositOrders}
        </h1>
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 space-y-3 p-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl border border-white/10 bg-white/10" />
          ))
        ) : usdtDeposits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-white/70">{t.noDeposits}</p>
          </div>
        ) : (
          usdtDeposits.map((d) => {
            const cfg = STATUS_CONFIG[d.status.toLowerCase()] || { label: d.status, bg: "bg-white/20", text: "text-white" };
            return (
              <div key={d.id} className="overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#242d55] to-[#1e5b91] shadow-[0_10px_28px_rgba(1,5,25,.24)]">
                <div className="h-1.5 bg-gradient-to-r from-[#59a5ff] to-[#7653f5]" />

                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-white/70">{t.amountLabel}</span>
                    <span className="text-right text-base font-bold text-white">
                      {Number(d.amountUsdt ?? d.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} USDT
                    </span>
                  </div>

                  {d.paymentMethod && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm text-white/70">{t.methodLabel}</span>
                      <span className="min-w-0 break-words text-right text-sm font-medium text-white">{d.paymentMethod}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-white/70">{t.statusLabel}</span>
                    <span className={`${cfg.bg} ${cfg.text} text-xs font-semibold px-4 py-1.5 rounded-full`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-white/70">{t.dateLabel}</span>
                    <span className="text-right text-sm text-white/75">{formatDate(d.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <img
        src={landscapeImg}
        alt="DIAMANT"
        loading="lazy"
        height={220}
        className="mt-auto h-[220px] w-full object-cover object-top"
      />
    </div>
  );
}
