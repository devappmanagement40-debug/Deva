import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/countries";
import { useI18n, type Lang } from "@/lib/i18n";
import { rebrandText } from "@/lib/content";
import type { Deposit, Withdrawal, Transaction } from "@shared/schema";
import { ReceiptCard, ReceiptEmptyState, ReceiptLoadingState } from "@/components/history-receipt";

interface TransactionHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTransactionDescription(description: string | null | undefined, lang: Lang) {
  const patterns = [
    {
      pattern: /^Crédit automatique — fin du cycle (.+)$/,
      labels: {
        fr: "Crédit automatique — fin du cycle : {name}",
        en: "Automatic credit — cycle completed: {name}",
        ar: "إضافة تلقائية — اكتمال دورة المنتج: {name}",
        zh: "自动入账——产品周期完成：{name}",
      },
    },
    {
      pattern: /^Collecte gains (.+)$/,
      labels: {
        fr: "Collecte gains {name}",
        en: "Collected earnings — {name}",
        ar: "تحصيل الأرباح — {name}",
        zh: "已领取收益 — {name}",
      },
    },
    {
      pattern: /^Collecte finale — (.+)$/,
      labels: {
        fr: "Collecte finale — {name}",
        en: "Final collection — {name}",
        ar: "التحصيل النهائي — {name}",
        zh: "最终领取 — {name}",
      },
    },
  ];

  for (const { pattern, labels } of patterns) {
    const match = description?.match(pattern);
    if (match) return rebrandText(labels[lang].replace("{name}", match[1]));
  }

  return rebrandText(description || "Gain DIAMANT");
}

export default function TransactionHistoryModal({ open, onClose }: TransactionHistoryModalProps) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState("deposits");

  const { data: deposits, isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits/history"],
    enabled: open && activeTab === "deposits",
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals/history"],
    enabled: open && activeTab === "withdrawals",
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: open && activeTab === "earnings",
  });

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t.transactionHistoryTitle}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid grid-cols-3 bg-[#edf7f0]">
            <TabsTrigger value="deposits">{t.deposit}</TabsTrigger>
            <TabsTrigger value="withdrawals">{t.withdraw}</TabsTrigger>
            <TabsTrigger value="earnings">{t.earnings}</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="deposits" className="mt-0 space-y-3">
              {depositsLoading ? (
                <ReceiptLoadingState />
              ) : deposits && deposits.length > 0 ? (
                deposits.map((deposit) => (
                  <ReceiptCard
                    key={deposit.id}
                    transaction={{
                      id: deposit.id,
                      kind: "deposit",
                      amount: deposit.amount,
                      status: deposit.status,
                      createdAt: deposit.createdAt,
                      paymentMethod: deposit.paymentMethod,
                       reference: deposit.reference,
                    }}
                  />
                ))
              ) : (
                <ReceiptEmptyState kind="deposit" />
              )}
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-0 space-y-3">
              {withdrawalsLoading ? (
                <ReceiptLoadingState />
              ) : withdrawals && withdrawals.length > 0 ? (
                withdrawals.map((withdrawal) => (
                  <ReceiptCard
                    key={withdrawal.id}
                    transaction={{
                      id: withdrawal.id,
                      kind: "withdrawal",
                      amount: withdrawal.amount,
                      status: withdrawal.status,
                      createdAt: withdrawal.createdAt,
                      accountNumber: withdrawal.accountNumber,
                      paymentMethod: "USDT BEP20",
                      fees: withdrawal.fees,
                      netAmount: withdrawal.netAmount,
                    }}
                  />
                ))
              ) : (
                <ReceiptEmptyState kind="withdrawal" />
              )}
            </TabsContent>

            <TabsContent value="earnings" className="mt-0 space-y-3">
              {transactionsLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <article key={transaction.id} className="min-h-[92px] border-b border-white bg-[#f3f3f3] px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-[#202020]">T{transaction.id}</p>
                        <p className="mt-2 truncate text-[12px] text-[#8a8a8a]">{formatTransactionDescription(transaction.description, lang)}</p>
                        <p className="mt-2 text-[12px] text-[#8a8a8a]">{formatDate(transaction.createdAt as unknown as string)}</p>
                      </div>
                      <p className="shrink-0 text-[13px] text-[#16803b]">
                        +{formatCurrency(parseFloat(transaction.amount), user.country)}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="min-h-[92px] bg-white px-4 pt-3 text-center text-[14px] text-[#9a9a9a]">
                  No more data
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
