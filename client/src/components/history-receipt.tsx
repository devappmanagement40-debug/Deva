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

function formatDate(value: string | Date, lang: string, includeSeconds = false) {
  const date = new Date(value);
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  if (includeSeconds) options.second = "2-digit";
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale, options).format(date);
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
  return transaction.kind === "withdrawal"
    ? <WithdrawalReceipt transaction={transaction} lang={lang} />
    : <DepositReceipt transaction={transaction} lang={lang} />;
}

const DEPOSIT_STATUS_LABELS = {
  fr: { approved: "Approuvé", completed: "Terminé", pending: "En attente", pending_2fa: "Vérification requise", processing: "En cours", rejected: "Rejeté", failed: "Échec", cancelled: "Annulé", canceled: "Annulé", expired: "Expiré" },
  en: { approved: "Approved", completed: "Completed", pending: "Pending", pending_2fa: "Verification required", processing: "Processing", rejected: "Rejected", failed: "Failed", cancelled: "Cancelled", canceled: "Cancelled", expired: "Expired" },
  ar: { approved: "تمت الموافقة", completed: "مكتمل", pending: "قيد الانتظار", pending_2fa: "التحقق مطلوب", processing: "قيد المعالجة", rejected: "مرفوض", failed: "فشل", cancelled: "ملغي", canceled: "ملغي", expired: "منتهي" },
  zh: { approved: "已批准", completed: "已完成", pending: "处理中", pending_2fa: "需要验证", processing: "进行中", rejected: "已拒绝", failed: "失败", cancelled: "已取消", canceled: "已取消", expired: "已过期" },
};

const DEPOSIT_RECEIPT_COPY = {
  fr: { title: "Reçu de dépôt", amount: "Montant du dépôt", method: "Moyen de dépôt", id: "ID du dépôt", date: "Date", fallbackMethod: "Canal de dépôt" },
  en: { title: "Deposit receipt", amount: "Deposit amount", method: "Deposit method", id: "Deposit ID", date: "Date", fallbackMethod: "Deposit channel" },
  ar: { title: "إيصال الإيداع", amount: "مبلغ الإيداع", method: "طريقة الإيداع", id: "معرّف الإيداع", date: "التاريخ", fallbackMethod: "قناة الإيداع" },
  zh: { title: "存款收据", amount: "存款金额", method: "存款方式", id: "存款编号", date: "日期", fallbackMethod: "存款渠道" },
};

function DepositReceiptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[42px] items-center justify-between gap-4 border-b border-[#ebe9f7] py-2.5 last:border-b-0">
      <span className="text-[12px] font-medium text-[#5e3de9]">{label}</span>
      <span className="text-right text-[13px] font-semibold text-[#5e3de9]">{value}</span>
    </div>
  );
}

function DepositReceipt({ transaction, lang }: { transaction: ReceiptTransaction; lang: string }) {
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";
  const normalizedStatus = transaction.status.trim().toLowerCase();
  const statusLabels = DEPOSIT_STATUS_LABELS[lang as keyof typeof DEPOSIT_STATUS_LABELS] ?? DEPOSIT_STATUS_LABELS.fr;
  const copy = DEPOSIT_RECEIPT_COPY[lang as keyof typeof DEPOSIT_RECEIPT_COPY] ?? DEPOSIT_RECEIPT_COPY.fr;
  const statusLabel = statusLabels[normalizedStatus as keyof typeof statusLabels] || normalizedStatus || statusLabels.pending;
  const depositId = `A${String(transaction.id).replace(/^dep-/, "")}`;
  const rawMethod = transaction.paymentMethod?.trim();
  const method = rawMethod?.toLowerCase() === "nowpayments"
    ? "OkayPay"
    : rawMethod
    || copy.fallbackMethod;

  return (
    <article
      className="overflow-hidden rounded-xl border border-[#dedcf0] bg-white shadow-[0_8px_22px_rgba(11,18,53,.12)]"
      data-testid={`receipt-deposit-${transaction.id}`}
    >
      <div className="flex min-h-12 items-center justify-between gap-3 bg-gradient-to-r from-[#0b1235] to-[#5e3de9] px-5 py-2.5">
        <span className="text-[12px] font-semibold text-white/90">{copy.title}</span>
        <span className="shrink-0 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[12px] font-bold text-white">
          {statusLabel}
        </span>
      </div>
      <div className="px-5">
        <DepositReceiptField label={copy.amount} value={`${formatAmount(transaction.amount, locale)} XOF`} />
        <DepositReceiptField label={copy.method} value={method} />
        <DepositReceiptField label={copy.id} value={depositId} />
        <DepositReceiptField label={copy.date} value={formatDate(transaction.createdAt, lang, true)} />
      </div>
    </article>
  );
}

const WITHDRAWAL_COPY = {
  fr: {
    status: { approved: "Retrait réussi", completed: "Retrait réussi", pending: "Retrait en attente", pending_2fa: "Retrait à vérifier", processing: "Retrait en cours", rejected: "Retrait non réussi", failed: "Retrait échoué", cancelled: "Retrait annulé", canceled: "Retrait annulé", expired: "Retrait expiré" },
    gross: "Montant retiré",
    received: "Montant reçu",
    expectedNet: "Montant net prévu",
    fees: "Montant de la taxe",
    start: "Heure de début",
  },
  en: {
    status: { approved: "Withdrawal successful", completed: "Withdrawal successful", pending: "Withdrawal pending", pending_2fa: "Withdrawal needs verification", processing: "Withdrawal processing", rejected: "Withdrawal unsuccessful", failed: "Withdrawal failed", cancelled: "Withdrawal cancelled", canceled: "Withdrawal cancelled", expired: "Withdrawal expired" },
    gross: "Amount withdrawn",
    received: "Amount received",
    expectedNet: "Expected net amount",
    fees: "Tax amount",
    start: "Start time",
  },
  ar: {
    status: { approved: "تم السحب بنجاح", completed: "تم السحب بنجاح", pending: "السحب قيد الانتظار", pending_2fa: "السحب بحاجة إلى تحقق", processing: "السحب قيد المعالجة", rejected: "لم ينجح السحب", failed: "فشل السحب", cancelled: "تم إلغاء السحب", canceled: "تم إلغاء السحب", expired: "انتهت صلاحية السحب" },
    gross: "المبلغ المسحوب",
    received: "المبلغ المستلم",
    expectedNet: "صافي المبلغ المتوقع",
    fees: "مبلغ الضريبة",
    start: "وقت البدء",
  },
  zh: {
    status: { approved: "提现成功", completed: "提现成功", pending: "提现待处理", pending_2fa: "提现需验证", processing: "提现处理中", rejected: "提现未成功", failed: "提现失败", cancelled: "提现已取消", canceled: "提现已取消", expired: "提现已过期" },
    gross: "提现金额",
    received: "到账金额",
    expectedNet: "预计到账金额",
    fees: "税费金额",
    start: "开始时间",
  },
};

function WithdrawalReceipt({ transaction, lang }: { transaction: ReceiptTransaction; lang: string }) {
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";
  const normalizedStatus = transaction.status.trim().toLowerCase();
  const status = STATUS_META[normalizedStatus] ?? { tone: "pending" as const };
  const copy = WITHDRAWAL_COPY[lang as keyof typeof WITHDRAWAL_COPY] ?? WITHDRAWAL_COPY.fr;
  const statusTitle = copy.status[normalizedStatus as keyof typeof copy.status] || `Retrait ${normalizedStatus || "en cours"}`;
  const statusClass = {
    success: "bg-[#00a651]",
    pending: "bg-[#5e3de9]",
    danger: "bg-[#e00000]",
  }[status.tone];
  const amount = `${formatAmount(transaction.amount, locale)} XOF`;
  const netAmount = transaction.netAmount == null ? null : `${formatAmount(transaction.netAmount, locale)} XOF`;
  const fees = transaction.fees == null ? null : `${formatAmount(transaction.fees, locale)} XOF`;

  return (
    <article
      className="overflow-hidden rounded-xl border border-[#dfe4f0] bg-white shadow-[0_8px_22px_rgba(11,18,53,.12)]"
      data-testid={`receipt-withdrawal-${transaction.id}`}
    >
      <div className="flex h-12 justify-end border-b border-[#e7eaf2] bg-[#f7f8fc]">
        <span className={`rounded-bl-xl px-5 py-3 text-right text-[12px] font-bold text-white ${statusClass}`}>
          {statusTitle}
        </span>
      </div>
      <div className="px-5">
        <ReceiptField label={copy.gross} value={amount} />
        {netAmount && (
          <ReceiptField label={status.tone === "success" ? copy.received : copy.expectedNet} value={netAmount} />
        )}
        {fees && <ReceiptField label={copy.fees} value={fees} />}
        <ReceiptField label={copy.start} value={formatDate(transaction.createdAt, lang, true)} />
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
