import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Camera, Check, ChevronRight, Copy, History, Info, Loader2, Phone, ShieldCheck, WalletCards } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatDepositGuidanceContent } from "@/lib/deposit-guidance";
import { apiRequest } from "@/lib/queryClient";
import { getContent } from "@/lib/content";
import { localeForLang, useI18n } from "@/lib/i18n";
import type { Country, PaymentNumber } from "@shared/schema";
import tetherIcon from "@/assets/crypto/tether.png";
import bnbIcon from "@/assets/crypto/bnb.png";

const CURRENCY = "XOF";
const ACCENT_GREEN = "#32c95b";
const DEPOSIT_BACK_BUTTON_CLASS =
  "flex items-center justify-center rounded-full bg-[#8000ff] text-white shadow-sm transition hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8000ff] focus-visible:ring-offset-2";
const DEFAULT_DEPOSIT_AMOUNTS = [3500, 5000, 7000, 10000, 15000, 20000, 50000, 70000];

function parseDepositPresetAmounts(value: string | undefined): number[] {
  const amounts = (value || "")
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isSafeInteger(entry) && entry > 0);

  return amounts.length > 0 ? amounts : DEFAULT_DEPOSIT_AMOUNTS;
}

function getCountryFlagEmoji(countryCode: string): string | null {
  const normalized = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;

  return Array.from(normalized, (letter) =>
    String.fromCodePoint(letter.charCodeAt(0) + 127397),
  ).join("");
}

type DepositView = "main" | "currency" | "crypto-payment" | "mobile-money" | "issue";

type DepositMethodSelection =
  | { type: "mobile-money"; countryCode: string }
  | { type: "crypto"; currencyCode: string };

type DepositCountryOption = Pick<Country, "code" | "name">;

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
  { code: "usdtbsc", label: "USDT BEP20", icon: tetherIcon, networkIcon: bnbIcon },
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

export default function DepositPage({ startInIssue = false }: { startInIssue?: boolean }) {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const proofInput = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<DepositView>(startInIssue ? "issue" : "main");
  const [amount, setAmount] = useState("");
  const [issueAmount, setIssueAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [depositNumber, setDepositNumber] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPayment | null>(null);
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState<CryptoCurrency | null>(null);
  const [pendingCurrencyCode, setPendingCurrencyCode] = useState<string | null>(null);
  const [selectedDepositMethod, setSelectedDepositMethod] = useState<DepositMethodSelection | null>(null);
  const [mobileMoneyCountryCode, setMobileMoneyCountryCode] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<PaymentNumber | null>(null);
  const [payerName, setPayerName] = useState(user?.fullName || "");
  const [payerPhone, setPayerPhone] = useState(user?.phone || "");
  const [mobileTransactionId, setMobileTransactionId] = useState("");
  const [copiedField, setCopiedField] = useState<"address" | "memo" | null>(null);

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const minDeposit = Number.parseInt(settings.minDeposit || "18", 10) || 18;
  const depositPresetAmounts = parseDepositPresetAmounts(settings.depositPresetAmounts);

  const { data: mobileDepositCountries = [], isLoading: countriesLoading, isError: countriesError } = useQuery<DepositCountryOption[]>({
    queryKey: ["/api/deposit-countries"],
    staleTime: 0,
  });

  const mobileMoneyCountry = mobileDepositCountries.find(
    (country) => country.code.toUpperCase() === mobileMoneyCountryCode?.toUpperCase(),
  );

  const { data: mobileMoneyOperators = [], isLoading: operatorsLoading, isError: operatorsError } = useQuery<PaymentNumber[]>({
    queryKey: ["/api/payment-numbers", mobileMoneyCountryCode],
    queryFn: async () => {
      if (!mobileMoneyCountryCode) return [];
      const response = await fetch(`/api/payment-numbers?country=${encodeURIComponent(mobileMoneyCountryCode)}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Impossible de charger les opérateurs Mobile Money.");
      return response.json();
    },
    enabled: view === "mobile-money" && Boolean(mobileMoneyCountryCode),
    staleTime: 0,
  });

  useEffect(() => {
    if (user?.fullName) setPayerName((current) => current || user.fullName);
    if (user?.phone) setPayerPhone((current) => current || user.phone);
  }, [user?.fullName, user?.phone]);

  const createDepositIssue = useMutation({
    mutationFn: async (payload: { amount: number; transactionId: string; depositNumber: string; screenshot: string }) => {
      const response = await apiRequest("POST", "/api/deposit-issues", {
        amount: payload.amount,
        transactionId: payload.transactionId,
        depositNumber: payload.depositNumber,
        screenshot: payload.screenshot,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Impossible d'envoyer le signalement.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      toast({
        title: "Signalement envoyé",
        description: "Votre déclaration de dépôt est en cours de vérification.",
      });
      if (startInIssue) {
        navigate("/service");
      } else {
        setView("main");
      }
      setTransactionId("");
      setDepositNumber("");
      setProof(null);
      setProofName("");
      setIssueAmount("");
    },
    onError: (error: Error) => {
      toast({ title: "Impossible d'envoyer le signalement", description: error.message, variant: "destructive" });
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

  const createMobileMoneyDeposit = useMutation({
    mutationFn: async () => {
      if (!user || !selectedOperator || !mobileMoneyCountryCode) {
        throw new Error("Choisissez un pays et un opérateur Mobile Money.");
      }
      const response = await apiRequest("POST", "/api/deposits", {
        amount: Number(amount),
        accountName: payerName.trim(),
        accountNumber: payerPhone.trim(),
        country: mobileMoneyCountryCode,
        paymentMethod: selectedOperator.operatorName,
        depositChannelId: selectedOperator.channelId,
        paymentNumberId: selectedOperator.id,
        reference: mobileTransactionId.trim(),
        screenshot: proof,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Impossible d’envoyer la demande de dépôt.");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      toast({
        title: "Demande de dépôt envoyée",
        description: "Le paiement Mobile Money sera vérifié par l’administration.",
      });
      setView("main");
      setSelectedOperator(null);
      setSelectedDepositMethod(null);
      setMobileMoneyCountryCode(null);
      setMobileTransactionId("");
      setProof(null);
      setProofName("");
    },
    onError: (error: Error) => {
      toast({ title: "Dépôt Mobile Money impossible", description: error.message, variant: "destructive" });
    },
  });

  const chooseProof = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Fichier non valide", description: "Choisissez une image JPG, PNG ou WebP.", variant: "destructive" });
      input.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "L'image doit faire moins de 3 Mo.", variant: "destructive" });
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast({ title: "Image illisible", description: "Choisissez une autre image depuis votre galerie.", variant: "destructive" });
        return;
      }
      setProof(reader.result);
      setProofName(file.name);
    };
    reader.onerror = () => {
      toast({ title: "Image illisible", description: "Choisissez une autre image depuis votre galerie.", variant: "destructive" });
    };
    reader.readAsDataURL(file);
    input.value = "";
  };

  const submitMainDeposit = () => {
    const parsedAmount = Number(amount);
    if (!amount.trim() || !Number.isSafeInteger(parsedAmount) || parsedAmount < minDeposit) {
      toast({
        title: "Montant invalide",
        description: `Saisissez un montant entier d’au moins ${minDeposit.toLocaleString(localeForLang(lang))} ${CURRENCY}.`,
        variant: "destructive",
      });
      return;
    }
    if (!selectedDepositMethod) {
      toast({
        title: "Choisissez un canal de dépôt",
        description: "Sélectionnez un pays Mobile Money ou USDT avant de continuer.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDepositMethod.type === "crypto") {
      const currency = CRYPTO_CURRENCIES.find((item) => item.code === selectedDepositMethod.currencyCode);
      if (!currency) {
        toast({ title: "Moyen de dépôt indisponible", variant: "destructive" });
        return;
      }
      setSelectedCryptoCurrency(currency);
      setPendingCurrencyCode(currency.code);
      createCryptoDeposit.mutate(currency);
      return;
    }

    const country = mobileDepositCountries.find(
      (item) => item.code.toUpperCase() === selectedDepositMethod.countryCode.toUpperCase(),
    );
    if (!country) {
      setSelectedDepositMethod(null);
      toast({ title: "Ce canal Mobile Money n’est plus disponible.", variant: "destructive" });
      return;
    }
    openMobileMoney(country.code);
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

  const openMobileMoney = (countryCode?: string) => {
    if (!countryCode) return;
    setMobileMoneyCountryCode(countryCode);
    setSelectedOperator(null);
    setPayerName(user?.fullName || "");
    setPayerPhone(user?.phone || "");
    setMobileTransactionId("");
    setProof(null);
    setProofName("");
    setView("mobile-money");
  };

  const submitMobileMoneyDeposit = () => {
    if (!selectedOperator) {
      toast({ title: "Choisissez un opérateur Mobile Money", variant: "destructive" });
      return;
    }
    if (!payerName.trim() || !payerPhone.trim() || !mobileTransactionId.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Renseignez le nom, le numéro utilisé pour payer et la référence de transaction.",
        variant: "destructive",
      });
      return;
    }
    createMobileMoneyDeposit.mutate();
  };

  const submitIssue = () => {
    const parsedAmount = Number(issueAmount);
    const cleanTransactionId = transactionId.trim();
    const cleanDepositNumber = depositNumber.trim();
    if (!cleanTransactionId || !cleanDepositNumber || !Number.isSafeInteger(parsedAmount) || parsedAmount <= 0 || !proof) {
      toast({
        title: "Informations manquantes",
        description: "Renseignez l’identifiant de transaction, le montant et le numéro de dépôt, puis ajoutez la capture.",
        variant: "destructive",
      });
      return;
    }
    if (parsedAmount < minDeposit) {
      toast({
        title: "Montant invalide",
        description: `Le montant minimum est de ${minDeposit.toLocaleString(localeForLang(lang))} ${CURRENCY}.`,
        variant: "destructive",
      });
      return;
    }
    createDepositIssue.mutate({
      amount: parsedAmount,
      transactionId: cleanTransactionId,
      depositNumber: cleanDepositNumber,
      screenshot: proof,
    });
  };

  const leaveIssueForm = () => {
    if (startInIssue) {
      navigate("/service");
      return;
    }
    setView("main");
  };

  if (!user) return null;

  if (view === "crypto-payment" && cryptoPayment) {
    const selectedCurrencyLabel = selectedCryptoCurrency?.label || cryptoPayment.payCurrency.toUpperCase();
    return (
      <main className="ielp-deposit-page min-h-screen bg-[#f3f8f4] pb-10" style={{ color: "#173f26" }}>
        <header className="flex h-[78px] items-center gap-3 bg-[#087a38] px-4 text-white shadow-[0_2px_8px_rgba(0,75,35,.2)]">
          <button
            type="button"
            onClick={() => setView("main")}
            className={`${DEPOSIT_BACK_BUTTON_CLASS} h-11 w-11`}
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
            className={`${DEPOSIT_BACK_BUTTON_CLASS} h-11 w-11`}
            aria-label="Back to deposit amount"
            data-testid="button-currency-back"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 pr-11 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">DIAMANT deposit</p>
          <h1 className="mt-0.5 text-[19px] font-semibold">Choose a deposit method</h1>
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
                <p className="mt-0.5 truncate text-[19px] font-bold text-[#087a38]">{Number(amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} XOF</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#e4f6e9] px-2 py-1 text-[10px] font-semibold text-[#087a38]">Step 2 of 2</span>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5eee7] px-4 py-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[17px] font-semibold text-[#173f26]">Select how to deposit</h2>
                  <p className="mt-0.5 text-[12px] text-[#6b7d70]">Choose Mobile Money or USDT on the BEP20 network.</p>
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
            <div className="grid min-h-0 flex-1 content-start grid-cols-1 gap-3 overflow-y-auto p-4">
              <button
                type="button"
                onClick={() => {
                  const countryCode = selectedDepositMethod?.type === "mobile-money"
                    ? selectedDepositMethod.countryCode
                    : mobileDepositCountries[0]?.code;
                  openMobileMoney(countryCode);
                }}
                className="group flex min-h-[92px] w-full items-center gap-4 rounded-2xl border border-[#dcebe0] bg-white px-4 py-4 text-left transition hover:bg-[#f7fcf8] active:bg-[#eaf8ee]"
                data-testid="button-deposit-mobile-money"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e4f6e9] text-[#087a38]">
                  <Phone size={24} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[#183c25]">Mobile Money</span>
                  <span className="mt-1 block text-[12px] leading-5 text-[#789082]">
                    Pay using an available mobile operator in your country.
                  </span>
                </span>
                <ChevronRight size={19} className="shrink-0 text-[#789b83]" />
              </button>

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
                  className="group flex min-h-[92px] w-full items-center gap-4 rounded-2xl border border-[#dcebe0] bg-white px-4 py-4 text-left transition hover:bg-[#f7fcf8] active:bg-[#eaf8ee] disabled:cursor-wait disabled:opacity-60"
                  data-testid={`button-currency-${currency.code}`}
                >
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#e2ece4] bg-white shadow-[0_2px_7px_rgba(0,0,0,.06)]">
                    <img src={currency.icon} alt="" className="h-9 w-9 object-contain" aria-hidden="true" />
                    {currency.networkIcon && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm">
                        <img src={currency.networkIcon} alt="" className="h-3 w-3 object-contain" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-[#183c25]">{currency.label}</span>
                    <span className="mt-1 block text-[12px] text-[#789082]">Generate a deposit address for the BEP20 network.</span>
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

  if (view === "mobile-money") {
    return (
      <main className="ielp-deposit-page min-h-screen bg-[#f3f8f4] pb-8" style={{ color: "#173f26" }}>
        <header className="flex h-[76px] items-center gap-3 bg-[#087a38] px-4 text-white shadow-[0_2px_8px_rgba(0,75,35,.2)]">
          <button
            type="button"
            onClick={() => {
              setSelectedOperator(null);
              setView("main");
            }}
            className={`${DEPOSIT_BACK_BUTTON_CLASS} h-11 w-11`}
            aria-label="Back to deposit methods"
            data-testid="button-mobile-money-back"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 pr-11 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">DIAMANT deposit</p>
            <h1 className="mt-0.5 text-[19px] font-semibold">
              Mobile Money{mobileMoneyCountry ? ` — ${mobileMoneyCountry.name}` : ""}
            </h1>
          </div>
        </header>

        <div className="mx-auto w-full max-w-xl px-4">
          <section className="mt-4 rounded-2xl border border-[#dcebe0] bg-white p-4 shadow-[0_10px_28px_rgba(0,70,30,.06)]">
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#698173]">Deposit amount</p>
            <p className="mt-1 text-[24px] font-bold text-[#087a38]">
              {Number(amount).toLocaleString(localeForLang(lang))} {CURRENCY}
            </p>
          </section>

          {!selectedOperator ? (
            <section className="mt-4 rounded-2xl border border-[#dcebe0] bg-white p-4 shadow-[0_10px_28px_rgba(0,70,30,.06)]">
              <h2 className="text-[16px] font-semibold text-[#173f26]">Choose a mobile operator</h2>
              <p className="mt-1 text-[13px] text-[#6b7d70]">
                Available operators are configured for {mobileMoneyCountry?.name || "the selected country"}.
              </p>
              {operatorsLoading ? (
                <div role="status" className="mt-4 flex items-center gap-2 text-sm text-[#6b7d70]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading operators…
                </div>
              ) : operatorsError ? (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Could not load the available operators. Please try again.</p>
              ) : mobileMoneyOperators.length === 0 ? (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  No active Mobile Money number is configured for {mobileMoneyCountry?.name || "this country"} yet.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {mobileMoneyOperators.map((operator) => (
                    <button
                      key={operator.id}
                      type="button"
                      onClick={() => setSelectedOperator(operator)}
                      className="flex w-full items-center gap-3 rounded-xl border border-[#e1eee4] p-3 text-left transition hover:bg-[#f7fcf8] active:scale-[.99]"
                      data-testid={`button-mobile-operator-${operator.id}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e4f6e9] text-[#087a38]">
                        {operator.logoUrl
                          ? <img src={operator.logoUrl} alt="" className="h-full w-full object-contain" />
                          : <Phone size={19} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-[#183c25]">{operator.operatorName}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-[#789082]">{operator.phone}</span>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-[#789b83]" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="mt-4 rounded-2xl border border-[#cfe5d5] bg-white p-4 shadow-[0_10px_28px_rgba(0,70,30,.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#698173]">Send payment to</p>
                    <h2 className="mt-1 text-[17px] font-bold text-[#173f26]">{selectedOperator.operatorName}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOperator(null)}
                    className="text-[12px] font-semibold text-[#087a38] underline"
                    data-testid="button-change-mobile-operator"
                  >
                    Change
                  </button>
                </div>
                <p className="mt-4 break-all rounded-xl bg-[#f7fcf8] px-3 py-3 font-mono text-[16px] font-semibold text-[#173f26]">
                  {selectedOperator.phone}
                </p>
                <p className="mt-2 text-[13px] text-[#6b7d70]">
                  Account holder: <span className="font-semibold text-[#173f26]">{selectedOperator.ownerName}</span>
                </p>
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-800">
                  Send exactly {Number(amount).toLocaleString(localeForLang(lang))} {CURRENCY}, then submit the transaction reference below.
                </p>
              </section>

              <section className="mt-4 space-y-3 rounded-2xl border border-[#dcebe0] bg-white p-4 shadow-[0_10px_28px_rgba(0,70,30,.06)]">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[#294434]">Name used for payment</span>
                  <input
                    value={payerName}
                    onChange={(event) => setPayerName(event.target.value)}
                    autoComplete="name"
                    className="h-11 w-full rounded-lg border border-[#dcebe0] px-3 text-sm outline-none focus:border-[#32c95b]"
                    data-testid="input-mobile-payer-name"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[#294434]">Your payment phone number</span>
                  <input
                    type="tel"
                    value={payerPhone}
                    onChange={(event) => setPayerPhone(event.target.value)}
                    autoComplete="tel"
                    className="h-11 w-full rounded-lg border border-[#dcebe0] px-3 text-sm outline-none focus:border-[#32c95b]"
                    data-testid="input-mobile-payer-phone"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-[#294434]">Transaction reference</span>
                  <input
                    value={mobileTransactionId}
                    onChange={(event) => setMobileTransactionId(event.target.value)}
                    className="h-11 w-full rounded-lg border border-[#dcebe0] px-3 text-sm outline-none focus:border-[#32c95b]"
                    placeholder="Reference from your payment receipt"
                    data-testid="input-mobile-transaction-reference"
                  />
                </label>
                <div>
                  <input
                    ref={proofInput}
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={chooseProof}
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => proofInput.current?.click()}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#9acba7] px-3 py-2 text-sm font-medium text-[#087a38]"
                    data-testid="button-upload-mobile-proof"
                  >
                    <Camera size={17} />
                    {proof ? proofName : "Add payment screenshot (optional)"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={submitMobileMoneyDeposit}
                  disabled={createMobileMoneyDeposit.isPending}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#087a38] px-4 text-[15px] font-semibold text-white shadow-sm transition active:scale-[.99] disabled:opacity-60"
                  data-testid="button-submit-mobile-deposit"
                >
                  {createMobileMoneyDeposit.isPending ? <Loader2 size={18} className="animate-spin" /> : "I have paid — submit for review"}
                </button>
              </section>
            </>
          )}
        </div>
      </main>
    );
  }

  if (view === "issue") {
    return (
      <main className="ielp-deposit-page min-h-screen bg-[#f5f5f5] pb-10" style={{ color: "#252525" }}>
        <header className="flex h-[116px] items-center gap-3 bg-white px-5">
          <button
            onClick={leaveIssueForm}
            className={`${DEPOSIT_BACK_BUTTON_CLASS} h-10 w-10`}
            aria-label="Retour"
            data-testid="button-issue-back"
          >
            <ArrowLeft size={31} strokeWidth={1.7} />
          </button>
          <h1 className="ielp-deposit-issue-title font-normal" style={{ color: "#0bad32", fontSize: 20 }}>Signaler un dépôt non reçu</h1>
        </header>

        <section className="mx-5 mt-6 rounded-[10px] bg-white px-5 pb-10 pt-6 shadow-[0_1px_4px_rgba(0,0,0,.03)]">
          <LabelledInput
            label="ID de transaction"
            value={transactionId}
            onChange={setTransactionId}
            placeholder="Saisissez l’identifiant de transaction"
          />
          <LabelledInput
            label="Montant du dépôt (XOF)"
            value={issueAmount}
            onChange={setIssueAmount}
            placeholder="Saisissez le montant envoyé"
            type="number"
          />
          <LabelledInput
            label="Numéro de dépôt destinataire"
            value={depositNumber}
            onChange={setDepositNumber}
            placeholder="Numéro sur lequel vous avez envoyé le paiement"
          />
          <div>
            <p className="ielp-deposit-form-label mb-4 font-semibold" style={{ color: "#2b2b2b", fontSize: 18 }}>
              <span style={{ color: "#ea4f55" }}>* </span>Capture du paiement
            </p>
            <input ref={proofInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseProof} tabIndex={-1} />
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
                  <Camera size={27} fill="#a1a5ae" strokeWidth={1.6} /> Ajouter une capture
                </span>
              )}
            </button>
          </div>
        </section>

        <button
          onClick={submitIssue}
          disabled={createDepositIssue.isPending}
          className="mx-auto mt-5 flex h-[44px] w-[66%] items-center justify-center rounded-[8px] font-semibold text-white shadow-sm transition active:scale-[.98] disabled:opacity-70"
          style={{ background: "#00b80f", fontSize: 16 }}
          data-testid="button-submit-deposit-issue"
        >
          {createDepositIssue.isPending ? "Envoi…" : "Envoyer le signalement"}
        </button>

        <section className="mx-5 mt-7">
          <h2 className="mb-1 font-bold" style={{ fontSize: 19, lineHeight: 1.55 }}>
            Informations nécessaires à la vérification
          </h2>
          <div className="h-[3px] w-full bg-[#d5d5d5]" />
          <div className="bg-[#f8f9fa] px-4 pb-5 pt-4 text-[14px] leading-6 text-[#686868]">
            Indiquez le numéro destinataire, le montant exact et l’identifiant de transaction. La capture doit être lisible.
          </div>
          <div className="mt-8 rounded-[10px] bg-white px-5 py-5 text-[14px] leading-6 text-[#686868]">
            <p>Votre déclaration sera vérifiée par l’équipe avant tout crédit sur votre solde de dépôt.</p>
          </div>
        </section>
      </main>
    );
  }

  const channelCopy = lang === "en"
    ? {
        chooseChannel: "Choose a Mobile Money country or USDT BEP20.",
        loadingCountries: "Loading available Mobile Money countries…",
        channelLoadError: "Could not load deposit channels. Please try again.",
        noCountries: "No Mobile Money country is configured yet.",
        mobileMoney: "Mobile Money",
        delayed: "Payment delayed? Click here",
      }
    : {
        chooseChannel: "Choisissez un pays Mobile Money ou USDT BEP20.",
        loadingCountries: "Chargement des pays Mobile Money disponibles…",
        channelLoadError: "Impossible de charger les canaux de dépôt. Réessayez.",
        noCountries: "Aucun pays Mobile Money n’est encore configuré.",
        mobileMoney: "Mobile Money",
        delayed: "Paiement non reçu ? Cliquez ici",
      };

  const depositGuidance = [
    {
      key: "content_deposit_infoText",
      fallback: "Sur DIAMANT, les dépôts sont possibles par Mobile Money via les pays et opérateurs disponibles, ou par USDT BEP20. Le crédit intervient après validation du paiement.",
    },
    {
      key: "content_deposit_instruction1",
      fallback: "1. Le minimum de dépôt affiché sur cette page est actualisé depuis les paramètres de la plateforme.",
    },
    {
      key: "content_deposit_instruction2",
      fallback: "2. Suivez les consignes du moyen choisi : Mobile Money ou USDT BEP20. Le solde est crédité après validation du paiement.",
    },
    {
      key: "content_deposit_warning1",
      fallback: "Avant de payer, vérifiez le montant, le pays, l’opérateur et les coordonnées affichés. Pour USDT, utilisez uniquement le réseau BEP20.",
    },
    {
      key: "content_deposit_warning2",
      fallback: "Ne payez qu’avec les coordonnées affichées pour votre dépôt. Si le crédit est retardé, signalez l’opération depuis cette page ou contactez le support.",
    },
  ].map(({ key, fallback }) =>
    formatDepositGuidanceContent(
      getContent(settings, key, fallback),
      minDeposit.toLocaleString(localeForLang(lang)),
    ),
  );

  const availableMethodLabels = [
    ...(mobileDepositCountries.length > 0 ? [channelCopy.mobileMoney] : []),
    ...CRYPTO_CURRENCIES.map((currency) => currency.label),
  ];
  const guidanceLabels = lang === "fr"
    ? { methods: "Moyens de recharge disponibles", minimum: "Minimum de recharge" }
    : lang === "en"
      ? { methods: "Available deposit methods", minimum: "Minimum deposit" }
      : lang === "ar"
        ? { methods: "وسائل الإيداع المتاحة", minimum: "الحد الأدنى للإيداع" }
        : { methods: "可用充值方式", minimum: "最低充值金额" };
  const methodSeparator = lang === "fr" ? " ou " : lang === "en" ? " or " : lang === "ar" ? " أو " : " 或 ";

  return (
    <main className="ielp-deposit-page ielp-deposit-main min-h-screen pb-16">
      <header className="ielp-deposit-main__header flex h-[76px] items-center gap-3 px-4">
        <Link href="/">
          <button
            type="button"
            className={`${DEPOSIT_BACK_BUTTON_CLASS} h-11 w-11`}
            aria-label="Back to home"
            data-testid="button-deposit-back"
          >
            <ArrowLeft size={23} strokeWidth={1.9} />
          </button>
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="ielp-deposit-main__brand text-[10px] font-semibold uppercase tracking-[0.18em]">DIAMANT</p>
          <h1 className="ielp-deposit-main__title mt-0.5 text-[18px] font-semibold">RECHARGE</h1>
        </div>
        <Link href="/deposit-history">
          <button
            type="button"
            className="ielp-deposit-main__header-button flex h-11 w-11 items-center justify-center rounded-full transition active:scale-95"
            aria-label="Deposit history"
            data-testid="button-deposit-history"
          >
            <History size={21} strokeWidth={1.8} />
          </button>
        </Link>
      </header>

      <div className="ielp-deposit-main__content mx-auto w-full max-w-xl space-y-4 px-4 pb-[calc(8px+env(safe-area-inset-bottom))] pt-4">
        <section className="ielp-deposit-main__card rounded-[20px] border px-4 pb-4 pt-4">
          <SectionTitle>Recharge amount</SectionTitle>
          <label className="ielp-deposit-main__amount flex h-[54px] items-center gap-3 rounded-[13px] border px-4">
            <span className="text-[15px] font-semibold">{CURRENCY}</span>
            <input
              type="number"
              value={amount}
              min={minDeposit}
              onChange={(event) => setAmount(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold outline-none"
              aria-label="Recharge amount"
              data-testid="input-deposit-amount"
            />
          </label>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {depositPresetAmounts.map((preset) => {
              const selected = amount !== "" && Number(amount) === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="ielp-deposit-preset ielp-deposit-main__preset min-h-12 rounded-xl border px-1 text-[clamp(12px,3.8vw,16px)] font-semibold transition active:scale-[.97]"
                  data-selected={selected ? "true" : "false"}
                  data-testid={`button-preset-amount-${preset}`}
                >
                  {preset.toLocaleString(localeForLang(lang))}
                </button>
              );
            })}
          </div>
        </section>

        <section className="ielp-deposit-main__card rounded-[20px] border p-4">
          <SectionTitle>Recharge method</SectionTitle>
          <p className="ielp-deposit-main__channel-hint">{channelCopy.chooseChannel}</p>
          <div className="ielp-deposit-main__channel-options" role="radiogroup" aria-label={channelCopy.chooseChannel}>
            {countriesLoading && (
              <div className="ielp-deposit-main__channel-status" role="status">
                <Loader2 size={16} className="animate-spin" />
                <span>{channelCopy.loadingCountries}</span>
              </div>
            )}
            {countriesError && (
              <p className="ielp-deposit-main__channel-error" role="alert">{channelCopy.channelLoadError}</p>
            )}
            {!countriesLoading && !countriesError && mobileDepositCountries.length === 0 && (
              <p className="ielp-deposit-main__channel-status">{channelCopy.noCountries}</p>
            )}
            {mobileDepositCountries.map((country) => {
              const selected = selectedDepositMethod?.type === "mobile-money"
                && selectedDepositMethod.countryCode.toUpperCase() === country.code.toUpperCase();
              const countryFlag = getCountryFlagEmoji(country.code);
              return (
                <button
                  key={country.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${channelCopy.mobileMoney} ${country.name}`}
                  onClick={() => setSelectedDepositMethod({ type: "mobile-money", countryCode: country.code })}
                  className="ielp-deposit-main__channel-option"
                  data-selected={selected ? "true" : "false"}
                  data-testid={`button-deposit-country-${country.code.toLowerCase()}`}
                >
                  <span className="ielp-deposit-main__channel-icon" aria-hidden="true">
                    {countryFlag
                      ? <span className="text-[20px] leading-none">{countryFlag}</span>
                      : <Phone size={18} />}
                  </span>
                  <span className="ielp-deposit-main__channel-name">{channelCopy.mobileMoney} — {country.name}</span>
                  <span className="ielp-deposit-main__channel-radio" aria-hidden="true">
                    {selected && <span />}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={selectedDepositMethod?.type === "crypto"}
              aria-label="USDT BEP20"
              onClick={() => setSelectedDepositMethod({ type: "crypto", currencyCode: CRYPTO_CURRENCIES[0].code })}
              className="ielp-deposit-main__channel-option"
              data-selected={selectedDepositMethod?.type === "crypto" ? "true" : "false"}
              data-testid="button-deposit-usdt"
            >
              <span className="ielp-deposit-main__channel-icon">
                <img src={CRYPTO_CURRENCIES[0].icon} alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
              </span>
              <span className="ielp-deposit-main__channel-name">USDT BEP20</span>
              <span className="ielp-deposit-main__channel-radio" aria-hidden="true">
                {selectedDepositMethod?.type === "crypto" && <span />}
              </span>
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={submitMainDeposit}
          disabled={createCryptoDeposit.isPending}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(83,54,198,.24)] transition active:scale-[.98] disabled:opacity-70"
          data-testid="button-confirm-deposit"
        >
          {createCryptoDeposit.isPending
            ? <><Loader2 size={17} className="animate-spin" /> {lang === "en" ? "Preparing payment…" : "Préparation du paiement…"}</>
            : "Pay"}
        </button>
        <button
          type="button"
          onClick={() => setView("issue")}
          className="mx-auto block min-h-10 px-3 text-center text-[14px] font-medium active:opacity-70"
          data-testid="button-deposit-issue"
        >
          {channelCopy.delayed}
        </button>

        <section className="ielp-deposit-main__guidance rounded-[18px] border px-4 py-4">
          <h2 className="ielp-deposit-main__guidance-title text-[14px] font-semibold">{t.depositPaymentInfo}</h2>
          <div className="mt-3 space-y-3 text-[13px] leading-5">
            {!countriesLoading && !countriesError && (
              <p>
                {guidanceLabels.methods} : {availableMethodLabels.join(methodSeparator)}.
              </p>
            )}
            <p className="font-semibold">
              {guidanceLabels.minimum} : {minDeposit.toLocaleString(localeForLang(lang))} {CURRENCY}
            </p>
            {depositGuidance.map((text, index) => (
              <p key={`${index}-${text}`}>{text}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}