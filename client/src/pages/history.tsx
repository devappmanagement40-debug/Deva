import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { rebrandText } from "@/lib/content";
import {
  HistoryDecor,
  HistoryPageHeader,
  HistoryTabs,
  ReceiptCard,
  ReceiptEmptyState,
  ReceiptLoadingState,
  type HistoryTab,
  type ReceiptTransaction,
} from "@/components/history-receipt";

interface HistoryItem {
  id: string;
  category: string;
  amount: string;
  status: string;
  description?: string | null;
  createdAt: string;
  extra?: {
    fees?: string | null;
    netAmount?: string | null;
    paymentMethod?: string | null;
    reference?: string | null;
  };
}

function toReceipt(item: HistoryItem): ReceiptTransaction {
  return {
    id: item.id,
    kind: item.category === "withdrawal" ? "withdrawal" : "deposit",
    amount: item.amount,
    status: item.status,
    createdAt: item.createdAt,
    paymentMethod: item.extra?.paymentMethod,
    fees: item.extra?.fees,
    netAmount: item.extra?.netAmount,
    reference: item.extra?.reference,
  };
}

export default function HistoryPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<HistoryTab>("deposit");
  const { data: items = [], isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/history/all"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const visibleItems = activeTab === "activity"
    ? []
    : items.filter((item) => item.category === activeTab).map(toReceipt);

  const activityItems = items.filter(
    (item) => item.category !== "deposit" && item.category !== "withdrawal",
  );

  return (
    <div className="min-h-screen bg-white">
      <HistoryPageHeader
        title={t.transactionHistoryTitle || "Historique"}
        backHref="/account"
        tabs={(
          <HistoryTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            depositLabel={t.deposit}
            withdrawalLabel={t.withdraw}
            activityLabel={t.earnings}
          />
        )}
      />
      <HistoryDecor>
        <section className={activeTab !== "activity" ? "space-y-3" : ""} aria-live="polite">
          {isLoading ? (
            <ReceiptLoadingState />
          ) : activeTab !== "activity" && visibleItems.length > 0 ? (
            visibleItems.map((item) => <ReceiptCard key={item.id} transaction={item} />)
          ) : activeTab === "activity" && activityItems.length > 0 ? (
            activityItems.map((item) => <ActivityCard key={item.id} item={item} />)
          ) : (
            activeTab === "activity" ? <ActivityEmptyState /> : <ReceiptEmptyState kind={activeTab} />
          )}
        </section>
      </HistoryDecor>
    </div>
  );
}

function ActivityCard({ item }: { item: HistoryItem }) {
  const { lang } = useI18n();
  const amount = Number(item.amount);
  const locale = lang === "en" ? "en-US" : lang === "ar" ? "ar" : lang === "zh" ? "zh-CN" : "fr-FR";
  const safeAmount = Number.isFinite(amount)
    ? Math.abs(amount).toLocaleString(locale, { maximumFractionDigits: 8 })
    : "0";
  const date = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(item.createdAt));
  const sourceDescription = item.description || (lang === "en" ? "DIAMANT earnings" : "Gain DIAMANT");
  const localizedDescription = lang === "en"
    ? sourceDescription.replace(/crédité directement sur votre solde/gi, "credited directly to your balance")
    : sourceDescription;
  const description = rebrandText(localizedDescription);
  const reference = `T${item.id.replace(/^tx-/, "")}`;
  const signedAmount = `${amount < 0 ? "−" : "+"}${safeAmount} XOF`;
  return (
    <article className="min-h-[92px] border-b border-white bg-[#f3f3f3] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#202020]">{reference}</p>
          <p className="mt-2 truncate text-[12px] text-[#8a8a8a]">{description}</p>
          <p className="mt-2 text-[12px] text-[#8a8a8a]">{date}</p>
        </div>
        <p className={`shrink-0 text-[13px] ${amount < 0 ? "text-[#d13e3e]" : "text-[#16803b]"}`}>
          {signedAmount}
        </p>
      </div>
    </article>
  );
}

function ActivityEmptyState() {
  return (
    <div className="min-h-[92px] bg-white px-4 pt-3 text-center text-[14px] text-[#9a9a9a]">
      More data
    </div>
  );
}