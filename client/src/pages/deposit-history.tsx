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
import { isUsdtRecord } from "@/lib/usdt-records";

interface Deposit {
  id: number;
  amount: string;
  amountUsdt?: string | null;
  currency?: string | null;
  status: string;
  paymentMethod?: string | null;
  accountNumber?: string | null;
  reference?: string | null;
  createdAt: string;
}

export default function DepositHistoryPage() {
  const { t } = useI18n();
  const { data: deposits = [], isLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
  });

  const receipts: ReceiptTransaction[] = deposits.filter(isUsdtRecord).map((deposit) => ({
    id: deposit.id,
    kind: "deposit",
    amount: deposit.amount,
    amountUsdt: deposit.amountUsdt,
    currency: "USDT",
    status: deposit.status,
    createdAt: deposit.createdAt,
    paymentMethod: deposit.paymentMethod,
    accountNumber: deposit.accountNumber,
    reference: deposit.reference,
  }));

  return (
    <div className="min-h-screen bg-white">
      <HistoryPageHeader title={t.depositHistory || "Deposit history"} backHref="/deposit" replaceBack />
      <HistoryDecor>
        <section className="space-y-3" aria-live="polite">
          {isLoading ? (
            <ReceiptLoadingState />
          ) : receipts.length > 0 ? (
            receipts.map((receipt) => <ReceiptCard key={receipt.id} transaction={receipt} />)
          ) : (
            <ReceiptEmptyState kind="deposit" />
          )}
        </section>
      </HistoryDecor>
    </div>
  );
}