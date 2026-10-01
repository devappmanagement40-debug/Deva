import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type ReceiptKind = "deposit" | "withdrawal";
export type HistoryTab = ReceiptKind | "activity";

export interface ReceiptTransaction {
  id: string | number;
  kind: ReceiptKind;
  amount: string | number;
  status: string;
  createdAt: string | Date;
  paymentMethod?: string | null;
  accountNumber?: string | null;
  reference?: string | null;
  description?: string | null;
  fees?: string | number | null;
  netAmount?: string | number | null;
}

const STATUS_META: Record<string, { tone: "success" | "pending" | "danger" }> = {
  approved: { tone: "success" },
  completed: { tone: "success" },
  pending: { tone: "pending" },
  pending_2fa: { tone: "pending" },
  processing: { tone: "pending" },
  rejected: { tone: "danger" },
  failed: { tone: "danger" },
};

function formatDate(value: string | Date, lang: string) {
  const date = new Date(value);
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export function HistoryPageHeader({
  title,
  backHref,
  tabs,
}: {
  title: string;
  backHref: string;
  tabs?: ReactNode;
}) {
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-[#e4e4e4] bg-white">
      <div className="relative flex h-[58px] items-center px-4">
        <button
          type="button"
          onClick={() => navigate(backHref)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#202020] transition active:scale-95 active:bg-[#f1f1f1]"
          aria-label="Retour"
          data-testid="button-back"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
        </button>
        <div className="pointer-events-none absolute inset-x-14 text-center">
          <h1 className="text-[16px] font-semibold text-[#171717]">{title}</h1>
        </div>
      </div>
      {tabs}
    </header>
  );
}

export function HistoryTabs({
  activeTab,
  onChange,
  depositLabel,
  withdrawalLabel,
  activityLabel,
}: {
  activeTab: HistoryTab;
  onChange: (tab: HistoryTab) => void;
  depositLabel: string;
  withdrawalLabel: string;
  activityLabel?: string;
}) {
  const tabs: { id: HistoryTab; label: string }[] = [
    { id: "deposit", label: depositLabel },
    { id: "withdrawal", label: withdrawalLabel },
  ];
  if (activityLabel) tabs.push({ id: "activity", label: activityLabel });

  return (
    <div className={`grid gap-1 border-t border-[#edf4ef] px-4 pt-2 ${activityLabel ? "grid-cols-3" : "grid-cols-2"}`}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative h-10 text-sm font-semibold transition-colors ${
              active ? "text-[#087a38]" : "text-[#7b9187]"
            }`}
            aria-pressed={active}
            data-testid={`history-tab-${tab.id}`}
          >
            {tab.label}
            {active && <span className="absolute inset-x-7 bottom-0 h-[3px] rounded-full bg-[#00a651]" />}
          </button>
        );
      })}
    </div>
  );
}

export function ReceiptCard({ transaction }: { transaction: ReceiptTransaction }) {
  const { lang } = useI18n();
  const isDeposit = transaction.kind === "deposit";
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";
  const numericAmount = Number(transaction.amount);
  const amount = Number.isFinite(numericAmount)
    ? numericAmount.toLocaleString(locale, { maximumFractionDigits: 8 })
    : "0";
  const status = STATUS_META[transaction.status] ?? { tone: "pending" as const };
  const statusLabels: Record<string, string> = lang === "en"
    ? { approved: "Approved", completed: "Completed", pending: "Pending", pending_2fa: "Verification required", processing: "Processing", rejected: "Rejected", failed: "Failed" }
    : lang === "ar"
      ? { approved: "تمت الموافقة", completed: "مكتمل", pending: "قيد الانتظار", pending_2fa: "التحقق مطلوب", processing: "قيد المعالجة", rejected: "مرفوض", failed: "فشل" }
      : lang === "zh"
        ? { approved: "已批准", completed: "已完成", pending: "处理中", pending_2fa: "需要验证", processing: "进行中", rejected: "已拒绝", failed: "失败" }
        : { approved: "Approved", completed: "Completed", pending: "Pending", pending_2fa: "Verification required", processing: "Processing", rejected: "Rejected", failed: "Failed" };
  const statusLabel = statusLabels[transaction.status] || transaction.status || statusLabels.pending;
  const statusClass = {
    success: "text-[#16803b]",
    pending: "text-[#e4a11b]",
    danger: "text-[#d13e3e]",
  }[status.tone];
  const fallbackReference = `${isDeposit ? "A" : "R"}${String(transaction.id).replace(/^(dep|wd)-/, "")}`;
  const reference = transaction.reference?.trim() || fallbackReference;
  const rawMethod = transaction.paymentMethod?.trim();
  const method = rawMethod?.toLowerCase() === "nowpayments"
    ? "OkayPay"
    : rawMethod
    || (isDeposit ? "Canaux de recharge" : "USDT BEP20");
  return (
    <article
      className="min-h-[106px] border-b border-white bg-[#f3f3f3] px-4 py-4"
      data-testid={`receipt-${transaction.kind}-${transaction.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#202020]">{reference}</p>
          <p className="mt-2 truncate text-[12px] text-[#8a8a8a]">{method}</p>
          <p className="mt-2 text-[12px] text-[#8a8a8a]">{formatDate(transaction.createdAt, lang)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-7 text-right">
          <p className="text-[13px] text-[#858585]">{amount} XOF</p>
          <span className={`text-[12px] font-semibold ${statusClass}`}>{statusLabel}</span>
        </div>
      </div>
    </article>
  );
}

export function ReceiptLoadingState() {
  return (
    <div>
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-[106px] animate-pulse border-b border-white bg-[#f3f3f3]" />
      ))}
    </div>
  );
}

export function ReceiptEmptyState({ kind }: { kind: ReceiptKind }) {
  return (
    <div className="min-h-[92px] border-b border-white bg-white px-4 pt-3 text-center text-[14px] text-[#9a9a9a]" data-kind={kind}>
      No more data
    </div>
  );
}

export function HistoryDecor({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white pb-8">
      <div className="mx-auto w-full max-w-[480px]">{children}</div>
    </main>
  );
}
