import { useEffect, useRef, useState } from "react";
import ciFlagAsset from "@/assets/cote-divoire-flag.svg";
import waveMobileMoneyLogo from "@/assets/wave-mobile-money.png";
import {
  Check,
  Gem,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import "./CiMobileMoneyCheckout.css";

export type CiMobileMoneyCheckoutProps = {
  amountXof: number;
  currency: string;
  operatorName: string;
  operatorPhone: string;
  operatorOwnerName: string;
  operatorLogoUrl?: string | null;
  paymentUrl?: string | null;
  paymentQrDataUrl?: string | null;
  payerPhoneDigits: string;
  onPayerPhoneDigitsChange(value: string): void;
  transactionId: string;
  onTransactionIdChange(value: string): void;
  proofName: string;
  onPickProof(): void;
  isSubmitting: boolean;
  onBack(): void;
  onSubmitForReview(): void;
  onToggleLanguage?(): void;
  language: string;
};

const COPY = {
  fr: {
    exactAmount: "Montant du paiement",
    phoneLabel: "Numéro de portefeuille de paiement",
    phonePlaceholder: "Veuillez entrer le numéro de portefeuille…",
    phoneHint:
      "Veuillez saisir correctement votre numéro de portefeuille de paiement à 10 chiffres pour que votre paiement arrive avec précision",
    recipient: "Compte destinataire",
    owner: "Titulaire du compte",
    copy: "Copier",
    copied: "Copié",
    appHeading: "Effectuez votre paiement avec",
    appInstructions:
      "Envoyez le montant affiché au compte Wave ci-dessous, puis indiquez la référence de la transaction.",
    launch: "Ouvrir Wave",
    launchUnavailable: "Lien de paiement non configuré",
    qrHeading: "Code QR de paiement",
    scanInstructions: "Scannez ce code avec votre application Mobile Money.",
    qrUnavailable: "Code QR non configuré",
    configureLink:
      "Le lien de paiement n’est pas configuré. Vous pouvez effectuer un transfert manuel vers le compte indiqué.",
    configureQr: "Aucun code QR de paiement n’est configuré.",
    manualTransfer:
      "Effectuez le transfert uniquement vers le numéro destinataire affiché ici.",
    reference: "Référence de la transaction",
    referenceHint: "Saisissez la référence indiquée sur le reçu de votre transfert.",
    referencePlaceholder: "Ex. : référence du reçu",
    required: "Obligatoire",
    proof: "Justificatif (facultatif)",
    chooseProof: "Ajouter une capture d’écran",
    replaceProof: "Remplacer le justificatif",
    noProof: "Aucun fichier ajouté",
    submit: "Soumettre",
    submitDetails: "Transmettre à l’administration",
    submitting: "Envoi en cours…",
    submitHint:
      "Votre demande restera en attente. Le dépôt sera crédité uniquement après vérification par l’administration.",
    secureHeading: "Paiement sécurisé",
    secureBody:
      "Vos informations sont protégées. Le transfert sera vérifié manuellement avant tout crédit.",
    back: "Fermer le paiement",
    missingOwner: "Non renseigné",
    copyFailed: "Impossible de copier le numéro.",
    openNew: "S’ouvre dans un nouvel onglet",
    paymentDetails: "Instructions de paiement",
    languageButton: "ENGLISH",
    timeRemaining: "Temps restant",
    copyTitle: "Informations pour le suivi",
    phoneInvalid: "Saisissez les 10 chiffres de votre numéro ivoirien après +225.",
  },
  en: {
    exactAmount: "Payment amount",
    phoneLabel: "Payment wallet number",
    phonePlaceholder: "Enter your wallet phone number…",
    phoneHint:
      "Enter the correct 10-digit payment wallet number so your payment can be identified accurately.",
    recipient: "Recipient account",
    owner: "Account holder",
    copy: "Copy",
    copied: "Copied",
    appHeading: "Make your payment with",
    appInstructions:
      "Send the amount shown to the Wave account below, then enter the transaction reference.",
    launch: "Open Wave",
    launchUnavailable: "Payment link not configured",
    qrHeading: "Payment QR code",
    scanInstructions: "Scan this code with your Mobile Money app.",
    qrUnavailable: "QR code not configured",
    configureLink:
      "The payment link is not configured. You can make a manual transfer to the account shown.",
    configureQr: "No payment QR code is configured.",
    manualTransfer:
      "Send the transfer only to the recipient number shown here.",
    reference: "Transaction reference",
    referenceHint: "Enter the reference shown on your transfer receipt.",
    referencePlaceholder: "e.g. receipt reference",
    required: "Required",
    proof: "Proof of payment (optional)",
    chooseProof: "Add a screenshot",
    replaceProof: "Replace proof",
    noProof: "No file added",
    submit: "Submit",
    submitDetails: "Send for admin review",
    submitting: "Sending…",
    submitHint:
      "Your request will remain pending. The deposit is credited only after administration review.",
    secureHeading: "Secure payment",
    secureBody:
      "Your information is protected. The transfer will be checked manually before any credit.",
    back: "Close payment",
    missingOwner: "Not provided",
    copyFailed: "Could not copy the number.",
    openNew: "Opens in a new tab",
    paymentDetails: "Payment instructions",
    languageButton: "FRANÇAIS",
    timeRemaining: "Time remaining",
    copyTitle: "Transfer details",
    phoneInvalid: "Enter the 10 digits of your Côte d’Ivoire number after +225.",
  },
} as const;

const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

export function CiMobileMoneyCheckout({
  amountXof,
  currency,
  operatorName,
  operatorLogoUrl,
  payerPhoneDigits,
  onPayerPhoneDigitsChange,
  isSubmitting,
  onBack,
  onSubmitForReview,
  onToggleLanguage,
  language,
}: CiMobileMoneyCheckoutProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.floor(PAYMENT_WINDOW_MS / 1000),
  );
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const paymentDeadlineRef = useRef(Date.now() + PAYMENT_WINDOW_MS);

  const isEnglish = language.toLowerCase().startsWith("en");
  const copy = isEnglish ? COPY.en : COPY.fr;
  const formattedTimeRemaining = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const displayedOperatorLogo = operatorName.trim().toLowerCase().includes("wave")
    ? waveMobileMoneyLogo
    : operatorLogoUrl;
  const formattedAmount = Number.isFinite(amountXof)
    ? new Intl.NumberFormat(isEnglish ? "en-US" : "fr-FR", {
        maximumFractionDigits: 0,
      }).format(amountXof)
    : String(amountXof);
  const displayCurrency = currency.toUpperCase() === "XOF" ? "FCFA" : currency;

  useEffect(() => {
    const updateCountdown = () => {
      const nextSeconds = Math.max(
        0,
        Math.ceil((paymentDeadlineRef.current - Date.now()) / 1000),
      );
      setSecondsRemaining(nextSeconds);
      if (nextSeconds === 0) window.clearInterval(intervalId);
    };

    const intervalId = window.setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => window.clearInterval(intervalId);
  }, []);

  const handleSubmit = () => {
    if (payerPhoneDigits.length !== 10) {
      phoneInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      phoneInputRef.current?.focus({ preventScroll: true });
      return;
    }
    onSubmitForReview();
  };

  return (
    <main className="ci-wave-checkout">
      <section className="ci-wave-screen" aria-label={copy.paymentDetails}>
        <button
          className="ci-wave-close"
          type="button"
          onClick={onBack}
          aria-label={copy.back}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <section className="ci-wave-card" aria-label={copy.paymentDetails}>
          <header className="ci-wave-header">
            <div className="ci-wave-identity">
              <div className="ci-wave-brand" aria-label="DIAMANT">
                <Gem size={21} strokeWidth={2.4} aria-hidden="true" />
                <span>DIAMANT</span>
              </div>
              <div className="ci-wave-country" aria-label="Côte d’Ivoire">
                <img src={ciFlagAsset} alt="" />
                <span>CI</span>
              </div>
            </div>
            <span
              className="ci-wave-timer"
              role="timer"
              aria-label={`${copy.timeRemaining}: ${formattedTimeRemaining}`}
              aria-live="off"
            >
              {formattedTimeRemaining}
            </span>
            <button
              className="ci-wave-language"
              type="button"
              onClick={onToggleLanguage}
              aria-label={isEnglish ? "Switch to French" : "Passer en anglais"}
            >
              <Globe2 size={17} aria-hidden="true" />
              <span>{copy.languageButton}</span>
            </button>
          </header>

          <div
            className="ci-wave-amount"
            aria-label={`${copy.exactAmount}: ${displayCurrency} ${formattedAmount}`}
          >
            <span>{copy.exactAmount}</span>
            <strong>
              {displayCurrency} {formattedAmount}
            </strong>
          </div>

          <div className="ci-wave-operator-icon" aria-hidden="true">
            {displayedOperatorLogo && !logoFailed ? (
              <img
                src={displayedOperatorLogo}
                alt=""
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <Smartphone size={29} strokeWidth={2} />
            )}
          </div>

          <div className="ci-wave-selected">
            <span>{operatorName || "Wave"}</span>
            <span className="ci-wave-selected-check">
              <Check size={17} strokeWidth={3} aria-hidden="true" />
            </span>
          </div>

          <label className="ci-wave-phone-control" htmlFor="ci-wave-phone">
            <span className="ci-wave-prefix" aria-hidden="true">+225</span>
            <span className="sr-only">{copy.phoneLabel}</span>
            <input
              ref={phoneInputRef}
              id="ci-wave-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              aria-describedby="ci-wave-phone-hint"
              value={payerPhoneDigits}
              onChange={(event) =>
                onPayerPhoneDigitsChange(
                  event.currentTarget.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              placeholder={copy.phonePlaceholder}
              maxLength={10}
            />
          </label>

          <p className="ci-wave-phone-hint" id="ci-wave-phone-hint">
            {copy.phoneHint}
          </p>

          <button
            className="ci-wave-submit"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? copy.submitting : copy.submit}
          </button>

          <div className="ci-wave-security">
            <span className="ci-wave-security-icon">
              <ShieldCheck size={21} aria-hidden="true" />
            </span>
            <span className="ci-wave-security-copy">
              <strong>
                <LockKeyhole size={12} aria-hidden="true" />
                {copy.secureHeading}
              </strong>
              <span>{copy.secureBody}</span>
            </span>
          </div>
        </section>
      </section>

    </main>
  );
}

export default CiMobileMoneyCheckout;
