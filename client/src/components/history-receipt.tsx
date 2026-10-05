import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type ReceiptKind = "deposit" | "withdrawal";
export type HistoryTab = ReceiptKind | "activity";

export interface ReceiptTransaction {
  id: string | number;
  kind: ReceiptKind | "activity";
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
  cancelled: { tone: "danger" },
  canceled: { tone: "danger" },
  expired: { tone: "danger" },
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
        second: "2-digit",
      }).format(date);
}

function formatAmount(value: string | number, locale: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? Math.abs(amount).toLocaleString(locale, { maximumFractionDigits: 8 })
    : "0";
}

function ReceiptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[42px] items-center justify-between gap-4 border-b border-[#e7eaf2] py-2.5 last:border-b-0">
      <span className="text-[12px] text-[#69718d]">{label}</span>
      <span className="text-right text-[13px] font-semibold text-[#0b1235]">{value}</span>
    </div>
  );
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
  const isWithdrawal = transaction.kind === "withdrawal";
  const isActivity = transaction.kind === "activity";
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";
  const numericAmount = Number(transaction.amount);
  const normalizedStatus = transaction.status.trim().toLowerCase();
  const status = STATUS_META[normalizedStatus] ?? { tone: "pending" as const };
  const copy = {
    fr: {
      kinds: { deposit: "Dépôt", withdrawal: "Retrait", activity: "Mouvement" },
      statuses: { approved: "approuvé", completed: "réussi", pending: "en attente", pending_2fa: "à vérifier", processing: "en cours", rejected: "rejeté", failed: "échoué", cancelled: "annulé", canceled: "annulé", expired: "expiré" },
      amount: isDeposit ? "Montant déposé" : isWithdrawal ? "Montant retiré" : "Montant",
      net: status.tone === "success" ? "Montant reçu" : "Montant net prévu",
      fees: "Montant des frais",
      method: "Moyen de paiement",
      description: "Détail",
      time: "Heure de transaction",
    },
    en: {
      kinds: { deposit: "Deposit", withdrawal: "Withdrawal", activity: "Activity" },
      statuses: { approved: "approved", completed: "successful", pending: "pending", pending_2fa: "requires verification", processing: "processing", rejected: "rejected", failed: "failed", cancelled: "cancelled", canceled: "cancelled", expired: "expired" },
      amount: isDeposit ? "Amount deposited" : isWithdrawal ? "Amount withdrawn" : "Amount",
      net: status.tone === "success" ? "Amount received" : "Expected net amount",
      fees: "Transaction fee",
      method: "Payment method",
      description: "Details",
      time: "Transaction time",
    },
    ar: {
      kinds: { deposit: "إيداع", withdrawal: "سحب", activity: "حركة" },
      statuses: { approved: "تمت الموافقة عليه", completed: "ناجح", pending: "قيد الانتظار", pending_2fa: "يتطلب التحقق", processing: "قيد المعالجة", rejected: "مرفوض", failed: "فشل", cancelled: "ملغي", canceled: "ملغي", expired: "منتهي" },
      amount: isDeposit ? "المبلغ المودع" : isWithdrawal ? "المبلغ المسحوب" : "المبلغ",
      net: status.tone === "success" ? "المبلغ المستلم" : "صافي المبلغ المتوقع",
      fees: "رسوم المعاملة",
      method: "طريقة الدفع",
      description: "التفاصيل",
      time: "وقت المعاملة",
    },
    zh: {
      kinds: { deposit: "充值", withdrawal: "提现", activity: "交易" },
      statuses: { approved: "已批准", completed: "成功", pending: "待处理", pending_2fa: "需验证", processing: "处理中", rejected: "已拒绝", failed: "失败", cancelled: "已取消", canceled: "已取消", expired: "已过期" },
      amount: isDeposit ? "充值金额" : isWithdrawal ? "提现金额" : "金额",
      net: status.tone === "success" ? "到账金额" : "预计到账金额",
      fees: "交易费用",
      method: "支付方式",
      description: "详情",
      time: "交易时间",
    },
  }[lang] ?? {
    kinds: { deposit: "Dépôt", withdrawal: "Retrait", activity: "Mouvement" },
    statuses: { approved: "approuvé", completed: "réussi", pending: "en attente", pending_2fa: "à vérifier", processing: "en cours", rejected: "rejeté", failed: "échoué", cancelled: "annulé", canceled: "annulé", expired: "expiré" },
    amount: isDeposit ? "Montant déposé" : isWithdrawal ? "Montant retiré" : "Montant",
    net: status.tone === "success" ? "Montant reçu" : "Montant net prévu",
    fees: "Montant des frais",
    method: "Moyen de paiement",
    description: "Détail",
    time: "Heure de transaction",
  };
  const kindLabel = copy.kinds[transaction.kind];
  const statusLabel = copy.statuses[normalizedStatus as keyof typeof copy.statuses] || normalizedStatus || copy.statuses.pending;
  const statusTitle = lang === "zh"
    ? `${kindLabel}${statusLabel}`
    : `${kindLabel} ${statusLabel}`;
  const statusClass = {
    success: "bg-[#00a651]",
    pending: "bg-[#5e3de9]",
    danger: "bg-[#e00000]",
  }[status.tone];
  const fallbackReference = `${isDeposit ? "A" : isWithdrawal ? "R" : "T"}${String(transaction.id).replace(/^(dep|wd|tx)-/, "")}`;
  const reference = transaction.reference?.trim() || fallbackReference;
  const rawMethod = transaction.paymentMethod?.trim();
  const method = rawMethod?.toLowerCase() === "nowpayments"
    ? "OkayPay"
    : rawMethod
    || (isDeposit ? "Canaux de recharge" : "USDT BEP20");
  const amountValue = Number.isFinite(numericAmount)
    ? `${isActivity ? (numericAmount < 0 ? "−" : "+") : ""}${formatAmount(transaction.amount, locale)} XOF`
    : "0 XOF";
  const receivedAmount = transaction.netAmount == null
    ? null
    : `${formatAmount(transaction.netAmount, locale)} XOF`;
  const feeAmount = transaction.fees == null
    ? null
    : `${formatAmount(transaction.fees, locale)} XOF`;
  return (
    <article
      className="overflow-hidden rounded-xl border border-[#dfe4f0] bg-white shadow-[0_8px_22px_rgba(11,18,53,.12)]"
      data-testid={`receipt-${transaction.kind}-${transaction.id}`}
    >
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[#e7eaf2] bg-[#f7f8fc] pl-4">
        <p className="truncate text-[12px] font-semibold text-[#0b1235]">{reference}</p>
        <span className={`shrink-0 rounded-bl-xl px-4 py-3 text-right text-[12px] font-bold text-white ${statusClass}`}>
          {statusTitle}
        </span>
      </div>
      <div className="px-4">
        <ReceiptField label={copy.amount} value={amountValue} />
        {isWithdrawal && receivedAmount && (
          <ReceiptField label={copy.net} value={receivedAmount} />
        )}
        {isWithdrawal && feeAmount && (
          <ReceiptField label={copy.fees} value={feeAmount} />
        )}
        {isActivity && transaction.description && (
          <ReceiptField label={copy.description} value={transaction.description} />
        )}
        {transaction.paymentMethod && (
          <ReceiptField label={copy.method} value={method} />
        )}
        <ReceiptField label={copy.time} value={formatDate(transaction.createdAt, lang)} />
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
