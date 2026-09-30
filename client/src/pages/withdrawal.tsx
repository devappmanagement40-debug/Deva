import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CreditCard, Loader2, ShieldCheck, Wifi } from "lucide-react";
import { getContent } from "@/lib/content";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import withdrawalHero from "@/assets/images/withdrawal-hero-reference.png";

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
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [, navigate] = useLocation();

  const currency = "USDT";

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
  const bep20Wallets = useMemo(
    () => wallets.filter((wallet) => wallet.paymentMethod === "USDT BEP20"),
    [wallets],
  );

  const { data: userProducts = [] } = useQuery<UserProduct[]>({
    queryKey: ["/api/user/products"],
  });

  const hasActiveProduct = userProducts.some((p) => p.status === "active");

  useEffect(() => {
    const savedWalletId = localStorage.getItem("selectedWalletId");
    if (savedWalletId && bep20Wallets.length > 0) {
      const wallet = bep20Wallets.find(w => w.id === parseInt(savedWalletId));
      if (wallet) setSelectedWallet(wallet);
      localStorage.removeItem("selectedWalletId");
    }
  }, [bep20Wallets]);

  useEffect(() => {
    if (selectedWallet && selectedWallet.paymentMethod !== "USDT BEP20") {
      setSelectedWallet(null);
      return;
    }
    if (!selectedWallet && bep20Wallets.length > 0) {
      const defaultWallet = bep20Wallets.find(w => w.isDefault);
      if (defaultWallet) setSelectedWallet(defaultWallet);
    }
  }, [bep20Wallets, selectedWallet]);

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; walletId: number }) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return res.json();
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
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.errorOccurred, variant: "destructive" });
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
    withdrawMutation.mutate({ amount: Number(amount), walletId: selectedWallet.id });
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
      className="ielp-withdrawal-page min-h-screen w-full overflow-hidden"
      style={{ maxWidth: 480, margin: "0 auto", background: "#f5f5f5", color: "#202124" }}
    >
      <section className="relative w-full" style={{ aspectRatio: "720 / 404" }}>
        <img
          src={withdrawalHero}
          alt=""
          className="block h-full w-full object-cover"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => navigate("/")}
          className="absolute left-[4%] top-[7.5%] flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#173d2e] shadow-md transition active:scale-95"
          aria-label="Retour au compte"
          data-testid="button-withdrawal-back"
        >
          <ChevronLeft className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => navigate("/withdrawal-history")}
          className="absolute"
          style={{ right: "3.4%", top: "7.5%", width: "14%", height: "29%" }}
          aria-label="Voir l’historique des retraits"
          data-testid="button-withdrawal-history"
        />
      </section>

      <section className="px-5 pt-[29px] pb-8">
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
                  <span className="text-[12px] font-semibold tracking-[.12em] opacity-90">USDT</span>
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
