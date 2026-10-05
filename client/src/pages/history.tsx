import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
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
  const description = item.description || "Gain DIAMANT";
  return (
    <ReceiptCard
      transaction={{
        id: item.id,
        kind: "activity",
        amount: item.amount,
        status: item.status,
        createdAt: item.createdAt,
        reference: `T${item.id.replace(/^tx-/, "")}`,
        description,
      }}
    />
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