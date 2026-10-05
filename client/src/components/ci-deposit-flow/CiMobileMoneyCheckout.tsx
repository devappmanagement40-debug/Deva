import { useRef, useState } from "react";
import ciFlagAsset from "@/assets/cote-divoire-flag.svg";
import waveMobileMoneyLogo from "@/assets/wave-mobile-money.jpg";
import {
  ArrowUpRight,
  Check,
  Copy,
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
    checkout: "Paiement Wave",
    exactAmount: "Montant du paiement",
    phoneLabel: "Numéro de portefeuille de paiement",
    phonePlaceholder: "Veuillez entrer le numéro de portefeuille…",
    phoneHint:
      "Veuillez saisir correctement votre numéro de portefeuille de paiement à 10 chiffres pour que votre paiement arrive avec précision",
    recipient: "Compte destinataire",
    owner: "Titulaire du compte",
    copy: "Copier",
    copied: "Copié",
    launch: "Ouvrir Wave",
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
    languageButton: "ENGLISH",
    copyTitle: "Informations pour le suivi",
    phoneInvalid: "Saisissez les 10 chiffres de votre numéro ivoirien après +225.",
  },
  en: {
    checkout: "Wave payment",
    exactAmount: "Payment amount",
    phoneLabel: "Payment wallet number",
    phonePlaceholder: "Enter your wallet phone number…",
    phoneHint:
      "Enter the correct 10-digit payment wallet number so your payment can be identified accurately.",
    recipient: "Recipient account",
    owner: "Account holder",
    copy: "Copy",
    copied: "Copied",
    launch: "Open Wave",
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
    languageButton: "FRANÇAIS",
    copyTitle: "Transfer details",
    phoneInvalid: "Enter the 10 digits of your Côte d’Ivoire number after +225.",
  },
} as const;

function isSafePaymentUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ["https:", "wave:"].includes(parsed.protocol);
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
  language,
}: CiMobileMoneyCheckoutProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const isEnglish = language.toLowerCase().startsWith("en");
  const copy = isEnglish ? COPY.en : COPY.fr;
  const displayedOperatorLogo = operatorName.trim().toLowerCase().includes("wave")
    ? waveMobileMoneyLogo
    : operatorLogoUrl;
  const safeUrl =
    paymentUrl?.trim() && isSafePaymentUrl(paymentUrl.trim())
      ? paymentUrl.trim()
      : "";
  const formattedAmount = Number.isFinite(amountXof)
    ? new Intl.NumberFormat(isEnglish ? "en-US" : "fr-FR", {
        maximumFractionDigits: 0,
      }).format(amountXof)
    : String(amountXof);
  const displayCurrency = currency.toUpperCase() === "XOF" ? "FCFA" : currency;

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

  const handleSubmit = () => {
    if (payerPhoneDigits.length !== 10) {
      phoneInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      phoneInputRef.current?.focus({ preventScroll: true });
      return;
    }
    if (!transactionId.trim()) {
      referenceInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      referenceInputRef.current?.focus({ preventScroll: true });
      return;
    }
    onSubmitForReview();
  };

  return (
    <main className="ci-wave-checkout">
      <section className="ci-wave-screen" aria-label={copy.checkout}>
        <button
          className="ci-wave-close"
          type="button"
          onClick={onBack}
          aria-label={copy.back}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <section className="ci-wave-card" aria-label={copy.checkout}>
          <header className="ci-wave-header">
            <div className="ci-wave-brand" aria-label="DIAMANT">
              <Gem size={21} strokeWidth={2.4} aria-hidden="true" />
              <span>DIAMANT</span>
            </div>
            <div className="ci-wave-country" aria-label="Côte d’Ivoire">
              <img src={ciFlagAsset} alt="" />
              <span>CI</span>
            </div>
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

          <div className="ci-wave-recipient">
            <div className="ci-wave-recipient-head">
              <span>{copy.recipient} · {operatorName || "Wave"}</span>
              <button type="button" onClick={() => void copyRecipient()}>
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? copy.copied : copy.copy}
              </button>
            </div>
            <strong className="ci-wave-recipient-phone">{operatorPhone}</strong>
            <span className="ci-wave-owner">
              {copy.owner}: {operatorOwnerName || copy.missingOwner}
            </span>
            {copyError && (
              <span className="ci-wave-copy-error" role="status">
                {copy.copyFailed}
              </span>
            )}
          </div>

          {safeUrl && (
            <a
              className="ci-wave-launch"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${copy.launch}. ${copy.openNew}`}
            >
              <ExternalLink size={17} aria-hidden="true" />
              {copy.launch}
            </a>
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
              ref={referenceInputRef}
              id="ci-wave-transaction-id"
              type="text"
              autoComplete="off"
              value={transactionId}
              maxLength={180}
              onChange={(event) =>
                onTransactionIdChange(event.currentTarget.value.slice(0, 180))
              }
              placeholder={copy.referencePlaceholder}
              required
            />

            <button
              className="ci-wave-proof"
              type="button"
              onClick={onPickProof}
              aria-label={copy.proof}
            >
              <ImagePlus size={19} aria-hidden="true" />
              <span>
                <strong>{proofName ? copy.replaceProof : copy.chooseProof}</strong>
                <small>{proofName || copy.noProof}</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>

            <p className="ci-wave-review-note">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{copy.submitHint}</span>
            </p>

            <button
              className="ci-wave-submit ci-wave-submit-details"
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? copy.submitting : copy.submitDetails}
            </button>
          </div>

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
