import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Clock3, CreditCard, Loader2, ShieldCheck, Wifi } from "lucide-react";
import { getContent } from "@/lib/content";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";

interface WalletData {
  id: number;
  userId: number;
  accountName: string;
  accountNumber: string;
  paymentMethod: string;
  country: string;
  isDefault: boolean;
}

interface UserProduct {
  id: number;
  status: string;
}

function formatCardNumber(accountNumber: string) {
  const value = accountNumber.replace(/\s+/g, "");
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)} •••• •••• ${value.slice(-4)}`;
}

export default function WithdrawalPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number | "">("");
  const [transactionPin, setTransactionPin] = useState("");
  const [resetAccountPassword, setResetAccountPassword] = useState("");
  const [newTransactionPin, setNewTransactionPin] = useState("");
  const [confirmTransactionPin, setConfirmTransactionPin] = useState("");
  const [forceTransactionPinReset, setForceTransactionPinReset] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [, navigate] = useLocation();

  const currency = "XOF";

  const {
    data: transactionPinStatus,
    isLoading: transactionPinStatusLoading,
    refetch: refetchTransactionPinStatus,
  } = useQuery<{ hasPin: boolean; resetRequired: boolean }>({
    queryKey: ["/api/auth/transaction-pin-status", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/auth/transaction-pin-status", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Impossible de vérifier le PIN de retrait");
      return response.json();
    },
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const needsTransactionPinReset = forceTransactionPinReset || Boolean(
    transactionPinStatus && (!transactionPinStatus.hasPin || transactionPinStatus.resetRequired),
  );

  const { data: withdrawalSettings } = useQuery<{
    withdrawalEnabled: boolean;
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    withdrawalDays: string;
    maxWithdrawalsPerDay: number;
    minWithdrawal: number;
  }>({
    queryKey: ["/api/settings/withdrawal"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: allSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });

  const minWithdrawal = withdrawalSettings?.minWithdrawal ?? 1;
  const maxWithdrawal = parseInt(allSettings?.maxWithdrawal || "1000000");
  const withdrawalEnabled = withdrawalSettings?.withdrawalEnabled ?? true;
  const withdrawalStartHour = withdrawalSettings?.withdrawalStartHour ?? 9;
  const withdrawalEndHour = withdrawalSettings?.withdrawalEndHour ?? 17;
  const withdrawalDaysRaw = withdrawalSettings?.withdrawalDays ?? "1,2,3,4,5";

  // Convert "1,2,3,4,5" into a weekday range or a list of days
  const DAY_NAMES: Record<number, string> = {
    0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
    4: "Thursday", 5: "Friday", 6: "Saturday",
  };
  const allowedDayNums = withdrawalDaysRaw.split(",").map(d => parseInt(d.trim())).filter(n => !isNaN(n));
  const isConsecutiveWeekdays = JSON.stringify(allowedDayNums.sort()) === JSON.stringify([1,2,3,4,5]);
  const daysLabel = isConsecutiveWeekdays
    ? "Monday to Friday"
    : allowedDayNums.map(d => DAY_NAMES[d] ?? d).join(", ");

  const withdrawalWarningNoProduct = getContent(allSettings, "content_withdrawal_warningNoProduct", "You must have an active product to make a withdrawal.");

  const { data: wallets = [], isLoading: walletsLoading } = useQuery<WalletData[]>({
    queryKey: ["/api/wallets"],
    refetchOnWindowFocus: true,
  });
  const { data: activeMobileMoneyOperators = [] } = useQuery<string[]>({
    queryKey: ["/api/countries", user?.country, "operators", "mobile-money"],
    queryFn: async () => {
      if (!user?.country) return [];
      const response = await fetch(
        `/api/countries/${encodeURIComponent(user.country)}/operators?type=mobile-money`,
        { credentials: "include", cache: "no-store" },
      );
      if (!response.ok) throw new Error("Impossible de charger les opérateurs Mobile Money.");
      const values: unknown = await response.json();
      return Array.isArray(values)
        ? Array.from(new Set(values
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .map((value) => value.trim())))
        : [];
    },
    enabled: Boolean(user?.country),
  });
  const withdrawalWallets = useMemo(
    () => wallets.filter((wallet) => {
      if (wallet.paymentMethod === "USDT BEP20") return true;
      if (!wallet.paymentMethod.startsWith("Mobile Money - ")) return false;
      if (wallet.country.trim().toUpperCase() !== user?.country?.trim().toUpperCase()) return false;
      const operatorName = wallet.paymentMethod.slice("Mobile Money - ".length).trim();
      return activeMobileMoneyOperators.some(
        (operator) => operator.toLowerCase() === operatorName.toLowerCase(),
      );
    }),
    [wallets, activeMobileMoneyOperators, user?.country],
  );

  const { data: userProducts = [] } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  const hasActiveProduct = userProducts.some((p) => p.status === "active");

  const transactionPinResetMutation = useMutation({
    mutationFn: async (data: { accountPassword: string; newPin: string }) => {
      const response = await apiRequest("POST", "/api/auth/transaction-pin/reset", data);
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || t.errorOccurred);
      }
      return response.json();
    },
    onSuccess: async () => {
      setResetAccountPassword("");
      setNewTransactionPin("");
      setConfirmTransactionPin("");
      setForceTransactionPinReset(false);
      toast({ title: t.withdrawalPinResetSuccess });
      await Promise.all([refetchTransactionPinStatus(), refreshUser()]);
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
    },
  });

  useEffect(() => {
    const savedWalletId = localStorage.getItem("selectedWalletId");
    if (savedWalletId && withdrawalWallets.length > 0) {
      const wallet = withdrawalWallets.find(w => w.id === parseInt(savedWalletId, 10));
      if (wallet) setSelectedWallet(wallet);
      localStorage.removeItem("selectedWalletId");
    }
  }, [withdrawalWallets]);

  useEffect(() => {
    if (selectedWallet && !withdrawalWallets.some((wallet) => wallet.id === selectedWallet.id)) {
      setSelectedWallet(null);
      return;
    }
    if (!selectedWallet && withdrawalWallets.length > 0) {
      const defaultWallet = withdrawalWallets.find(w => w.isDefault) || withdrawalWallets[0];
      setSelectedWallet(defaultWallet);
    }
  }, [withdrawalWallets, selectedWallet]);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; walletId: number; transactionPassword: string }) => {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(result.message || t.errorOccurred) as Error & { code?: string };
        error.code = result.code;
        throw error;
      }
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: data?.payoutRequiresVerification ? t.withdrawalCreated : t.withdrawalSubmitted,
        description: data?.payoutRequiresVerification
          ? t.withdrawalCreatedDesc
          : t.withdrawalSubmittedDesc,
      });
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      setAmount("");
      setTransactionPin("");
    },
    onError: (error: Error) => {
      const code = (error as Error & { code?: string }).code;
      if (code === "TRANSACTION_PIN_RESET_REQUIRED") {
        setTransactionPin("");
        setForceTransactionPinReset(true);
        void refetchTransactionPinStatus();
        return;
      }
      toast({
        title: code === "INVALID_TRANSACTION_PIN" ? t.withdrawalPinIncorrect : error.message || t.errorOccurred,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!withdrawalEnabled) {
      toast({ title: t.errorOccurred, variant: "destructive" });
      return;
    }
    if (!hasActiveProduct) {
      toast({ title: withdrawalWarningNoProduct, variant: "destructive" });
      return;
    }
    if (!amount || amount < minWithdrawal) {
      toast({ title: t.invalidAmount, description: `${t.minAmountPrefix} ${minWithdrawal.toLocaleString()} ${currency}`, variant: "destructive" });
      return;
    }
    if (amount > maxWithdrawal) {
      toast({ title: "Amount too high", description: `The maximum amount is ${maxWithdrawal.toLocaleString()} ${currency}`, variant: "destructive" });
      return;
    }
    if (!selectedWallet) {
      toast({ title: "Select an account", description: "Please link a withdrawal account.", variant: "destructive" });
      return;
    }
    if (!transactionPin) {
      toast({ title: t.errTransactionPasswordRequired, variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({
      amount: Number(amount),
      walletId: selectedWallet.id,
      transactionPassword: transactionPin,
    });
  };

  if (walletsLoading) return null;
  if (!user) return null;

  const earningsBalance = parseFloat(user?.totalEarnings || "0");

  // Use admin instructions when configured, otherwise generate the defaults.
  const instructions = [
    getContent(allSettings, "content_withdrawal_instruction1", `1. Minimum withdrawal amount: ${minWithdrawal.toLocaleString()} ${currency}.`),
    getContent(allSettings, "content_withdrawal_instruction2", `2. One withdrawal per day is allowed.`),
    getContent(allSettings, "content_withdrawal_instruction3", "3. You will receive the full requested amount."),
    getContent(allSettings, "content_withdrawal_instruction4", "4. Withdrawals are available from 09:00 to 17:00."),
    getContent(allSettings, "content_withdrawal_instruction5", "5. Use a valid USDT BEP20 wallet address."),
    getContent(allSettings, "content_withdrawal_instruction6", "6. Review the withdrawal conditions before submitting."),
  ];

  return (
    <main
      className="ielp-withdrawal-page flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden"
      style={{ maxWidth: 480, margin: "0 auto", background: "#f5f5f5", color: "#202124" }}
    >
      <header
        className="ielp-withdrawal-header sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-[#e5e5e5] bg-white px-4 shadow-sm"
        style={{
          minHeight: "calc(64px + env(safe-area-inset-top))",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#653de9] transition hover:bg-[#f4f1ff] active:scale-95"
          aria-label="Retour au compte"
          data-testid="button-withdrawal-back"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#85818f]">DIAMANT</span>
          <h1 className="mt-0.5 truncate text-[18px] font-semibold leading-tight text-[#202124]">{t.withdrawTitle}</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/withdrawal-history")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#653de9] transition hover:bg-[#f4f1ff] active:scale-95"
          aria-label={t.withdrawalHistory}
          data-testid="button-withdrawal-history"
        >
          <Clock3 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        </button>
      </header>

      <section
        className="ielp-withdrawal-content min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-8"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
      >
        <p className="font-normal" style={{ fontSize: 20, lineHeight: 1.2 }}>
          Mon solde
        </p>

        <div
          className="mt-[18px] flex items-center bg-white"
          style={{ height: 81, borderRadius: 10 }}
        >
          <div className="flex h-full w-[34%] items-center justify-center">
            <svg width="64" height="58" viewBox="0 0 64 58" fill="none" aria-hidden="true">
              <path d="M5 5v45h53" stroke="#202124" strokeWidth="3" strokeLinecap="round" />
              <path d="M13 43h7V34h7v-9h7v-8h7v-9" stroke="#747474" strokeWidth="3" />
              <path d="M10 43 49 9" stroke="#06a92f" strokeWidth="2.5" strokeLinecap="round" />
              <path d="m43 10 7-2-2 7" stroke="#06a92f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p
            className="flex-1 pr-3 font-normal"
            style={{ color: "#00ae2f", fontSize: 26, lineHeight: 1, whiteSpace: "nowrap" }}
            data-testid="text-balance"
          >
            {currency} {earningsBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
        </div>

        {transactionPinStatusLoading ? (
          <div className="mt-[29px] rounded-[14px] bg-white p-5 text-center" role="status">
            {t.loading}
          </div>
        ) : needsTransactionPinReset ? (
          <form
            className="mt-[29px] rounded-[14px] bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (newTransactionPin !== confirmTransactionPin) {
                toast({ title: t.errPasswordMismatch, variant: "destructive" });
                return;
              }
              transactionPinResetMutation.mutate({
                accountPassword: resetAccountPassword,
                newPin: newTransactionPin,
              });
            }}
            data-testid="form-reset-withdrawal-pin"
          >
            <h2 className="font-semibold" style={{ fontSize: 20, lineHeight: 1.25 }}>
              {t.withdrawalPinResetTitle}
            </h2>
            <p className="mt-2 text-sm text-[#626262]">
              {t.withdrawalPinResetDescription}
            </p>

            <label className="mt-5 block text-sm font-medium" htmlFor="pin-reset-account-password">
              {t.withdrawalPinResetAccountPassword}
            </label>
            <input
              id="pin-reset-account-password"
              type="password"
              autoComplete="current-password"
              value={resetAccountPassword}
              onChange={(event) => setResetAccountPassword(event.target.value)}
              placeholder={t.passwordPlaceholder}
             className="mt-2 h-[51px] w-full rounded-md border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
              data-testid="input-pin-reset-account-password"
            />

            <label className="mt-4 block text-sm font-medium" htmlFor="pin-reset-new">
              {t.withdrawalPinResetNew}
            </label>
            <input
              id="pin-reset-new"
              type="password"
              autoComplete="new-password"
              value={newTransactionPin}
              onChange={(event) => setNewTransactionPin(event.target.value)}
              placeholder={t.authPinLabel}
              maxLength={72}
              className="mt-2 h-[51px] w-full rounded-md border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
              data-testid="input-pin-reset-new"
            />

            <label className="mt-4 block text-sm font-medium" htmlFor="pin-reset-confirm">
              {t.withdrawalPinResetConfirm}
            </label>
            <input
              id="pin-reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmTransactionPin}
              onChange={(event) => setConfirmTransactionPin(event.target.value)}
              placeholder={t.withdrawalPinResetConfirm}
              maxLength={72}
              className="mt-2 h-[51px] w-full rounded-md border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
              data-testid="input-pin-reset-confirm"
            />

            <button
              type="submit"
              disabled={
                transactionPinResetMutation.isPending ||
                !resetAccountPassword ||
                !newTransactionPin ||
                !confirmTransactionPin
              }
              className="mt-5 h-[51px] w-full rounded-full bg-[#653de9] px-4 font-semibold text-white shadow-[0_4px_14px_rgba(101,61,233,0.35)] disabled:opacity-50"
              data-testid="button-save-withdrawal-pin"
            >
              {transactionPinResetMutation.isPending ? t.saving : t.withdrawalPinResetButton}
            </button>
          </form>
        ) : (
          <>
        <div className="mt-[29px]">
          <p className="font-normal" style={{ fontSize: 20, lineHeight: 1.2 }}>
            Please select your bank card
          </p>
          {selectedWallet ? (
            <button
              type="button"
              onClick={() => navigate("/wallet?from=withdrawal")}
              className="ielp-withdrawal-card relative mt-[16px] block w-full overflow-hidden text-left transition-transform active:scale-[.98]"
              style={{
                aspectRatio: "1.586 / 1",
                minHeight: 196,
                borderRadius: 18,
                padding: "20px 22px 18px",
                color: "#ffffff",
                background: "linear-gradient(135deg, #063d2b 0%, #087a38 48%, #00c853 100%)",
                boxShadow: "0 12px 24px rgba(0, 91, 44, .28)",
              }}
              aria-label={`Moyen de retrait ${selectedWallet.paymentMethod}, ${selectedWallet.accountName}`}
              data-testid="button-select-wallet"
            >
              <div
                className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full"
                style={{ background: "rgba(255,255,255,.12)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full"
                style={{ border: "1px solid rgba(255,255,255,.13)" }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={27} strokeWidth={1.6} />
                  <span className="text-[16px] font-semibold tracking-[.08em]">DIAMANT</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} strokeWidth={1.6} className="opacity-80" />
                  <span className="text-[12px] font-semibold tracking-[.12em] opacity-90">XOF</span>
                </div>
              </div>
              <div className="relative mt-5 flex items-center gap-4">
                <div
                  className="h-[32px] w-[43px] rounded-[6px]"
                  style={{
                    background: "linear-gradient(135deg, #f4d995 0%, #c7983b 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(120,74,12,.25)",
                  }}
                  aria-hidden="true"
                >
                  <div className="mt-[9px] h-px bg-[#a97825]/50" />
                  <div className="mt-[6px] h-px bg-[#a97825]/50" />
                </div>
                <Wifi size={23} strokeWidth={2} className="rotate-90 opacity-80" aria-hidden="true" />
              </div>
              <p className="relative mt-4 truncate text-[18px] font-medium tracking-[.12em]">
                {formatCardNumber(selectedWallet.accountNumber)}
              </p>
              <div className="relative mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[.18em] opacity-70">Titulaire</p>
                  <p className="truncate text-[13px] font-semibold uppercase tracking-[.08em]">{selectedWallet.accountName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] uppercase tracking-[.18em] opacity-70">Réseau</p>
                  <p className="text-[12px] font-semibold">{selectedWallet.paymentMethod}</p>
                </div>
                <ChevronRight size={22} strokeWidth={1.5} className="shrink-0 opacity-70" aria-hidden="true" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/wallet?from=withdrawal")}
              className="mt-[16px] flex w-full items-center bg-white text-left"
              style={{ height: 59, border: "1px solid #dddddd", borderRadius: 10, padding: "0 14px" }}
              data-testid="button-select-wallet"
            >
              <CreditCard size={29} strokeWidth={2.6} color="#5f5f5f" className="shrink-0" />
              <span className="ielp-withdrawal-muted ml-[11px] flex-1 truncate font-normal" style={{ color: "#343434", fontSize: 18, letterSpacing: 1.2 }}>
                ------- ---------------
              </span>
              <ChevronRight size={28} strokeWidth={1.5} color="#969696" className="shrink-0" />
            </button>
          )}
        </div>

        <div className="mt-[29px]">
          <p className="font-normal" style={{ fontSize: 20, lineHeight: 1.2 }}>
            Enter the withdrawal amount
          </p>
          <div
            className="mt-[16px] flex w-full items-center bg-[#f9f9f9]"
            style={{ height: 51, border: "1px solid #dddddd" }}
          >
            <span className="ielp-withdrawal-muted pl-0 pr-3 font-normal" style={{ color: "#686e79", fontSize: 20 }}>
              {currency}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="Enter the withdrawal amount"
              className="min-w-0 flex-1 bg-transparent pr-2 font-normal outline-none placeholder:text-[#a6abb4]"
              style={{ color: "#404040", fontSize: 19 }}
              data-testid="input-withdrawal-amount"
            />
          </div>

          <div className="mt-[12px] flex items-center justify-between px-[10px]">
            <p className="ielp-withdrawal-muted font-normal" style={{ color: "#626262", fontSize: 15 }}>
              Amount received: {currency} {amount ? Number(amount).toLocaleString() : "0"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className="block font-normal" htmlFor="withdrawal-transaction-pin" style={{ fontSize: 20, lineHeight: 1.2 }}>
            {t.authPinLabel}
          </label>
          <input
            id="withdrawal-transaction-pin"
            type="password"
            autoComplete="off"
            value={transactionPin}
            onChange={(event) => setTransactionPin(event.target.value)}
            placeholder={t.authPinLabel}
            className="mt-[16px] h-[51px] w-full rounded-md border border-[#dddddd] bg-[#f9f9f9] px-3 font-normal outline-none focus:border-[#00ae2f]"
            style={{ color: "#404040", fontSize: 19 }}
            data-testid="input-withdrawal-pin"
          />
        </div>

        {!withdrawalEnabled && (
          <div className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
            Withdrawals are currently disabled.
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={withdrawMutation.isPending || !withdrawalEnabled}
          aria-describedby={!hasActiveProduct ? "withdrawal-product-notice" : undefined}
          className="mt-[24px] block font-bold text-white disabled:opacity-50"
          style={{
            width: "73.3%",
            marginLeft: "auto",
            marginRight: "auto",
            height: 62,
            borderRadius: 999,
            background: "#00bd08",
            boxShadow: "0 2px 4px rgba(0, 134, 29, 0.12)",
            fontSize: 32,
            lineHeight: 1,
          }}
          data-testid="button-submit-withdrawal"
        >
          {withdrawMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Traitement…
            </span>
          ) : "Confirmer"}
        </button>

        {!hasActiveProduct && (
          <p id="withdrawal-product-notice" className="sr-only">
            {withdrawalWarningNoProduct}
          </p>
        )}
          </>
        )}

        <div className="mt-[14px] space-y-0 pb-2">
          {instructions.map((line, i) => (
            <p key={i} className="ielp-withdrawal-muted font-normal" style={{ color: "#545960", fontSize: 15, lineHeight: 1.52 }}>
              {line}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
