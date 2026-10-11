import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, Loader2 } from "lucide-react";
import { INTERNATIONAL_CRYPTO_METHODS } from "@shared/international-crypto";
import { DEFAULT_MIN_DEPOSIT_USDT } from "@shared/financial-settings";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { FloatingSupport } from "@/components/floating-support";
import { DiamantBrand } from "@/components/diamant-brand";
import { Link } from "wouter";
import bnbIcon from "@/assets/crypto/bnb.png";
import ethereumIcon from "@/assets/crypto/ethereum.png";
import paypalUsdIcon from "@/assets/crypto/paypal-usd.png";
import polygonIcon from "@/assets/crypto/polygon.png";
import tetherIcon from "@/assets/crypto/tether.png";
import tronIcon from "@/assets/crypto/tron.png";
import usdCoinIcon from "@/assets/crypto/usd-coin.png";
import {
  InternationalCryptoCurrencyList,
  InternationalCryptoPaymentDetail,
  type InternationalCryptoOption,
  type InternationalCryptoPaymentStatus,
} from "./index";

type DepositStage = "amount" | "methods" | "payment";

type InternationalCryptoPayment = {
  depositId: number;
  paymentId: string;
  payAddress: string;
  payAmount: string;
  payCurrency: string;
  network: string;
  qrCode: string;
  creditedUsdtAmount: string;
  methodLabel: string;
};

type ProviderDepositStatus = "pending" | "processing" | "review" | "approved" | "rejected";

function paymentStatus(status?: ProviderDepositStatus): InternationalCryptoPaymentStatus {
  if (status === "approved") return "confirmed";
  if (status === "rejected" || status === "review") return "failed";
  if (status === "processing") return "confirming";
  return "waiting";
}

const PAYMENT_NOTES = [
  "1. Envoyez uniquement l’actif et le réseau indiqués à l’écran, en utilisant le montant exact fourni par NOWPayments.",
  "2. Le dépôt est crédité automatiquement sur le solde de dépôts en USDT après confirmation du paiement.",
  "3. Le montant minimum crédité sur votre compte est de {{minimumDepositUsdt}} USDT. Les minimums techniques du réseau et du prestataire peuvent être supérieurs.",
  "4. N’envoyez pas d’autres actifs sur cette adresse. Un mauvais réseau ou un montant incomplet peut retarder le crédit.",
  "5. Les frais de traitement NOWPayments sont pris en charge par DIAMANT. Les frais de réseau de votre portefeuille peuvent rester séparés.",
].join("\n");

const METHOD_ICONS: Record<string, string> = {
  usdtbsc: tetherIcon,
  usdcbsc: usdCoinIcon,
  bnbbsc: bnbIcon,
  usdttrc20: tetherIcon,
  trx: tronIcon,
  eth: ethereumIcon,
  usdterc20: tetherIcon,
  usdc: usdCoinIcon,
  pyusd: paypalUsdIcon,
  maticmainnet: polygonIcon,
  usdtmatic: tetherIcon,
  usdcmatic: usdCoinIcon,
};

const NETWORK_ICONS: Record<string, string> = {
  usdtbsc: bnbIcon,
  usdcbsc: bnbIcon,
  bnbbsc: bnbIcon,
  usdttrc20: tronIcon,
  trx: tronIcon,
  eth: ethereumIcon,
  usdterc20: ethereumIcon,
  usdc: ethereumIcon,
  pyusd: ethereumIcon,
  maticmainnet: polygonIcon,
  usdtmatic: polygonIcon,
  usdcmatic: polygonIcon,
};

export default function InternationalCryptoDepositFlow() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [stage, setStage] = useState<DepositStage>("amount");
  const [amountUsdt, setAmountUsdt] = useState("");
  const [payment, setPayment] = useState<InternationalCryptoPayment | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderDepositStatus>("pending");
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const minimumDepositUsdt = Number(settings?.minDepositUsdt ?? DEFAULT_MIN_DEPOSIT_USDT);
  const paymentNotes = PAYMENT_NOTES.replace(
    "{{minimumDepositUsdt}}",
    String(minimumDepositUsdt),
  );

  const createPayment = useMutation({
    mutationFn: async (option: InternationalCryptoOption) => {
      const response = await apiRequest("POST", "/api/crypto-deposits/international", {
        amountUsdt: amountUsdt.trim(),
        payCurrency: option.id,
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Impossible de créer le dépôt.");
      }
      return response.json() as Promise<InternationalCryptoPayment>;
    },
    onSuccess: (result) => {
      setPayment(result);
      setProviderStatus("pending");
      setStage("payment");
      setCopied(null);
    },
    onError: (error: Error) => toast({
      title: "Dépôt indisponible",
      description: error.message,
      variant: "destructive",
    }),
  });

  const checkStatus = useMutation({
    mutationFn: async () => {
      if (!payment) throw new Error("Aucun dépôt à vérifier.");
      const response = await apiRequest("GET", `/api/crypto-deposits/${encodeURIComponent(payment.paymentId)}/status`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Impossible de vérifier le dépôt.");
      }
      return response.json() as Promise<{ status: ProviderDepositStatus }>;
    },
    onSuccess: (result) => {
      setProviderStatus(result.status);
      if (result.status === "approved") {
        void refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/deposits/history"] });
        toast({ title: "Dépôt confirmé", description: "Le montant USDT a été crédité sur votre solde de dépôts." });
      }
    },
    onError: (error: Error) => toast({
      title: "Vérification en attente",
      description: error.message,
      variant: "destructive",
    }),
  });

  const copyValue = async (value: string, field: "address" | "amount") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 2200);
      toast({ title: field === "address" ? "Adresse copiée" : "Montant copié" });
    } catch {
      toast({
        title: "Copie impossible",
        description: "Sélectionnez le texte et copiez-le manuellement.",
        variant: "destructive",
      });
    }
  };

  const options: InternationalCryptoOption[] = INTERNATIONAL_CRYPTO_METHODS.map((method) => ({
    id: method.code,
    label: method.label,
    token: method.token,
    network: method.network,
    description: `${method.token} · ${method.network}`,
    iconSrc: METHOD_ICONS[method.code],
    networkIconSrc: NETWORK_ICONS[method.code],
    disabled: createPayment.isPending,
  }));
  const selectedMethod = payment
    ? INTERNATIONAL_CRYPTO_METHODS.find((method) => method.code === payment.payCurrency)
    : undefined;

  const startMethodSelection = () => {
    const amount = Number(amountUsdt);
    if (!Number.isFinite(amount) || !Number.isFinite(minimumDepositUsdt) || amount < minimumDepositUsdt || amount > 1_000_000) {
      toast({
        title: "Montant invalide",
        description: `Saisissez un montant compris entre ${minimumDepositUsdt} et 1 000 000 USDT.`,
        variant: "destructive",
      });
      return;
    }
    setStage("methods");
  };

  const backFromPayment = () => {
    setPayment(null);
    setStage("methods");
  };

  return (
    <main
      className="ielp-deposit-page min-h-screen pb-10 text-white"
      style={{ background: "linear-gradient(180deg, #050923 0%, #07113a 52%, #07518a 100%)" }}
    >
      <header className="icx-page-header sticky top-0 z-20 flex h-[52px] items-center gap-3 px-3 text-white shadow-[0_2px_8px_rgba(0,5,30,.28)]">
        <button
          type="button"
          onClick={() => {
            if (stage === "payment") backFromPayment();
            else if (stage === "methods") setStage("amount");
            else window.history.back();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10"
          aria-label="Retour"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-[19px] font-semibold">
            {stage === "payment" ? "Dépôt" : stage === "methods" ? "Méthode de dépôt" : "Dépôt"}
          </h1>
        </div>
        <Link
          href="/deposit-history"
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10"
          aria-label="Historique des dépôts"
        >
          <History size={21} />
        </Link>
      </header>

      <div className="mx-auto w-full max-w-xl px-4 pt-4">
        {stage === "amount" && (
          <section className="rounded-[20px] border border-white/15 bg-white/10 p-5 text-white shadow-[0_10px_28px_rgba(0,35,18,.12)] backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-center">
              <DiamantBrand markSize={38} />
            </div>
            <h2 className="text-lg font-bold">Montant du dépôt</h2>
            <p className="mt-1 text-sm leading-6 text-white/75">
               Le montant sera crédité en USDT sur votre solde de dépôts.
            </p>
            <label className="mt-5 block text-sm font-semibold text-white" htmlFor="international-usdt-amount">
              Montant à créditer (USDT)
            </label>
            <div className="mt-2 flex h-14 items-center rounded-xl border border-white/20 bg-black/15 px-4 focus-within:ring-2 focus-within:ring-white/35">
              <input
                id="international-usdt-amount"
                inputMode="decimal"
                type="number"
                 min={minimumDepositUsdt}
                max="1000000"
                step="0.01"
                value={amountUsdt}
                onChange={(event) => setAmountUsdt(event.target.value)}
                placeholder="2.00"
                className="min-w-0 flex-1 bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/50"
                aria-describedby="international-usdt-min"
              />
              <span className="font-bold text-white">USDT</span>
            </div>
             <p id="international-usdt-min" className="mt-2 text-xs text-white/70">Minimum : {minimumDepositUsdt} USDT. Le prestataire vérifie aussi le minimum du réseau choisi.</p>
            <button
              type="button"
              onClick={startMethodSelection}
              className="icx-continue-button mt-5 flex h-12 w-full items-center justify-center rounded-xl px-4 font-bold text-white shadow-[0_4px_12px_rgba(0,5,30,.35)] transition"
            >
              Continuer
            </button>
          </section>
        )}

        {stage === "methods" && (
          <>
            <div className="mb-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Montant à créditer</p>
              <p className="mt-1 text-lg font-bold">{amountUsdt} USDT</p>
            </div>
            <InternationalCryptoCurrencyList
              options={options}
              onSelect={(option) => createPayment.mutate(option)}
            />
            {createPayment.isPending && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white" role="status">
                <Loader2 size={17} className="animate-spin" />
                Création sécurisée de l’adresse de dépôt…
              </div>
            )}
            <p className="mt-3 rounded-xl border border-white/15 bg-white/10 p-3 text-xs leading-5 text-white/75">
              Choisissez exactement le même réseau dans votre portefeuille. Le paiement est suivi par NOWPayments.
            </p>
          </>
        )}

        {stage === "payment" && payment && (
          <InternationalCryptoPaymentDetail
            token={selectedMethod?.token || payment.payCurrency}
            network={payment.network}
            iconSrc={selectedMethod ? METHOD_ICONS[selectedMethod.code] : undefined}
            networkIconSrc={selectedMethod ? NETWORK_ICONS[selectedMethod.code] : undefined}
            exactPayAmount={payment.payAmount}
            exactPayCurrency={selectedMethod?.token || payment.payCurrency.toUpperCase()}
            creditedUsdtAmount={payment.creditedUsdtAmount || amountUsdt}
            address={payment.payAddress}
            qrDataUrl={payment.qrCode}
            status={paymentStatus(providerStatus)}
            noteText={paymentNotes}
            onCopyAddress={() => void copyValue(payment.payAddress, "address")}
            onCopyAmount={() => void copyValue(payment.payAmount, "amount")}
            onCheckStatus={() => checkStatus.mutate()}
            addressCopied={copied === "address"}
            amountCopied={copied === "amount"}
            checkStatusLabel={checkStatus.isPending ? "Vérification…" : "DÉPÔT EFFECTUÉ · VÉRIFIER"}
          />
        )}
      </div>

      <FloatingSupport placement="home" />
      <p className="mx-auto mt-4 max-w-xl px-5 text-center text-[11px] text-white/65">
         {user?.country ? `Compte USDT · ${user.country}` : "Compte USDT"}
      </p>
    </main>
  );
}
