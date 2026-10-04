import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import {
  HistoryDecor,
  HistoryPageHeader,
  ReceiptCard,
  ReceiptEmptyState,
  ReceiptLoadingState,
  type ReceiptTransaction,
} from "@/components/history-receipt";

interface Withdrawal {
  id: number;
  amount: string;
  netAmount?: string | null;
  fees?: string | null;
  status: string;
  paymentMethod?: string | null;
  accountNumber?: string | null;
  createdAt: string;
}

export default function WithdrawalHistoryPage() {
  const { t } = useI18n();
  const { data: withdrawals = [], isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
  });

  const receipts: ReceiptTransaction[] = withdrawals.map((withdrawal) => ({
    id: withdrawal.id,
    kind: "withdrawal",
    amount: withdrawal.amount,
    status: withdrawal.status,
    createdAt: withdrawal.createdAt,
    paymentMethod: withdrawal.paymentMethod || "USDT BEP20",
    accountNumber: withdrawal.accountNumber,
    fees: withdrawal.fees,
    netAmount: withdrawal.netAmount,
  }));

  return (
    <div className="min-h-screen bg-white">
      <HistoryPageHeader title={t.withdrawalHistory || "Historique des retraits"} backHref="/withdrawal" />
      <HistoryDecor>
        <section aria-live="polite">
          {isLoading ? (
            <ReceiptLoadingState />
          ) : receipts.length > 0 ? (
            receipts.map((receipt) => <ReceiptCard key={receipt.id} transaction={receipt} />)
          ) : (
            <ReceiptEmptyState kind="withdrawal" />
          )}
        </section>
      </HistoryDecor>
    </div>
  );
}