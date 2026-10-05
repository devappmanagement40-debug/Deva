import { useEffect, useRef, useState } from "react";
import ciFlagAsset from "@/assets/cote-divoire-flag.svg";
import waveMobileMoneyLogo from "@/assets/wave-mobile-money.png";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  Copy,
  Download,
  ExternalLink,
  Gem,
  Globe2,
  ImagePlus,
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
  previewAcknowledgement?: boolean;
  language: string;
};

type CheckoutStep = "phone" | "payment";
type PaymentTab = "app" | "qr";

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
    appHeading: "Payer avec Wave",
    appInstructions:
      "Envoyez le montant affiché au compte Wave ci-dessous, puis indiquez la référence de la transaction.",
    launch: "Ouvrir Wave",
    launchUnavailable: "Lien de paiement non configuré",
    qrHeading: "Code QR de paiement",
    scanInstructions: "Scannez ce code avec votre application Wave.",
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
      "Après le transfert, indiquez sa référence pour transmettre votre demande à l’administration. Le dépôt restera en attente de vérification.",
    back: "Fermer le paiement",
    missingOwner: "Non renseigné",
    copyFailed: "Impossible de copier le numéro.",
    openNew: "S’ouvre dans un nouvel onglet",
    paymentDetails: "Instructions de paiement",
    languageButton: "ENGLISH",
    timeRemaining: "Temps restant",
    copyTitle: "Informations pour le suivi",
    phoneInvalid: "Saisissez les 10 chiffres de votre numéro ivoirien après +225.",
    continue: "Continuer",
    stageTitle: "Effectuez votre transfert",
    stageIntro: "Envoyez le montant indiqué avec Wave, puis renseignez la référence du reçu.",
    backToPhone: "Modifier mon numéro",
    appTab: "Ouvrir Wave",
    qrTab: "Code QR",
    transferAmount: "Montant à transférer",
    appBody: "Ouvrez Wave et suivez les instructions de paiement affichées ici.",
    paymentUnavailable: "Les instructions de paiement Wave ne sont pas configurées. Réessayez plus tard ou contactez l’assistance.",
    recipientUnavailable: "Numéro non configuré",
    saveQr: "Enregistrer le code QR",
    qrSavedHint: "Enregistrez le code QR sur votre appareil pour le scanner plus tard.",
    reviewNote: "Votre demande sera transmise à l’administration pour vérification. Le dépôt restera en attente et ne sera pas crédité automatiquement.",
    submitForReview: "Envoyer la référence pour vérification",
    previewAcknowledgement: "Aperçu uniquement : la référence serait envoyée à l’administration pour vérification.",
    previewDone: "Aperçu terminé",
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
    appHeading: "Pay with Wave",
    appInstructions:
      "Send the amount shown to the Wave account below, then enter the transaction reference.",
    launch: "Open Wave",
    launchUnavailable: "Payment link not configured",
    qrHeading: "Payment QR code",
    scanInstructions: "Scan this code with your Wave app.",
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
      "After the transfer, enter its reference to send your request to administration. The deposit will remain pending review.",
    back: "Close payment",
    missingOwner: "Not provided",
    copyFailed: "Could not copy the number.",
    openNew: "Opens in a new tab",
    paymentDetails: "Payment instructions",
    languageButton: "FRANÇAIS",
    timeRemaining: "Time remaining",
    copyTitle: "Transfer details",
    phoneInvalid: "Enter the 10 digits of your Côte d’Ivoire number after +225.",
    continue: "Continue",
    stageTitle: "Make your transfer",
    stageIntro: "Send the amount shown with Wave, then enter the reference from your receipt.",
    backToPhone: "Edit my phone number",
    appTab: "Open Wave",
    qrTab: "QR code",
    transferAmount: "Transfer amount",
    appBody: "Open Wave and follow the payment instructions shown here.",
    paymentUnavailable: "Wave payment instructions are not configured. Try again later or contact support.",
    recipientUnavailable: "Number not configured",
    saveQr: "Save QR code",
    qrSavedHint: "Save the QR code to your device and scan it later.",
    reviewNote: "Your request will be sent to administration for review. The deposit will remain pending and will not be credited automatically.",
    submitForReview: "Send reference for review",
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
  operatorPhone,
  operatorOwnerName,
  operatorLogoUrl,
  paymentUrl,
  paymentQrDataUrl,
  payerPhoneDigits,
  onPayerPhoneDigitsChange,
  transactionId,
  onTransactionIdChange,
  proofName,
  onPickProof,
  isSubmitting,
  onBack,
  onSubmitForReview,
  onToggleLanguage,
  previewAcknowledgement = false,
  language,
}: CiMobileMoneyCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>("phone");
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("app");
  const [generatedQr, setGeneratedQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
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
  const configuredQr = paymentQrDataUrl?.trim() ?? "";
  const qrSource = /^data:image\/(?:png|jpeg|webp);/i.test(configuredQr)
    ? configuredQr
    : "";
  const displayedQr = qrSource || generatedQr;
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
    let cancelled = false;
    if (!safePaymentUrl || qrSource) {
      setGeneratedQr("");
      return () => {
        cancelled = true;
      };
    }
    void QRCode.toDataURL(safePaymentUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
    }).then((dataUrl) => {
      if (!cancelled) setGeneratedQr(dataUrl);
    }).catch(() => {
      if (!cancelled) setGeneratedQr("");
    });
    return () => {
      cancelled = true;
    };
  }, [safePaymentUrl, qrSource]);

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
    setPaymentTab(!safePaymentUrl && displayedQr ? "qr" : "app");
  };

  const copyRecipient = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(operatorPhone);
      } else {
        const field = document.createElement("textarea");
        field.value = operatorPhone;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const success = document.execCommand("copy");
        field.remove();
        if (!success) throw new Error("Clipboard unavailable");
      }
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
      setCopied(false);
    }
  };

  const saveQr = () => {
    if (!displayedQr) return;
    const link = document.createElement("a");
    link.href = displayedQr;
    const qrFormat = displayedQr.match(/^data:image\/(png|jpeg|webp);/i)?.[1]?.toLowerCase();
    link.download = `diamant-wave-qr.${qrFormat === "jpeg" ? "jpg" : qrFormat || "png"}`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
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

              <div className="ci-wave-transfer-amount">
                <span>{copy.transferAmount}</span>
                <strong>{displayCurrency} {formattedAmount}</strong>
              </div>

              <div className="ci-wave-recipient">
                <div className="ci-wave-recipient-head">
                  <span>{copy.recipient} · {operatorName || "Wave"}</span>
                  <button type="button" onClick={() => void copyRecipient()} disabled={!operatorPhone.trim()}>
                    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copied ? copy.copied : copy.copy}
                  </button>
                </div>
                <strong className="ci-wave-recipient-phone">{operatorPhone || copy.recipientUnavailable}</strong>
                <span className="ci-wave-owner">{copy.owner}: {operatorOwnerName || copy.missingOwner}</span>
                {copyError && <span className="ci-wave-copy-error" role="status">{copy.copyFailed}</span>}
              </div>

              <div className="ci-wave-payment-tabs" role="tablist" aria-label={copy.paymentDetails}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={paymentTab === "app"}
                  aria-controls="ci-wave-app-panel"
                  id="ci-wave-app-tab"
                  onClick={() => setPaymentTab("app")}
                >
                  <ExternalLink size={15} aria-hidden="true" />
                  {copy.appTab}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={paymentTab === "qr"}
                  aria-controls="ci-wave-qr-panel"
                  id="ci-wave-qr-tab"
                  onClick={() => setPaymentTab("qr")}
                >
                  <Smartphone size={15} aria-hidden="true" />
                  {copy.qrTab}
                </button>
              </div>

              {paymentTab === "app" ? (
                <div className="ci-wave-payment-panel" role="tabpanel" id="ci-wave-app-panel" aria-labelledby="ci-wave-app-tab">
                  <div className="ci-wave-transfer-banner">
                    <span className="ci-wave-transfer-logo" aria-hidden="true">
                      {displayedOperatorLogo && !logoFailed
                        ? <img src={displayedOperatorLogo} alt="" onError={() => setLogoFailed(true)} />
                        : <Smartphone size={23} />}
                    </span>
                    <strong>{copy.appHeading}</strong>
                    <p>{copy.appBody}</p>
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
                    <div className="ci-wave-config-note" role="status">
                      <CircleAlert size={17} aria-hidden="true" />
                      <span>{copy.paymentUnavailable}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ci-wave-payment-panel" role="tabpanel" id="ci-wave-qr-panel" aria-labelledby="ci-wave-qr-tab">
                  <div className="ci-wave-config-note">
                    <CircleAlert size={17} aria-hidden="true" />
                    <span>{copy.scanInstructions}</span>
                  </div>
                  <div className="ci-wave-qr-panel">
                    {displayedQr ? (
                      <img className="ci-wave-qr" src={displayedQr} alt={`${copy.qrHeading} · ${operatorName}`} />
                    ) : (
                      <div className="ci-wave-qr-unavailable" role="status">
                        <ImagePlus size={25} aria-hidden="true" />
                        <strong>{copy.qrUnavailable}</strong>
                        <small>{copy.paymentUnavailable}</small>
                      </div>
                    )}
                  </div>
                  {displayedQr && (
                    <>
                      <button className="ci-wave-save-qr" type="button" onClick={saveQr}>
                        <Download size={18} aria-hidden="true" />
                        {copy.saveQr}
                      </button>
                      <p className="ci-wave-qr-save-hint">{copy.qrSavedHint}</p>
                    </>
                  )}
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
                <button className="ci-wave-proof" type="button" onClick={onPickProof}>
                  <ImagePlus size={18} aria-hidden="true" />
                  <span>
                    <strong>{proofName ? copy.replaceProof : copy.chooseProof}</strong>
                    <small>{proofName || copy.noProof}</small>
                  </span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
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
                  onClick={onSubmitForReview}
                  disabled={!transactionId.trim() || isSubmitting || previewAcknowledgement}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? copy.submitting : previewAcknowledgement ? copy.previewDone : copy.submitForReview}
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
