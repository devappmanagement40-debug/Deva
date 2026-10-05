import { useEffect, useRef, useState } from "react";
import ciFlagAsset from "@/assets/cote-divoire-flag.svg";
import waveMobileMoneyLogo from "@/assets/wave-mobile-money.png";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  ExternalLink,
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
  operatorLogoUrl?: string | null;
  paymentUrl?: string | null;
  payerPhoneDigits: string;
  onPayerPhoneDigitsChange(value: string): void;
  transactionId: string;
  onTransactionIdChange(value: string): void;
  isSubmitting: boolean;
  onBack(): void;
  onSubmitForReview(): void;
  onToggleLanguage?(): void;
  previewAcknowledgement?: boolean;
  language: string;
};

type CheckoutStep = "phone" | "payment";

const COPY = {
  fr: {
    exactAmount: "Montant du paiement",
    phoneLabel: "Numéro de portefeuille de paiement",
    phonePlaceholder: "Veuillez entrer le numéro de portefeuille…",
    phoneHint:
      "Veuillez saisir correctement votre numéro de portefeuille de paiement à 10 chiffres pour que votre paiement arrive avec précision",
    launch: "Ouvrir Wave",
    stageTitle: "Effectuez votre transfert",
    stageIntro: "Payez avec Wave, puis indiquez la référence de votre transaction.",
    paymentUnavailable: "Le lien de paiement Wave n’est pas configuré. Vous ne pouvez pas poursuivre ce dépôt pour le moment.",
    paymentInstructions: "Après le paiement, saisissez le numéro de transaction affiché sur votre reçu.",
    reference: "Numéro de transaction",
    referenceHint: "Saisissez la référence indiquée sur le reçu de votre transfert.",
    referencePlaceholder: "Ex. : référence du reçu",
    required: "Obligatoire",
    submit: "Soumettre",
    submitDetails: "Envoyer la référence pour vérification",
    submitting: "Envoi en cours…",
    secureHeading: "Paiement sécurisé",
    secureBody:
      "Après le transfert, indiquez sa référence pour transmettre votre demande à l’administration. Le dépôt restera en attente de vérification.",
    back: "Fermer le paiement",
    openNew: "S’ouvre dans un nouvel onglet",
    paymentDetails: "Instructions de paiement",
    languageButton: "ENGLISH",
    timeRemaining: "Temps restant",
    backToPhone: "Modifier mon numéro",
    reviewNote: "Votre demande sera transmise à l’administration pour vérification. Le dépôt restera en attente et ne sera pas crédité automatiquement.",
    previewAcknowledgement: "Aperçu uniquement : la référence serait envoyée à l’administration pour vérification.",
    previewDone: "Aperçu terminé",
  },
  en: {
    exactAmount: "Payment amount",
    phoneLabel: "Payment wallet number",
    phonePlaceholder: "Enter your wallet phone number…",
    phoneHint:
      "Enter the correct 10-digit payment wallet number so your payment can be identified accurately.",
    launch: "Open Wave",
    stageTitle: "Make your transfer",
    stageIntro: "Pay with Wave, then enter your transaction reference.",
    paymentUnavailable: "The Wave payment link is not configured. You cannot continue this deposit right now.",
    paymentInstructions: "After payment, enter the transaction number shown on your receipt.",
    reference: "Transaction number",
    referenceHint: "Enter the reference shown on your transfer receipt.",
    referencePlaceholder: "e.g. receipt reference",
    required: "Required",
    submit: "Submit",
    submitDetails: "Send reference for review",
    submitting: "Sending…",
    secureHeading: "Secure payment",
    secureBody:
      "After the transfer, enter its reference to send your request to administration. The deposit will remain pending review.",
    back: "Close payment",
    openNew: "Opens in a new tab",
    paymentDetails: "Payment instructions",
    languageButton: "FRANÇAIS",
    timeRemaining: "Time remaining",
    backToPhone: "Edit my phone number",
    reviewNote: "Your request will be sent to administration for review. The deposit will remain pending and will not be credited automatically.",
    previewAcknowledgement: "Preview only: the reference would be sent to administration for review.",
    previewDone: "Preview complete",
  },
} as const;

const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

function isSafePaymentUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "wave:";
  } catch {
    return false;
  }
}

export function CiMobileMoneyCheckout({
  amountXof,
  currency,
  operatorName,
  operatorLogoUrl,
  paymentUrl,
  payerPhoneDigits,
  onPayerPhoneDigitsChange,
  transactionId,
  onTransactionIdChange,
  isSubmitting,
  onBack,
  onSubmitForReview,
  onToggleLanguage,
  previewAcknowledgement = false,
  language,
}: CiMobileMoneyCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>("phone");
  const [logoFailed, setLogoFailed] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.floor(PAYMENT_WINDOW_MS / 1000),
  );
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const paymentDeadlineRef = useRef(Date.now() + PAYMENT_WINDOW_MS);

  const isEnglish = language.toLowerCase().startsWith("en");
  const copy = isEnglish ? COPY.en : COPY.fr;
  const trimmedPaymentUrl = paymentUrl?.trim() ?? "";
  const safePaymentUrl = trimmedPaymentUrl && isSafePaymentUrl(trimmedPaymentUrl)
    ? trimmedPaymentUrl
    : "";
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
    setStep("payment");
  };

  const handleSubmitForReview = () => {
    if (!transactionId.trim() || isSubmitting || previewAcknowledgement) return;
    onSubmitForReview();
  };

  return (
    <main className="ci-wave-checkout">
      <section
        className={`ci-wave-screen${step === "payment" ? " ci-wave-screen--payment" : ""}`}
        aria-label={copy.paymentDetails}
      >
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

          {step === "phone" ? (
            <>
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
                  autoComplete="off"
                  name="ci-wave-payment-phone"
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
                {copy.submit}
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
            </>
          ) : (
            <section className="ci-wave-stage-two" aria-labelledby="ci-wave-stage-title">
              <button
                className="ci-wave-back-step"
                type="button"
                onClick={() => setStep("phone")}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                {copy.backToPhone}
              </button>

              <div className="ci-wave-stage-heading">
                <span className="ci-wave-stage-mark">
                  {displayedOperatorLogo && !logoFailed
                    ? <img src={displayedOperatorLogo} alt="" onError={() => setLogoFailed(true)} />
                    : <Smartphone size={19} aria-hidden="true" />}
                </span>
                <span>
                  <strong id="ci-wave-stage-title">{copy.stageTitle}</strong>
                  <small>{copy.stageIntro}</small>
                </span>
              </div>

              <div className="ci-wave-transfer-banner">
                <span className="ci-wave-transfer-logo" aria-hidden="true">
                  {displayedOperatorLogo && !logoFailed
                    ? <img src={displayedOperatorLogo} alt="" onError={() => setLogoFailed(true)} />
                    : <Smartphone size={23} />}
                </span>
                <span>
                  <strong>{operatorName || "Wave"}</strong>
                  <small>{copy.paymentInstructions}</small>
                </span>
              </div>

              {safePaymentUrl ? (
                <a
                  className="ci-wave-launch"
                  href={safePaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${copy.launch}. ${copy.openNew}`}
                >
                  <ExternalLink size={17} aria-hidden="true" />
                  {copy.launch}
                </a>
              ) : (
                <div className="ci-wave-payment-unavailable" role="status">
                  <CircleAlert size={17} aria-hidden="true" />
                  <span>{copy.paymentUnavailable}</span>
                </div>
              )}

              <div className="ci-wave-reference">
                <label htmlFor="ci-wave-transaction-id">
                  <span className="ci-wave-reference-label">
                    <span>{copy.reference}</span>
                    <strong>{copy.required}</strong>
                  </span>
                  <span className="ci-wave-reference-hint">{copy.referenceHint}</span>
                </label>
                <input
                  id="ci-wave-transaction-id"
                  type="text"
                  autoComplete="off"
                  value={transactionId}
                  maxLength={180}
                  onChange={(event) => onTransactionIdChange(event.currentTarget.value.slice(0, 180))}
                  placeholder={copy.referencePlaceholder}
                  required
                />
                <p className="ci-wave-review-note">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>{copy.reviewNote}</span>
                </p>
                {previewAcknowledgement && (
                  <p className="ci-wave-preview-ack" role="status">
                    <Check size={16} aria-hidden="true" />
                    <span>{copy.previewAcknowledgement}</span>
                  </p>
                )}
                <button
                  className="ci-wave-submit ci-wave-submit-details"
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={!transactionId.trim() || isSubmitting || previewAcknowledgement}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? copy.submitting : previewAcknowledgement ? copy.previewDone : copy.submitDetails}
                </button>
              </div>
            </section>
          )}
        </section>
      </section>

    </main>
  );
}

export default CiMobileMoneyCheckout;
