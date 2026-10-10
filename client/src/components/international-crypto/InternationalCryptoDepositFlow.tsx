import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { INTERNATIONAL_CRYPTO_METHODS } from "@shared/international-crypto";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { FloatingSupport } from "@/components/floating-support";
import { LanguagePicker } from "@/components/language-picker";
import { DiamantBrand } from "@/components/diamant-brand";
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
  "3. Les seuils minimums affichés sur la référence sont : USDT/USDC 2, TRX 10, BNB 0,003 et ETH 0,001. PYUSD et Polygon suivent le minimum calculé par le prestataire.",
  "4. N’envoyez pas d’autres actifs sur cette adresse. Un mauvais réseau ou un montant incomplet peut retarder le crédit.",
].join("\n");

export default function InternationalCryptoDepositFlow() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [stage, setStage] = useState<DepositStage>("amount");
  const [amountUsdt, setAmountUsdt] = useState("");
  const [payment, setPayment] = useState<InternationalCryptoPayment | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderDepositStatus>("pending");
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);

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
    disabled: createPayment.isPending,
  }));

  const startMethodSelection = () => {
    const amount = Number(amountUsdt);
    if (!Number.isFinite(amount) || amount < 2 || amount > 1_000_000) {
      toast({
        title: "Montant invalide",
        description: "Saisissez un montant compris entre 2 et 1 000 000 USDT.",
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
    <main className="ielp-deposit-page min-h-screen bg-[#f3f8f4] pb-10" style={{ color: "#173f26" }}>
      <header className="flex min-h-[78px] items-center gap-3 bg-[#087a38] px-4 text-white shadow-[0_2px_8px_rgba(0,75,35,.2)]">
        <button
          type="button"
          onClick={() => {
            if (stage === "payment") backFromPayment();
            else if (stage === "methods") setStage("amount");
            else window.history.back();
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95"
          aria-label="Retour"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">DIAMANT · USDT</p>
          <h1 className="mt-0.5 text-[19px] font-semibold">
            {stage === "payment" ? "Dépôt" : stage === "methods" ? "Méthode de dépôt" : "Dépôt international"}
          </h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center">
          <LanguagePicker variant="home" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl px-4 pt-4">
        {stage === "amount" && (
          <section className="rounded-[22px] border border-[#dcebe0] bg-white p-5 shadow-[0_10px_28px_rgba(0,70,30,.08)]">
            <div className="mb-5 flex items-center justify-center">
              <DiamantBrand markSize={38} />
            </div>
            <h2 className="text-lg font-bold text-[#173f26]">Montant du dépôt</h2>
            <p className="mt-1 text-sm leading-6 text-[#698173]">
              Le montant sera crédité en USDT sur votre solde de dépôts. Les soldes XOF déjà présents ne sont pas convertis.
            </p>
            <label className="mt-5 block text-sm font-semibold text-[#315940]" htmlFor="international-usdt-amount">
              Montant à créditer (USDT)
            </label>
            <div className="mt-2 flex h-14 items-center rounded-xl border border-[#dcebe0] bg-[#f8fcf9] px-4 focus-within:ring-2 focus-within:ring-[#20a554]/40">
              <input
                id="international-usdt-amount"
                inputMode="decimal"
                type="number"
                min="2"
                max="1000000"
                step="0.01"
                value={amountUsdt}
                onChange={(event) => setAmountUsdt(event.target.value)}
                placeholder="2.00"
                className="min-w-0 flex-1 bg-transparent text-lg font-bold text-[#173f26] outline-none"
                aria-describedby="international-usdt-min"
              />
              <span className="font-bold text-[#087a38]">USDT</span>
            </div>
            <p id="international-usdt-min" className="mt-2 text-xs text-[#698173]">Minimum : 2 USDT. Le prestataire vérifie aussi le minimum du réseau choisi.</p>
            <button
              type="button"
              onClick={startMethodSelection}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#087a38] px-4 font-bold text-white shadow-[0_4px_10px_rgba(0,75,35,.18)] transition hover:bg-[#066b31] active:scale-[.99]"
            >
              Continuer
            </button>
          </section>
        )}

        {stage === "methods" && (
          <>
            <div className="mb-3 rounded-2xl border border-[#dcebe0] bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#698173]">Montant à créditer</p>
              <p className="mt-1 text-lg font-bold text-[#087a38]">{amountUsdt} USDT</p>
            </div>
            <InternationalCryptoCurrencyList
              options={options}
              title="Méthode de dépôt"
              eyebrow="Dépôt international · USDT"
              onSelect={(option) => createPayment.mutate(option)}
            />
            {createPayment.isPending && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#087a38]" role="status">
                <Loader2 size={17} className="animate-spin" />
                Création sécurisée de l’adresse de dépôt…
              </div>
            )}
            <p className="mt-3 rounded-xl border border-[#dcebe0] bg-white/80 p-3 text-xs leading-5 text-[#698173]">
              Choisissez exactement le même réseau dans votre portefeuille. Le paiement est suivi par NOWPayments.
            </p>
          </>
        )}

        {stage === "payment" && payment && (
          <InternationalCryptoPaymentDetail
            token={INTERNATIONAL_CRYPTO_METHODS.find((method) => method.code === payment.payCurrency)?.token || payment.payCurrency}
            network={payment.network}
            exactPayAmount={payment.payAmount}
            exactPayCurrency={INTERNATIONAL_CRYPTO_METHODS.find((method) => method.code === payment.payCurrency)?.token || payment.payCurrency.toUpperCase()}
            creditedUsdtAmount={payment.creditedUsdtAmount || amountUsdt}
            address={payment.payAddress}
            qrDataUrl={payment.qrCode}
            status={paymentStatus(providerStatus)}
            noteText={PAYMENT_NOTES}
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
      <p className="mx-auto mt-4 max-w-xl px-5 text-center text-[11px] text-[#698173]">
        {user?.country ? `Marché international · ${user.country}` : "Marché international"}
      </p>
    </main>
  );
}
