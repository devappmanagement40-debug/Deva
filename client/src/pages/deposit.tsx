import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Camera, Check, ChevronRight, Copy, CreditCard, History, Info, Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { localeForLang, useI18n } from "@/lib/i18n";
import depositHero from "@assets/generated_images/diamant-deposit-hero.jpg";
import tetherIcon from "@/assets/crypto/tether.png";
import usdCoinIcon from "@/assets/crypto/usd-coin.png";
import bnbIcon from "@/assets/crypto/bnb.png";
import ethereumIcon from "@/assets/crypto/ethereum.png";
import polygonIcon from "@/assets/crypto/polygon.png";
import paypalUsdIcon from "@/assets/crypto/paypal-usd.png";
import tronIcon from "@/assets/crypto/tron.png";

const CURRENCY = "USDT";
const ACCENT_GREEN = "#32c95b";
const DEFAULT_DEPOSIT_AMOUNTS = [3500, 5000, 7000, 10000, 15000, 20000, 50000, 70000];

function parseDepositPresetAmounts(value: string | undefined): number[] {
  const amounts = (value || "")
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isSafeInteger(entry) && entry > 0);

  return amounts.length > 0 ? amounts : DEFAULT_DEPOSIT_AMOUNTS;
}

type DepositView = "main" | "currency" | "crypto-payment" | "issue";

type CryptoCurrency = {
  code: string;
  label: string;
  icon: string;
  networkIcon?: string;
};

type CryptoPayment = {
  depositId: number;
  paymentId: string;
  payAddress: string;
  payAmount: string | number;
  payCurrency: string;
  payinExtraId?: string;
  network?: string;
  qrCode: string;
};

const CRYPTO_CURRENCIES: CryptoCurrency[] = [
  { code: "usdtbsc", label: "BEP20-USDT", icon: tetherIcon, networkIcon: bnbIcon },
  { code: "usdtmatic", label: "POLYGON-USDT", icon: tetherIcon, networkIcon: polygonIcon },
  { code: "matic", label: "POLYGON", icon: polygonIcon },
  { code: "usdc", label: "POLYGON-USDC", icon: usdCoinIcon, networkIcon: polygonIcon },
  { code: "usdcbsc", label: "BEP20-USDC", icon: usdCoinIcon, networkIcon: bnbIcon },
  { code: "bnbbsc", label: "BNB", icon: bnbIcon },
  { code: "usdterc20", label: "ETH-USDT", icon: tetherIcon, networkIcon: ethereumIcon },
  { code: "usdcerc20", label: "ETH-USDC", icon: usdCoinIcon, networkIcon: ethereumIcon },
  { code: "pyusd", label: "ETH-PYUSD", icon: paypalUsdIcon, networkIcon: ethereumIcon },
  { code: "eth", label: "ETH", icon: ethereumIcon },
  { code: "usdttrc20", label: "TRC20-USDT", icon: tetherIcon, networkIcon: tronIcon },
  { code: "trx", label: "TRX", icon: tronIcon },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="ielp-deposit-section-title mb-4 flex items-center gap-2" style={{ color: "#151515", fontSize: 14 }}>
      <span className="ielp-brand-marker h-6 w-[5px] rounded-full" style={{ background: ACCENT_GREEN }} />
      <span>{children}</span>
    </div>
  );
}

function LabelledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
}) {
  return (
    <label className="mb-6 block">
      <span className="ielp-deposit-form-label mb-3 block font-semibold" style={{ color: "#2b2b2b", fontSize: 18 }}>
        <span style={{ color: "#ea4f55" }}>* </span>{label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-0 border-b bg-transparent px-0 pb-2 outline-none placeholder:text-[#777]"
        style={{ borderColor: "#e8e8e8", color: "#222", fontSize: 17 }}
      />
    </label>
  );
}

export default function DepositPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const proofInput = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<DepositView>("main");
  const [amount, setAmount] = useState("");
  const [walletNumber, setWalletNumber] = useState(user?.phone || "");
  const [issueAmount, setIssueAmount] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPayment | null>(null);
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState<CryptoCurrency | null>(null);
  const [pendingCurrencyCode, setPendingCurrencyCode] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"address" | "memo" | null>(null);

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const minDeposit = Number.parseInt(settings.minDeposit || "18", 10) || 18;
  const depositPresetAmounts = parseDepositPresetAmounts(settings.depositPresetAmounts);

  const createDeposit = useMutation({
    mutationFn: async (payload: { amount: number; accountNumber: string; screenshot?: string }) => {
      const response = await apiRequest("POST", "/api/deposits", {
        amount: payload.amount,
        accountName: user?.fullName || user?.phone || "Client DIAMANT",
        accountNumber: payload.accountNumber,
        paymentMethod: "Deposit bank",
        channelName: "Deposit bank",
        country: user?.country || "CD",
        screenshot: payload.screenshot || null,
        reference: payload.accountNumber,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "The deposit could not be submitted.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      toast({
        title: "Deposit recorded",
        description: "Your recharge request is being reviewed.",
      });
      setView("main");
      setProof(null);
      setProofName("");
      setIssueAmount("");
    },
    onError: (error: Error) => {
      toast({ title: "Unable to submit deposit", description: error.message, variant: "destructive" });
    },
  });

  const createCryptoDeposit = useMutation({
    mutationFn: async (currency: CryptoCurrency) => {
      const response = await apiRequest("POST", "/api/crypto-deposits", {
        amount: Number(amount),
        payCurrency: currency.code,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "The crypto payment could not be created.");
      }
      return response.json() as Promise<CryptoPayment>;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      setCryptoPayment(payment);
      setView("crypto-payment");
    },
    onError: (error: Error) => {
      toast({ title: "Payment unavailable", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setPendingCurrencyCode(null);
    },
  });

  const chooseProof = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Image required", description: "Please select a proof image.", variant: "destructive" });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Image too large", description: "The proof image must not exceed 3 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProof(String(reader.result));
      setProofName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submitMainDeposit = () => {
    const parsedAmount = Number(amount);
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount < minDeposit) {
      toast({
        title: "Montant invalide",
        description: `The minimum deposit is ${minDeposit.toLocaleString(localeForLang(lang))} ${CURRENCY}.`,
        variant: "destructive",
      });
      return;
    }
    setView("currency");
  };

  useEffect(() => {
    if (!copiedField) return;
    const timeout = window.setTimeout(() => setCopiedField(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [copiedField]);

  const copyText = async (value: string, field: "address" | "memo", label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Clipboard unavailable");
      }
      setCopiedField(field);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: `Unable to copy ${label.toLowerCase()}`, variant: "destructive" });
    }
  };

  const copyPaymentAddress = () => {
    if (!cryptoPayment?.payAddress) return;
    void copyText(cryptoPayment.payAddress, "address", "Address");
  };

  const copyPaymentMemo = () => {
    if (!cryptoPayment?.payinExtraId) return;
    void copyText(cryptoPayment.payinExtraId, "memo", "Memo / tag");
  };

  const submitIssue = () => {
    const parsedAmount = Number(issueAmount.replace(/[^\d]/g, ""));
    if (!walletNumber.trim() || !parsedAmount || !proof) {
      toast({
        title: "Missing information",
        description: "Add your wallet number, amount, and proof.",
        variant: "destructive",
      });
      return;
    }
    if (parsedAmount < minDeposit) {
      toast({
        title: "Montant invalide",
        description: `The minimum deposit is ${minDeposit.toLocaleString(localeForLang(lang))} ${CURRENCY}.`,
        variant: "destructive",
      });
      return;
    }
    createDeposit.mutate({ amount: parsedAmount, accountNumber: walletNumber, screenshot: proof });
  };

  if (!user) return null;

  if (view === "crypto-payment" && cryptoPayment) {
    const selectedCurrencyLabel = selectedCryptoCurrency?.label || cryptoPayment.payCurrency.toUpperCase();
    return (
      <main className="ielp-deposit-page min-h-screen bg-[#f3f8f4] pb-10" style={{ color: "#173f26" }}>
        <header className="flex h-[78px] items-center gap-3 bg-[#087a38] px-4 text-white shadow-[0_2px_8px_rgba(0,75,35,.2)]">
          <button
            type="button"
            onClick={() => setView("currency")}
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95"
            aria-label="Back to currency selection"
            data-testid="button-crypto-payment-back"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 pr-11 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">DIAMANT deposit</p>
            <h1 className="mt-0.5 text-[19px] font-semibold">Send payment</h1>
          </div>
        </header>

        <div className="mx-auto w-full max-w-xl px-4">
          <section className="mt-4 overflow-hidden rounded-[22px] border border-[#dcebe0] bg-white shadow-[0_10px_28px_rgba(0,70,30,.08)]">
            <div className="border-b border-[#e5efe7] bg-[#f8fcf9] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#698173]">Amount to send</p>
                  <p className="mt-1 text-[26px] font-bold tracking-tight text-[#087a38]">
                    {Number(cryptoPayment.payAmount).toLocaleString(undefined, { maximumFractionDigits: 8 })} <span className="text-[16px]">{cryptoPayment.payCurrency.toUpperCase()}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#e4f6e9] px-3 py-1.5 text-[12px] font-semibold text-[#087a38]">
                  <ShieldCheck size={15} />
                  Secure payment
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[13px] text-[#53705d]">
                <span className="h-2 w-2 rounded-full bg-[#20b957]" />
                Send on <span className="font-semibold text-[#173f26]">{selectedCurrencyLabel}</span> network only
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-[16px] border border-[#e1eee4] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#698173]">Scan to pay</p>
                    <p className="mt-1 text-[13px] text-[#66746b]">Use your wallet app to scan this QR code.</p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf7ee] text-[#087a38]">
                    <WalletCards size={18} />
                  </div>
                </div>
                <div className="ielp-qr-code-surface mx-auto mt-4 flex h-[190px] w-[190px] items-center justify-center rounded-[18px] border border-[#e0ebe2] bg-white p-3 shadow-[0_4px_14px_rgba(0,70,30,.06)]">
                  <img src={cryptoPayment.qrCode} alt={`QR code for ${selectedCurrencyLabel} payment`} className="h-full w-full rounded-[8px]" />
                </div>
              </div>

              <div className="mt-4 rounded-[16px] border border-[#cfe5d5] bg-[#f7fcf8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#53705d]">Payment address</p>
                    <p className="mt-1 text-[12px] text-[#789082]">{selectedCurrencyLabel}</p>
                  </div>
                  <span className="rounded-full bg-[#e2f4e7] px-2.5 py-1 text-[11px] font-semibold text-[#087a38]">Required</span>
                </div>
                <p className="mt-3 break-all rounded-[10px] border border-[#dcebe0] bg-white px-3 py-3 font-mono text-[13px] leading-5 text-[#173f26]">
                  {cryptoPayment.payAddress}
                </p>
                <button
                  type="button"
                  onClick={copyPaymentAddress}
                   className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ff0000] text-[15px] font-semibold text-white shadow-[0_4px_10px_rgba(255,0,0,.18)] transition hover:brightness-105 active:scale-[.98]"
                  data-testid="button-copy-crypto-address"
                >
                  {copiedField === "address" ? <Check size={18} /> : <Copy size={18} />}
                  {copiedField === "address" ? "Address copied" : "Copy address"}
                </button>
              </div>

              {(cryptoPayment.payinExtraId || cryptoPayment.network) && (
                <div className="mt-3 grid gap-3 rounded-[16px] border border-[#e1eee4] bg-[#fbfdfb] p-4 text-[13px]">
                  {cryptoPayment.network && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#698173]">Network</span>
                      <span className="font-semibold uppercase text-[#173f26]">{cryptoPayment.network}</span>
                    </div>
                  )}
                  {cryptoPayment.payinExtraId && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#698173]">Memo / tag</span>
                        <button
                          type="button"
                          onClick={copyPaymentMemo}
                          className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-[#087a38] transition hover:bg-[#eaf7ee] active:scale-95"
                          aria-label="Copy memo or tag"
                          data-testid="button-copy-crypto-memo"
                        >
                          {copiedField === "memo" ? <Check size={15} /> : <Copy size={15} />}
                          {copiedField === "memo" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-1 break-all rounded-lg bg-[#f1f7f2] px-3 py-2 font-mono font-semibold text-[#173f26]">{cryptoPayment.payinExtraId}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <div className="mt-4 flex gap-3 rounded-[16px] border border-[#ff0000] bg-[#fff5f5] px-4 py-3.5 text-[#ff0000]">
            <AlertTriangle size={19} className="mt-0.5 shrink-0 text-[#ff0000]" />
            <div className="text-[13px] leading-5">
              <p className="font-semibold">Double-check before sending</p>
              <p className="mt-0.5">Only send <strong>{selectedCurrencyLabel}</strong> through the matching network. Another network can permanently lose your funds.</p>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 px-1 text-[12px] leading-5 text-[#718177]">
            <Info size={16} className="mt-0.5 shrink-0 text-[#087a38]" />
            <p>Your deposit will be credited automatically after the network confirms the transaction. Keep this page until the payment is complete.</p>
          </div>
        </div>
      </main>
    );
  }

  if (view === "currency") {
    return (
      <main className="ielp-deposit-page flex h-[calc(100dvh-0.5rem)] max-h-[calc(100dvh-0.5rem)] flex-col overflow-hidden bg-[#f3f8f4]" style={{ color: "#173f26" }}>
        <header className="flex h-[76px] shrink-0 items-center gap-3 bg-[#087a38] px-4 text-white shadow-[0_2px_8px_rgba(0,75,35,.2)]">
          <button
            type="button"
            onClick={() => setView("main")}
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95"
            aria-label="Back to deposit amount"
            data-testid="button-currency-back"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 pr-11 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">DIAMANT deposit</p>
            <h1 className="mt-0.5 text-[19px] font-semibold">Choose a currency</h1>
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 px-3 pb-2">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[22px] border border-t-0 border-[#dcebe0] bg-white shadow-[0_10px_28px_rgba(0,70,30,.08)]">
            <div className="flex shrink-0 items-center gap-3 border-b border-[#e5efe7] bg-[#f8fcf9] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e4f6e9] text-[#087a38]">
                <WalletCards size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#698173]">Deposit amount</p>
                <p className="mt-0.5 truncate text-[19px] font-bold text-[#087a38]">{Number(amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} USDT</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#e4f6e9] px-2 py-1 text-[10px] font-semibold text-[#087a38]">Step 2 of 2</span>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5eee7] px-4 py-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#173f26]">Select payment network</h2>
                  <p className="mt-0.5 text-[12px] text-[#6b7d70]">Choose the exact network used by your wallet.</p>
                </div>
              </div>
              <ShieldCheck size={21} className="shrink-0 text-[#20a554]" />
            </div>
            {createCryptoDeposit.isPending && selectedCryptoCurrency && (
              <div role="status" className="flex shrink-0 items-center gap-3 border-b border-[#cfe5d5] bg-[#eef9f1] px-4 py-2.5 text-[12px] font-medium text-[#087a38]">
                <Loader2 size={17} className="animate-spin" />
                <span>Preparing your {selectedCryptoCurrency.label} payment…</span>
              </div>
            )}
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-6">
              {CRYPTO_CURRENCIES.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => {
                    setSelectedCryptoCurrency(currency);
                    setPendingCurrencyCode(currency.code);
                    createCryptoDeposit.mutate(currency);
                  }}
                  disabled={createCryptoDeposit.isPending}
                  aria-busy={pendingCurrencyCode === currency.code}
                  aria-label={`Pay with ${currency.label}`}
                  className="group flex min-h-0 w-full items-center gap-2 border-b border-r border-[#e5eee7] px-3 text-left transition hover:bg-[#f7fcf8] active:bg-[#eaf8ee] disabled:cursor-wait disabled:opacity-60"
                  data-testid={`button-currency-${currency.code}`}
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e2ece4] bg-white shadow-[0_2px_7px_rgba(0,0,0,.06)]">
                    <img src={currency.icon} alt="" className="h-7 w-7 object-contain" aria-hidden="true" />
                    {currency.networkIcon && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm">
                        <img src={currency.networkIcon} alt="" className="h-[10px] w-[10px] object-contain" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-[#183c25]">{currency.label}</span>
                      {currency.networkIcon && <span className="shrink-0 rounded-full bg-[#f0f7f1] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#6a8270]">Network</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#789082]">Compatible wallet network required</span>
                  </span>
                  {pendingCurrencyCode === currency.code ? (
                    <Loader2 size={17} className="shrink-0 animate-spin text-[#087a38]" aria-hidden="true" />
                  ) : (
                    <ChevronRight size={18} strokeWidth={1.8} className="shrink-0 text-[#789b83] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (view === "issue") {
    return (
      <main className="ielp-deposit-page min-h-screen bg-[#f5f5f5] pb-10" style={{ color: "#252525" }}>
        <header className="flex h-[116px] items-center gap-3 bg-white px-5">
          <button
            onClick={() => setView("main")}
            className="flex h-10 w-8 items-center justify-center active:scale-95"
            aria-label="Back to deposit"
            data-testid="button-issue-back"
          >
            <ArrowLeft size={31} strokeWidth={1.7} />
          </button>
          <h1 className="ielp-deposit-issue-title font-normal" style={{ color: "#0bad32", fontSize: 20 }}>Recharge issue</h1>
        </header>

        <section className="mx-5 mt-6 rounded-[10px] bg-white px-5 pb-10 pt-6 shadow-[0_1px_4px_rgba(0,0,0,.03)]">
          <LabelledInput
            label="Wallet number"
            value={walletNumber}
            onChange={setWalletNumber}
            placeholder="Enter your wallet number"
          />
          <LabelledInput
            label="Recharge amount"
            value={issueAmount}
            onChange={setIssueAmount}
            placeholder="Enter the recharge amount"
            type="number"
          />
          <div>
            <p className="ielp-deposit-form-label mb-4 font-semibold" style={{ color: "#2b2b2b", fontSize: 18 }}>
              <span style={{ color: "#ea4f55" }}>* </span>Recharge proof
            </p>
            <input ref={proofInput} className="hidden" type="file" accept="image/*" onChange={chooseProof} />
            <button
              type="button"
              onClick={() => proofInput.current?.click()}
              className="flex h-[123px] w-full flex-col items-center justify-center rounded-[10px] border-2 border-dashed active:opacity-75"
              style={{ borderColor: "#d6d6d6", color: proof ? ACCENT_GREEN : "#a1a5ae" }}
              data-testid="button-upload-deposit-proof"
            >
              {proof ? (
                <>
                  <img src={proof} alt="Selected proof" className="mb-2 h-[74px] max-w-[180px] rounded object-cover" />
                  <span className="max-w-[85%] truncate text-sm">{proofName}</span>
                </>
              ) : (
                <span className="flex items-center gap-2" style={{ fontSize: 17 }}>
                  <Camera size={27} fill="#a1a5ae" strokeWidth={1.6} /> Click to upload
                </span>
              )}
            </button>
          </div>
        </section>

        <button
          onClick={submitIssue}
          disabled={createDeposit.isPending}
          className="mx-auto mt-5 flex h-[44px] w-[66%] items-center justify-center rounded-[8px] font-semibold text-white shadow-sm transition active:scale-[.98] disabled:opacity-70"
          style={{ background: "#00b80f", fontSize: 16 }}
          data-testid="button-submit-deposit-issue"
        >
          {createDeposit.isPending ? "Submitting…" : "Submit"}
        </button>

        <section className="mx-5 mt-7">
          <h2 className="mb-1 font-bold" style={{ fontSize: 19, lineHeight: 1.55 }}>
            Please submit a clear USDT deposit proof:
          </h2>
          <div className="h-[3px] w-full bg-[#d5d5d5]" />
          <div className="bg-[#f8f9fa] px-4 pb-5 pt-4 text-[14px] leading-6 text-[#686868]">
            Include the wallet address, amount, network, and transaction reference so the team can verify your payment.
          </div>
          <div className="mt-8 rounded-[10px] bg-white px-5 py-5 text-[14px] leading-6 text-[#686868]">
            <p>If you have a recharge order that was not received, please submit the recharge information.</p>
            <p className="mt-2">1. Your wallet number</p>
            <p>2. Recharge proof</p>
            <p>3. The latest recharge order has been processing for more than 20 minutes</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="ielp-deposit-page min-h-screen bg-[#f4f4f4] pb-9" style={{ color: "#171717" }}>
      <section className="relative h-[282px] overflow-hidden bg-[#dceef7]">
        <img src={depositHero} alt="DIAMANT electric charging station" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/30 to-transparent" />
        <div className="absolute inset-x-0 top-5 flex items-center justify-between px-5">
          <Link href="/">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/35 backdrop-blur-[1px] active:scale-95"
              aria-label="Back to home"
              data-testid="button-deposit-back"
            >
              <ArrowLeft size={30} strokeWidth={1.6} />
            </button>
          </Link>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-normal" style={{ fontSize: 18 }}>RECHARGE</h1>
          <Link href="/deposit-history">
            <button
              className="flex h-11 w-11 items-center justify-center active:scale-95"
              aria-label="Deposit history"
              data-testid="button-deposit-history"
            >
              <History size={31} strokeWidth={1.45} />
            </button>
          </Link>
        </div>
      </section>

      <section className="mx-1.5 -mt-0 rounded-[5px] bg-white px-[14px] pb-[14px] pt-[15px]">
        <SectionTitle>Recharge amount</SectionTitle>
        <div className="flex h-[52px] items-center border px-5" style={{ borderColor: "#72cf91", background: "#fafafa", fontSize: 20 }}>
          <span className="mr-3 text-[#555]">{CURRENCY}</span>
          <input
            type="number"
            value={amount}
            min={minDeposit}
            onChange={(event) => setAmount(event.target.value)}
            className="min-w-0 flex-1 bg-transparent font-medium outline-none"
            aria-label="Recharge amount"
            data-testid="input-deposit-amount"
          />
        </div>
        <div className="mt-5 grid grid-cols-4 gap-x-[10px] gap-y-[10px]">
          {depositPresetAmounts.map((preset) => {
            const selected = amount !== "" && Number(amount) === preset;
            return (
              <button
                key={preset}
                onClick={() => setAmount(String(preset))}
                className="ielp-deposit-preset h-[55px] rounded-[7px] border font-normal transition active:scale-[.97]"
                data-selected={selected ? "true" : "false"}
                style={{
                  borderColor: ACCENT_GREEN,
                  color: selected ? "#fff" : "#656565",
                  background: selected ? ACCENT_GREEN : "#fff",
                  fontSize: "clamp(13px, 4.1vw, 19px)",
                  boxShadow: selected ? "0 3px 8px rgba(50,201,91,.25)" : "none",
                }}
                data-testid={`button-preset-amount-${preset}`}
              >
                {preset.toLocaleString(localeForLang(lang))}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-1.5 mt-[18px] min-h-[150px] rounded-[5px] bg-white px-[14px] pt-[14px]">
        <SectionTitle>Recharge method</SectionTitle>
        <button
          className="flex h-[56px] w-full items-center rounded-[10px] px-5 text-left text-white shadow-[0_3px_7px_rgba(44,185,86,.2)] transition active:scale-[.985]"
          style={{ background: ACCENT_GREEN }}
          data-testid="button-deposit-method"
        >
          <span className="mr-4 flex h-7 w-7 items-center justify-center rounded bg-white/20">
            <CreditCard size={25} fill="white" strokeWidth={1.6} />
          </span>
          <span className="flex-1" style={{ fontSize: 20 }}>Deposit bank</span>
          <Check size={24} strokeWidth={2.7} />
        </button>
      </section>

      <button
        onClick={submitMainDeposit}
        disabled={createDeposit.isPending}
        className="mx-auto mt-5 flex h-[48px] w-[51%] items-center justify-center rounded-full font-normal text-white shadow-[0_3px_8px_rgba(0,180,15,.18)] transition active:scale-[.98] disabled:opacity-70"
        style={{ background: "#00b80f", fontSize: 19 }}
        data-testid="button-confirm-deposit"
      >
          {createDeposit.isPending ? "Submitting…" : "Pay"}
      </button>
      <button
        onClick={() => setView("issue")}
        className="mx-auto mt-3 block text-center active:opacity-70"
        style={{ color: "#0c9b2e", fontSize: 17 }}
        data-testid="button-deposit-issue"
      >
        Payment delayed? Click here
      </button>

      <section className="mx-[14px] mt-9 text-[15px] leading-[1.55] text-[#555]">
        <p>1. The minimum deposit is {minDeposit.toLocaleString(localeForLang(lang))} {CURRENCY}. Deposits below this amount will not be credited.</p>
        <p>2. The wallet number entered on the deposit page must be the same one used for payment.</p>
        <p>3. Always use the most recent account number for payments and avoid using expired account information.</p>
        <p>4. Read the payment platform instructions carefully and follow them exactly.</p>
        <p>5. If your deposit is not credited immediately after the transfer, upload your payment information on the deposit page or contact customer service.</p>
      </section>
    </main>
  );
}