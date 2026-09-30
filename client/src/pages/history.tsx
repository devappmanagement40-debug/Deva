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
    description: item.description,
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

  const visibleItems = items
    .filter((item) => activeTab === "activity"
      ? item.category !== "deposit" && item.category !== "withdrawal"
      : item.category === activeTab)
    .map(toReceipt);

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
        <section aria-live="polite">
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
  const safeAmount = Number.isFinite(amount) ? amount.toLocaleString(locale, { maximumFractionDigits: 8 }) : "0";
  const date = new Intl.DateTimeFormat(locale, {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(item.createdAt));
  const description = lang === "en"
    ? (item.description ?? "")
      .replace(/crédité directement sur votre solde/gi, "credited directly to your balance")
    : item.description;

  const reference = `T${item.id.replace(/^tx-/, "")}`;
  return (
    <article className="min-h-[92px] border-b border-white bg-[#f3f3f3] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#202020]">{reference}</p>
          <p className="mt-2 truncate text-[12px] text-[#8a8a8a]">{rebrandText(description || (lang === "en" ? "DIAMANT earnings" : "Gain DIAMANT"))}</p>
          <p className="mt-2 text-[12px] text-[#8a8a8a]">{date}</p>
        </div>
        <p className="shrink-0 text-[13px] text-[#16803b]">+{safeAmount} USDT</p>
      </div>
    </article>
  );
}

function ActivityEmptyState() {
  const { lang } = useI18n();
  return (
    <div className="min-h-[92px] bg-white px-4 pt-3 text-center text-[14px] text-[#9a9a9a]">
      More data
    </div>
  );
}