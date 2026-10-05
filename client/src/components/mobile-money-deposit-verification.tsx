import { useEffect, useState } from "react";
import { Check, CircleAlert, Clock3, Gem, Loader2, X } from "lucide-react";
import "./mobile-money-deposit-verification.css";

type MobileMoneyDepositVerificationProps = {
  amountXof: number;
  currency: string;
  operatorName: string;
  transactionId: string;
  status?: string | null;
  isStatusError?: boolean;
  language: string;
  onRetry(): Promise<void>;
  onReturn(): void;
  onToggleLanguage?(): void;
};

const VERIFICATION_SECONDS = 6 * 60;

const COPY = {
  fr: {
    brandSubtitle: "DÉPÔT · VÉRIFICATION",
    amount: "Montant",
    requestSent: "Demande envoyée",
    operator: "Opérateur",
    transactionId: "ID",
    verificationInProgress: "Vérification en cours",
    pendingValidation: "En attente de validation",
    verificationExpired: "Le délai est écoulé",
    verificationExpiredBody: "Votre dépôt est toujours en attente. Vous pouvez relancer la vérification.",
    statusUnavailable: "Le statut ne peut pas être actualisé pour le moment. Vérifiez votre connexion puis réessayez.",
    retry: "Réessayer",
    retrying: "Actualisation…",
    paymentApproved: "Paiement approuvé",
    approvedBody: "Le montant a été ajouté à votre solde.",
    paymentRejected: "Paiement non validé",
    rejectedBody: "Cette demande n’a pas été validée. Vérifiez les informations du paiement avant de recommencer.",
    returnToDeposits: "Retour aux dépôts",
    languageButton: "ENGLISH",
  },
  en: {
    brandSubtitle: "DEPOSIT · VERIFICATION",
    amount: "Amount",
    requestSent: "Request submitted",
    operator: "Operator",
    transactionId: "ID",
    verificationInProgress: "Verification in progress",
    pendingValidation: "Waiting for confirmation",
    verificationExpired: "Time is up",
    verificationExpiredBody: "Your deposit is still pending. You can restart the verification.",
    statusUnavailable: "The status could not be refreshed. Check your connection and try again.",
    retry: "Try again",
    retrying: "Refreshing…",
    paymentApproved: "Payment approved",
    approvedBody: "The amount has been added to your balance.",
    paymentRejected: "Payment not approved",
    rejectedBody: "This request was not approved. Check the payment details before starting again.",
    returnToDeposits: "Return to deposits",
    languageButton: "FRANÇAIS",
  },
} as const;

export function MobileMoneyDepositVerification({
  amountXof,
  currency,
  operatorName,
  transactionId,
  status,
  isStatusError = false,
  language,
  onRetry,
  onReturn,
  onToggleLanguage,
}: MobileMoneyDepositVerificationProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(VERIFICATION_SECONDS);
  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const isEnglish = language.toLowerCase().startsWith("en");
  const copy = isEnglish ? COPY.en : COPY.fr;
  const normalizedStatus = status?.trim().toLowerCase() ?? "";
  const isApproved = normalizedStatus === "approved";
  const isRejected = ["rejected", "failed", "cancelled", "canceled"].includes(normalizedStatus);
  const isPending = !isApproved && !isRejected;
  const verificationTime = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const displayCurrency = currency.trim().toUpperCase() || "XOF";
  const formattedAmount = Number.isFinite(amountXof)
    ? new Intl.NumberFormat(isEnglish ? "en-US" : "fr-FR", {
        maximumFractionDigits: 0,
      }).format(amountXof)
    : String(amountXof);

  useEffect(() => {
    const deadline = Date.now() + VERIFICATION_SECONDS * 1000;
    let intervalId: number | undefined;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0 && intervalId !== undefined) window.clearInterval(intervalId);
    };

    intervalId = window.setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => window.clearInterval(intervalId);
  }, [attempt]);

  const retryVerification = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setRetryFailed(false);
    try {
      await onRetry();
      setAttempt((current) => current + 1);
    } catch {
      setRetryFailed(true);
    } finally {
      setIsRetrying(false);
    }
  };

  const statusTitle = isApproved
    ? copy.paymentApproved
    : isRejected
      ? copy.paymentRejected
      : copy.requestSent;

  return (
    <main className="mmv-page" aria-label={copy.brandSubtitle}>
      <header className="mmv-header">
        <div className="mmv-brand">
          <Gem size={22} strokeWidth={2.4} aria-hidden="true" />
          <span>DIAMANT</span>
          <span className="mmv-brand-subtitle">{copy.brandSubtitle}</span>
        </div>
        {onToggleLanguage && (
          <button
            className="mmv-language"
            type="button"
            onClick={onToggleLanguage}
            aria-label={isEnglish ? "Switch to French" : "Passer en anglais"}
          >
            {copy.languageButton}
          </button>
        )}
      </header>

      <section className="mmv-amount" aria-label={`${copy.amount}: ${formattedAmount} ${displayCurrency}`}>
        <div>
          <span>{copy.amount}</span>
          <strong>{formattedAmount} {displayCurrency}</strong>
        </div>
        {!isApproved && !isRejected && (
          <span
            className="mmv-time-pill"
            role="timer"
            aria-label={`${copy.verificationInProgress} · ${verificationTime}`}
            aria-live="off"
          >
            <Clock3 size={15} aria-hidden="true" />
            {verificationTime}
          </span>
        )}
      </section>

      <section className="mmv-card" aria-labelledby="mmv-status-title">
        <div
          className={`mmv-result-icon${isApproved ? " mmv-result-icon--approved" : isRejected ? " mmv-result-icon--rejected" : " mmv-result-icon--pending"}`}
          aria-hidden="true"
        >
          {isRejected ? <X size={35} strokeWidth={2.5} /> : <Check size={36} strokeWidth={2.5} />}
        </div>
        <h1 id="mmv-status-title" className="mmv-title" role="status" aria-live="polite">{statusTitle}</h1>

        <dl className="mmv-details">
          <div>
            <dt>{copy.operator}</dt>
            <dd>{operatorName}</dd>
          </div>
          <div>
            <dt>{copy.amount}</dt>
            <dd>{formattedAmount} {displayCurrency}</dd>
          </div>
          <div>
            <dt>{copy.transactionId}</dt>
            <dd className="mmv-transaction-id">{transactionId || "—"}</dd>
          </div>
        </dl>

        {isPending && secondsRemaining > 0 && (
          <div className="mmv-pending">
            <div className="mmv-pending-line">
              <Loader2 size={17} className="mmv-spinner" aria-hidden="true" />
              <strong>{copy.verificationInProgress}</strong>
            </div>
            <p>{copy.pendingValidation}</p>
            {isStatusError && <p className="mmv-inline-error" role="alert">{copy.statusUnavailable}</p>}
          </div>
        )}

        {isPending && secondsRemaining === 0 && (
          <div className="mmv-expired">
            <div className="mmv-expired-message">
              <CircleAlert size={19} aria-hidden="true" />
              <div>
                <strong>{copy.verificationExpired}</strong>
                <p>{copy.verificationExpiredBody}</p>
              </div>
            </div>
            {(isStatusError || retryFailed) && (
              <p className="mmv-inline-error" role="alert">{copy.statusUnavailable}</p>
            )}
            <button
              className="mmv-retry"
              type="button"
              onClick={() => void retryVerification()}
              disabled={isRetrying}
              aria-busy={isRetrying}
              data-testid="button-retry-deposit-verification"
            >
              {isRetrying ? <Loader2 size={17} className="mmv-spinner" aria-hidden="true" /> : null}
              {isRetrying ? copy.retrying : copy.retry}
            </button>
          </div>
        )}

        {isApproved && (
          <div className="mmv-terminal mmv-terminal--approved">
            <Check size={18} aria-hidden="true" />
            <p>{copy.approvedBody}</p>
          </div>
        )}

        {isRejected && (
          <div className="mmv-terminal mmv-terminal--rejected">
            <CircleAlert size={18} aria-hidden="true" />
            <p>{copy.rejectedBody}</p>
          </div>
        )}

        <button className="mmv-return" type="button" onClick={onReturn}>
          {copy.returnToDeposits}
        </button>
      </section>
    </main>
  );
}

export default MobileMoneyDepositVerification;
