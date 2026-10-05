import { useId, useRef, useState } from "react";
import {
  Check,
  CreditCard,
  PencilLine,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import {
  TOGO_TRANSACTION_ID_MAX_LENGTH,
  validateTogoTransactionId,
} from "@shared/togo-transaction-id";
import { resolveTogoOperatorLogoUrl } from "@/lib/togo-operator-logo";
import "./TgPaymentInstructions.css";

export type TgCopyField = "accountNumber" | "ussdCode";

export type TgPaymentInstructionsProps = {
  amount: number | string;
  countdown: string | number;
  operatorName: string;
  operatorLogoUrl?: string | null;
  recipientLabel: string;
  badge: string;
  accountNumber: string;
  ussdCode: string;
  ownerName: string;
  payerPhone: string;
  transactionId: string;
  copiedState: TgCopyField | null;
  submitting: boolean;
  language?: "fr" | "en";
  onClose(): void;
  onToggleLanguage(): void;
  onCopy(value: string, field: TgCopyField): void;
  onEditPhone(): void;
  onTransactionIdChange(value: string): void;
  onComplete(transactionId: string): void;
};

const COPY = {
  fr: {
    amount: "MONTANT À PAYER",
    paymentInstructions: "Instructions de paiement",
    recipient: "Destinataire:",
    quickUssd: "Code USSD rapide",
    owner: "Titulaire de la carte",
    verifyPhone: "Vérifiez votre numéro",
    phoneHint: "Si incorrect, modifiez-le.",
    transactionIdLabel: "ID de transaction *",
    transactionIdPlaceholder: "Saisissez l’ID après le paiement",
    transactionIdRequired: "L’ID de transaction est obligatoire.",
    transactionIdTooLong: "L’ID ne peut pas dépasser 180 caractères.",
    copy: "Copier",
    copied: "Copié",
    edit: "Éditer",
    complete: "J’ai terminé le paiement",
    submitting: "Vérification…",
    close: "Fermer les instructions de paiement",
    switchLanguage: "Switch to English",
    timeRemaining: "Temps restant",
  },
  en: {
    amount: "AMOUNT TO PAY",
    paymentInstructions: "Payment instructions",
    recipient: "Recipient:",
    quickUssd: "Quick USSD code",
    owner: "Account holder",
    verifyPhone: "Verify your number",
    phoneHint: "If it’s incorrect, edit it.",
    transactionIdLabel: "Transaction ID *",
    transactionIdPlaceholder: "Enter the ID after payment",
    transactionIdRequired: "The transaction ID is required.",
    transactionIdTooLong: "The ID cannot exceed 180 characters.",
    copy: "Copy",
    copied: "Copied",
    edit: "Edit",
    complete: "I’ve completed the payment",
    submitting: "Checking…",
    close: "Close payment instructions",
    switchLanguage: "Passer en français",
    timeRemaining: "Time remaining",
  },
} as const;

function displayCountdown(countdown: string | number): string {
  if (typeof countdown === "string") return countdown;
  const seconds = Math.max(0, Math.floor(countdown));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
}

export function TgPaymentInstructions({
  amount,
  countdown,
  operatorName,
  operatorLogoUrl,
  recipientLabel,
  badge,
  accountNumber,
  ussdCode,
  ownerName,
  payerPhone,
  transactionId,
  copiedState,
  submitting,
  language = "fr",
  onClose,
  onToggleLanguage,
  onCopy,
  onEditPhone,
  onTransactionIdChange,
  onComplete,
}: TgPaymentInstructionsProps) {
  const transactionIdFieldId = useId();
  const transactionIdInputRef = useRef<HTMLInputElement>(null);
  const [transactionIdAttempted, setTransactionIdAttempted] = useState(false);
  const copy = language === "en" ? COPY.en : COPY.fr;
  const timer = displayCountdown(countdown);
  const operatorNameLower = operatorName.toLowerCase();
  const operatorFallback = operatorNameLower.includes("moov")
    ? "Moov"
    : operatorNameLower.includes("tmoney") || operatorNameLower.includes("togocom")
      ? "TMoney"
      : operatorNameLower.includes("yas") || operatorNameLower.includes("togocel")
      ? "Yas"
      : operatorName.slice(0, 2).toUpperCase();
  const resolvedOperatorLogoUrl = resolveTogoOperatorLogoUrl(
    operatorName,
    operatorLogoUrl,
  );
  const transactionIdValidation = validateTogoTransactionId(transactionId);
  const transactionIdInvalid = !transactionIdValidation.ok;
  const handleComplete = () => {
    if (!transactionIdValidation.ok) {
      setTransactionIdAttempted(true);
      transactionIdInputRef.current?.focus();
      return;
    }
    onComplete(transactionIdValidation.value);
  };

  return (
    <main className="tg-payment-step">
      <header className="tg-payment-hero">
        <div className="tg-payment-hero-top">
          <div className="tg-payment-brand" aria-label="DIAMANT">
            <img src="/diamant-mark.svg" alt="" />
          </div>

          <div className="tg-payment-quick-controls">
            <span
              className="tg-payment-timer"
              role="timer"
              aria-label={`${copy.timeRemaining}: ${timer}`}
              aria-live="off"
            >
              {timer}
            </span>
            <button
              className="tg-payment-language"
              type="button"
              onClick={onToggleLanguage}
              aria-label={copy.switchLanguage}
            >
              {language === "en" ? "EN" : "FR"}
            </button>
          </div>

          <button
            className="tg-payment-close"
            type="button"
            onClick={onClose}
            aria-label={copy.close}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <div className="tg-payment-amount">
          <span>{copy.amount}</span>
          <strong>
            <small>XOF</small> {amount}
          </strong>
        </div>
      </header>

      <section className="tg-payment-content" aria-label={copy.paymentInstructions}>
        <h1 className="tg-payment-heading">
          <CreditCard size={21} strokeWidth={1.9} aria-hidden="true" />
          <span>{copy.paymentInstructions}</span>
        </h1>

        <div className="tg-payment-data-group">
          <div className="tg-payment-recipient-line">
            <span className="tg-payment-field-label">
              {copy.recipient} {recipientLabel}
            </span>
            <span className="tg-payment-badge">{badge}</span>
          </div>

          <div className="tg-payment-value-row">
            <div className="tg-payment-value tg-payment-number">
              {resolvedOperatorLogoUrl ? (
                <img className="tg-payment-operator-logo" src={resolvedOperatorLogoUrl} alt="" />
              ) : (
                <span className="tg-payment-yas-mark" aria-hidden="true">
                  {operatorFallback}
                </span>
              )}
              <strong>{accountNumber}</strong>
            </div>
            <button
              className="tg-payment-action"
              type="button"
              onClick={() => onCopy(accountNumber, "accountNumber")}
              aria-label={
                copiedState === "accountNumber" ? copy.copied : copy.copy
              }
            >
              {copiedState === "accountNumber" ? (
                <Check size={15} aria-hidden="true" />
              ) : null}
              <span>
                {copiedState === "accountNumber" ? copy.copied : copy.copy}
              </span>
            </button>
          </div>

          <div className="tg-payment-field-label tg-payment-usssd-label">
            {copy.quickUssd}
          </div>
          <div className="tg-payment-value-row">
            <div className="tg-payment-value tg-payment-ussd">
              <strong>{ussdCode}</strong>
            </div>
            <button
              className="tg-payment-action"
              type="button"
              onClick={() => onCopy(ussdCode, "ussdCode")}
              aria-label={copiedState === "ussdCode" ? copy.copied : copy.copy}
            >
              {copiedState === "ussdCode" ? (
                <Check size={15} aria-hidden="true" />
              ) : null}
              <span>{copiedState === "ussdCode" ? copy.copied : copy.copy}</span>
            </button>
          </div>

          <div className="tg-payment-field-label tg-payment-owner-label">
            {copy.owner}
          </div>
          <div className="tg-payment-value tg-payment-owner">
            <UserRound size={20} strokeWidth={2} aria-hidden="true" />
            <strong>{ownerName}</strong>
          </div>
        </div>

        <section className="tg-payment-phone-section">
          <h2 className="tg-payment-heading tg-payment-phone-heading">
            <PencilLine size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>{copy.verifyPhone}</span>
          </h2>
          <p className="tg-payment-phone-hint">{copy.phoneHint}</p>
          <div className="tg-payment-value-row">
            <div className="tg-payment-value tg-payment-phone">
              <Phone size={19} strokeWidth={2} aria-hidden="true" />
              <strong>{payerPhone}</strong>
            </div>
            <button
              className="tg-payment-action"
              type="button"
              onClick={onEditPhone}
              aria-label={copy.edit}
            >
              <span>{copy.edit}</span>
            </button>
          </div>
        </section>

        <div className="tg-payment-transaction-field">
          <label
            className="tg-payment-transaction-label"
            htmlFor={transactionIdFieldId}
          >
            {copy.transactionIdLabel}
          </label>
          <input
            ref={transactionIdInputRef}
            id={transactionIdFieldId}
            className="tg-payment-transaction-input"
            type="text"
            value={transactionId}
            placeholder={copy.transactionIdPlaceholder}
            maxLength={TOGO_TRANSACTION_ID_MAX_LENGTH}
            autoComplete="off"
            required
            aria-required="true"
            aria-invalid={transactionIdAttempted && transactionIdInvalid}
            aria-describedby={
              transactionIdAttempted && transactionIdInvalid
                ? `${transactionIdFieldId}-error`
                : undefined
            }
            onChange={(event) => {
              const value = event.currentTarget.value;
              onTransactionIdChange(value);
              if (validateTogoTransactionId(value).ok) {
                setTransactionIdAttempted(false);
              }
            }}
          />
          {transactionIdAttempted && transactionIdInvalid && (
            <p
              className="tg-payment-transaction-error"
              id={`${transactionIdFieldId}-error`}
              role="alert"
            >
              {transactionIdValidation.reason === "too_long"
                ? copy.transactionIdTooLong
                : copy.transactionIdRequired}
            </p>
          )}
        </div>

        <button
          className="tg-payment-complete"
          type="button"
          onClick={handleComplete}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? copy.submitting : copy.complete}
        </button>
      </section>
    </main>
  );
}

export default TgPaymentInstructions;
