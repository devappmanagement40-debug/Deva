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
import { Link, useLocation } from "wouter";
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

function buildPaymentNotes({
  amountUsdt,
  method,
  minimumDepositUsdt,
  payment,
}: {
  amountUsdt: string;
  method?: (typeof INTERNATIONAL_CRYPTO_METHODS)[number];
  minimumDepositUsdt: number;
  payment: InternationalCryptoPayment;
}) {
  const token = method?.token || payment.payCurrency.toUpperCase();
  const network = payment.network || method?.network || "le réseau affiché";
  const methodMinimum = method?.minimumAssetAmount;
  const methodMinimumText = methodMinimum
    ? `${methodMinimum} ${token}`
    : "le minimum indiqué lors de la création de la demande";
  const creditedAmount = payment.creditedUsdtAmount || amountUsdt;

  return [
    `Note — dépôt ${method?.label || token} sur ${network}.`,
    `1. Copiez l’adresse ou scannez le code QR. Envoyez uniquement ${token} sur ${network}.`,
    `2. Envoyez exactement ${payment.payAmount} ${token}, sans arrondir ni modifier le montant affiché pour cette demande.`,
    `3. Le minimum créditable sur le compte est de ${minimumDepositUsdt} USDT. Le minimum technique de cet instrument est de ${methodMinimumText}; le système peut demander davantage selon le montant et le réseau.`,
    "4. N’envoyez pas un autre actif ni depuis un autre réseau. Un réseau incorrect ou un montant différent peut retarder la confirmation et nécessiter une vérification.",
    `5. Après confirmation, ${creditedAmount} USDT seront crédités sur votre solde de dépôts. DIAMANT prend en charge les frais de traitement; les frais réseau de votre portefeuille restent séparés.`,
    "6. Le délai dépend des confirmations de la blockchain. Ne renvoyez pas le paiement. Revenez vérifier le statut de cette même demande.",
  ].join("\n");
}

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
  const [, navigate] = useLocation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const [stage, setStage] = useState<DepositStage>("methods");
  const [amountUsdt, setAmountUsdt] = useState("");
  const [selectedOption, setSelectedOption] = useState<InternationalCryptoOption | null>(null);
  const [payment, setPayment] = useState<InternationalCryptoPayment | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderDepositStatus>("pending");
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const configuredMinimumDepositUsdt = Number(settings?.minDepositUsdt);
  const fallbackMinimumDepositUsdt = Number(DEFAULT_MIN_DEPOSIT_USDT);
  const minimumDepositUsdt = Number.isFinite(configuredMinimumDepositUsdt) && configuredMinimumDepositUsdt > 0
    ? configuredMinimumDepositUsdt
    : fallbackMinimumDepositUsdt;
  const selectedMethod = selectedOption
    ? INTERNATIONAL_CRYPTO_METHODS.find((method) => method.code === selectedOption.id)
    : undefined;
  const moveToStage = (nextStage: DepositStage) => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
    setStage(nextStage);
  };
  const paymentNotes = payment
    ? buildPaymentNotes({ amountUsdt, method: selectedMethod, minimumDepositUsdt, payment })
    : "";

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
      moveToStage("payment");
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
  const submitAmount = () => {
    const normalizedAmount = amountUsdt.trim();
    const amount = Number(normalizedAmount);
    if (
      !/^\d+(?:\.\d{1,8})?$/.test(normalizedAmount)
      || !Number.isFinite(amount)
      || !Number.isFinite(minimumDepositUsdt)
      || amount < minimumDepositUsdt
      || amount > 1_000_000
    ) {
      toast({
        title: "Montant invalide",
        description: `Saisissez un montant valide, avec jusqu’à 8 décimales, compris entre ${minimumDepositUsdt} et 1 000 000 USDT.`,
        variant: "destructive",
      });
      return;
    }
    if (!selectedOption) {
      toast({
        title: "Réseau non sélectionné",
        description: "Retournez à la liste et choisissez d’abord la devise et le réseau du dépôt.",
        variant: "destructive",
      });
      moveToStage("methods");
      return;
    }
    createPayment.mutate(selectedOption);
  };

  const backFromPayment = () => {
    setPayment(null);
    moveToStage("amount");
  };

  return (
    <main
      className="ielp-deposit-page icx-stable flex min-h-screen flex-col pb-10 text-white"
      style={{ background: "linear-gradient(180deg, #050923 0%, #07113a 52%, #07518a 100%)" }}
    >
      <header className="icx-page-header sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 px-3 text-white shadow-[0_2px_8px_rgba(0,5,30,.28)]">
        <button
          type="button"
          onClick={() => {
            if (stage === "payment") backFromPayment();
            else if (stage === "amount") {
              setSelectedOption(null);
              moveToStage("methods");
            }
            else navigate("/");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10"
          aria-label="Retour"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-[19px] font-semibold">
            {stage === "payment" ? "Dépôt" : stage === "methods" ? "Méthode de dépôt" : "Montant du dépôt"}
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

      <div className="icx-flow-content mx-auto w-full max-w-xl flex-1 px-4 pt-4">
        {stage === "amount" && (
          <section className="rounded-[20px] border border-white/15 bg-white/10 p-5 text-white shadow-[0_10px_28px_rgba(0,35,18,.12)] backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-center">
              <DiamantBrand markSize={38} />
            </div>
            {selectedOption && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#172b5b]/70 p-3">
                <span className="icx-option__icon" aria-hidden="true">
                  {selectedOption.iconSrc
                    ? <img src={selectedOption.iconSrc} alt="" />
                    : <span className="icx-option__monogram">{selectedOption.token.slice(0, 4).toUpperCase()}</span>}
                  {selectedOption.networkIconSrc && (
                    <span className="icx-option__network-icon">
                      <img src={selectedOption.networkIconSrc} alt="" />
                    </span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-bold">{selectedOption.label}</p>
                  <p className="text-xs text-white/70">{selectedOption.network}</p>
                </div>
              </div>
            )}
            <h2 className="text-lg font-bold">Montant du dépôt</h2>
            <p className="mt-1 text-sm leading-6 text-white/75">
              Saisissez le montant à créditer en USDT sur votre solde de dépôts. Après validation, les détails afficheront l’actif, le réseau et le montant exact à envoyer.
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
                step="0.00000001"
                value={amountUsdt}
                onChange={(event) => setAmountUsdt(event.target.value)}
                placeholder={`${minimumDepositUsdt}`}
                className="min-w-0 flex-1 bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/50"
                aria-describedby="international-usdt-min"
              />
              <span className="font-bold text-white">USDT</span>
            </div>
            <p id="international-usdt-min" className="mt-2 text-xs text-white/70">
              Minimum : {minimumDepositUsdt} USDT. Le montant demandé sera crédité en entier après confirmation, et les minimums techniques peuvent être supérieurs.
            </p>
            <p className="mt-2 rounded-lg border border-white/10 bg-black/10 p-3 text-xs leading-5 text-white/70">
              Chaque dépôt correspond à une demande de paiement créée pour ce montant. Sur l’écran suivant, respectez le montant exact et le réseau affichés; cette page ne crée pas d’adresse permanente pour des montants libres.
            </p>
            <button
              type="button"
              onClick={submitAmount}
              disabled={!selectedOption || createPayment.isPending}
              className="icx-continue-button mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 font-bold text-white shadow-[0_4px_12px_rgba(0,5,30,.35)] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createPayment.isPending && <Loader2 size={17} className="animate-spin" />}
              {createPayment.isPending ? "Création de la demande…" : "Continuer vers l’adresse"}
            </button>
          </section>
        )}

        {stage === "methods" && (
          <>
            <InternationalCryptoCurrencyList
              options={options}
              onSelect={(option) => {
                setSelectedOption(option);
                moveToStage("amount");
              }}
            />
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
            isCheckingStatus={checkStatus.isPending}
            checkStatusLabel={checkStatus.isPending ? "Vérification…" : "VALIDER LE DÉPÔT"}
          />
        )}
      </div>

      <FloatingSupport placement="home" />
      <p className="mx-auto mt-auto max-w-xl px-5 pt-4 text-center text-[11px] text-white/65">
         {user?.country ? `Compte USDT · ${user.country}` : "Compte USDT"}
      </p>
    </main>
  );
}
