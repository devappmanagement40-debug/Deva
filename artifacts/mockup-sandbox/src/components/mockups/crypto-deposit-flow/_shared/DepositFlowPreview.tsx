import { useState } from "react";
import { ArrowLeft, History } from "lucide-react";
import {
  InternationalCryptoCurrencyList,
  type InternationalCryptoOption,
} from "../InternationalCryptoCurrencyList";
import { InternationalCryptoPaymentDetail } from "../InternationalCryptoPaymentDetail";

type DepositFlowPreviewProps = {
  current?: boolean;
};

const icon = (name: string) => `/__mockup/images/crypto-deposit-flow/${name}.png`;

const options: InternationalCryptoOption[] = [
  { id: "usdtbsc", label: "BEP20-USDT", token: "USDT", network: "BNB Smart Chain (BEP20)", iconSrc: icon("tether"), networkIconSrc: icon("bnb") },
  { id: "usdcbsc", label: "BEP20-USDC", token: "USDC", network: "BNB Smart Chain (BEP20)", iconSrc: icon("usd-coin"), networkIconSrc: icon("bnb") },
  { id: "bnbbsc", label: "BNB", token: "BNB", network: "BNB Smart Chain", iconSrc: icon("bnb") },
  { id: "usdttrc20", label: "TRC20-USDT", token: "USDT", network: "TRON (TRC20)", iconSrc: icon("tether"), networkIconSrc: icon("tron") },
  { id: "trx", label: "TRC20-TRX", token: "TRX", network: "TRON (TRC20)", iconSrc: icon("tron") },
  { id: "eth", label: "ETH", token: "ETH", network: "Ethereum", iconSrc: icon("ethereum") },
  { id: "usdterc20", label: "ETH-USDT", token: "USDT", network: "Ethereum (ERC20)", iconSrc: icon("tether"), networkIconSrc: icon("ethereum") },
  { id: "usdc", label: "ETH-USDC", token: "USDC", network: "Ethereum (ERC20)", iconSrc: icon("usd-coin"), networkIconSrc: icon("ethereum") },
  { id: "pyusd", label: "ETH-PYUSD", token: "PYUSD", network: "Ethereum", iconSrc: icon("paypal-usd"), networkIconSrc: icon("ethereum") },
  { id: "maticmainnet", label: "POLYGON", token: "POL", network: "Polygon", iconSrc: icon("polygon") },
  { id: "usdtmatic", label: "POLYGON-USDT", token: "USDT", network: "Polygon", iconSrc: icon("tether"), networkIconSrc: icon("polygon") },
  { id: "usdcmatic", label: "POLYGON-USDC", token: "USDC", network: "Polygon", iconSrc: icon("usd-coin"), networkIconSrc: icon("polygon") },
];

const PAYMENT_QR = "/__mockup/images/crypto-deposit-flow/preview-qr.png";

export function DepositFlowPreview({ current = false }: DepositFlowPreviewProps) {
  const [stage, setStage] = useState<"methods" | "amount" | "payment">(current ? "amount" : "methods");
  const [amount, setAmount] = useState("25");
  const [selected, setSelected] = useState<InternationalCryptoOption | null>(null);

  const moveToStage = (nextStage: "methods" | "amount" | "payment") => {
    window.scrollTo(0, 0);
    setStage(nextStage);
  };

  const goBack = () => {
    if (stage === "payment") moveToStage("amount");
    else if (stage === "amount" && current && !selected) moveToStage("amount");
    else if (stage === "amount") moveToStage("methods");
    else window.history.back();
  };

  const selectMethod = (option: InternationalCryptoOption) => {
    setSelected(option);
    moveToStage(current ? "payment" : "amount");
  };

  return (
    <main
      className={`ielp-deposit-page ${current ? "" : "icx-stable"} flex min-h-screen flex-col pb-8 text-white`}
      style={{ background: "linear-gradient(180deg, #050923 0%, #07113a 52%, #07518a 100%)" }}
    >
      <header className="icx-page-header sticky top-0 z-20 flex h-[52px] shrink-0 items-center gap-3 px-3 text-white shadow-[0_2px_8px_rgba(0,5,30,.28)]">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/10"
          aria-label="Retour"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-center text-[19px] font-semibold">
          {stage === "methods" ? "Méthode de dépôt" : stage === "payment" ? "Dépôt" : "Montant du dépôt"}
        </h1>
        <span className="flex h-10 w-10 items-center justify-center" aria-hidden="true">
          <History size={21} />
        </span>
      </header>

      <div className="icx-flow-content mx-auto w-full max-w-xl flex-1 px-4 pt-4">
        {stage === "methods" && (
          <>
            {!current && (
              <p className="mb-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-5 text-white/80">
                Sélectionnez la devise et le réseau que vous utiliserez pour envoyer votre dépôt.
              </p>
            )}
            <InternationalCryptoCurrencyList options={options} onSelect={selectMethod} />
          </>
        )}

        {stage === "amount" && (
          <section className="rounded-[20px] border border-white/15 bg-white/10 p-5 text-white shadow-[0_10px_28px_rgba(0,5,30,.24)] backdrop-blur-sm">
            {selected && (
              <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#172b5b]/70 p-3">
                <span className="icx-option__icon">
                  <img src={selected.iconSrc} alt="" />
                </span>
                <div>
                  <p className="font-bold">{selected.label}</p>
                  <p className="text-xs text-white/70">{selected.network}</p>
                </div>
              </div>
            )}
            <h2 className="text-lg font-bold">Montant du dépôt</h2>
            <p className="mt-1 text-sm leading-6 text-white/75">
              Choisissez le montant à créditer sur votre solde de dépôts. Une adresse et un montant exact seront créés pour cette opération.
            </p>
            <label className="mt-5 block text-sm font-semibold" htmlFor="preview-deposit-amount">
              Montant à créditer (USDT)
            </label>
            <div className="mt-2 flex h-14 items-center rounded-xl border border-white/20 bg-black/15 px-4">
              <input
                id="preview-deposit-amount"
                inputMode="decimal"
                type="number"
                min="13"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-lg font-bold text-white outline-none"
              />
              <span className="font-bold">USDT</span>
            </div>
            <p className="mt-2 text-xs text-white/70">Minimum du compte : 13 USDT. Le réseau peut imposer un minimum technique supérieur.</p>
            <button
              type="button"
              onClick={() => setStage(current ? "methods" : "payment")}
              className="icx-button icx-button--wide mt-5"
            >
              {current ? "Continuer" : "Afficher l’adresse de dépôt"}
            </button>
          </section>
        )}

        {stage === "payment" && selected && (
          <InternationalCryptoPaymentDetail
            token={selected.token}
            network={selected.network}
            iconSrc={selected.iconSrc}
            networkIconSrc={selected.networkIconSrc}
            exactPayAmount={selected.id === "usdtbsc" ? "25.00" : "25.00"}
            exactPayCurrency={selected.token}
            creditedUsdtAmount={amount}
            address="Adresse de démonstration — ne pas envoyer de fonds"
            qrDataUrl={PAYMENT_QR}
            status="waiting"
            noteText={[
              `Note — ${selected.label} sur ${selected.network}`,
              `1. Envoyez uniquement ${selected.token} sur ce réseau, à l’adresse affichée.`,
              "2. Respectez exactement le montant indiqué dans le récapitulatif du paiement.",
              `3. Minimum du compte : 13 USDT. Minimum technique indicatif pour cet instrument : ${selected.id === "usdtbsc" ? "2 USDT" : "vérifier le montant affiché avant l'envoi"}.`,
              "4. Un autre actif, un autre réseau ou un montant différent peut empêcher la confirmation automatique et nécessiter une vérification.",
              `5. Après confirmation, ${amount} USDT seront crédités sur le solde de dépôts. Les frais de traitement sont pris en charge par DIAMANT; les frais réseau du portefeuille restent séparés.`,
              "6. Le délai dépend des confirmations de la blockchain. Ne renvoyez pas le paiement; utilisez « Dépôt effectué · vérifier » pour actualiser son statut.",
            ].join("\n")}
            onCopyAddress={() => undefined}
            onCopyAmount={() => undefined}
            onCheckStatus={() => undefined}
            checkStatusLabel="DÉPÔT EFFECTUÉ · VÉRIFIER"
          />
        )}
      </div>
    </main>
  );
}
