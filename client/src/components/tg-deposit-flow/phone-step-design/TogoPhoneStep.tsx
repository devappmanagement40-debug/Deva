import { useId } from "react";
import { resolveTogoOperatorLogoUrl } from "@/lib/togo-operator-logo";
import "./TogoPhoneStep.css";

export type TogoPhoneOperator = {
  id: string | number;
  name: string;
  logoUrl?: string | null;
};

export type TogoPhoneStepProps = {
  amount: number | string;
  phoneDigits: string;
  operators: TogoPhoneOperator[];
  selectedOperatorId: string | number | null;
  loading: boolean;
  error?: string | null;
  disabled: boolean;
  onPhoneChange(value: string): void;
  onOperatorSelect(operatorId: string | number): void;
  onNext(): void;
  onClose(): void;
  onLanguage(): void;
  language?: "fr" | "en";
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.6 3.8h2.9l1.4 4.4-2 1.6a15.1 15.1 0 0 0 5.3 5.3l1.6-2 4.4 1.4v2.9a2 2 0 0 1-2.2 2A16 16 0 0 1 4.6 6a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5 19 6v5.3c0 4.3-2.9 7.5-7 9.2-4.1-1.7-7-4.9-7-9.2V6l7-2.5Z" />
      <path d="m9.3 12 1.8 1.8 3.8-4" />
    </svg>
  );
}

function formatAmount(amount: number | string) {
  const value = typeof amount === "number" ? amount : Number(amount);
  return Number.isFinite(value) ? String(value) : amount;
}

export function TogoPhoneStep({
  amount,
  phoneDigits,
  operators,
  selectedOperatorId,
  loading,
  error,
  disabled,
  onPhoneChange,
  onOperatorSelect,
  onNext,
  onClose,
  onLanguage,
  language = "fr",
}: TogoPhoneStepProps) {
  const phoneId = useId();
  const isEnglish = language === "en";
  const copy = isEnglish
    ? {
        amount: "AMOUNT TO PAY",
        phoneLabel: "Your Togo phone number",
        placeholder: "Enter 8 digits (e.g. 12 34 56 78)",
        hint: "Please enter your phone number carefully. An incorrect entry may result in the loss of transferred funds.",
        next: "Continue",
        loading: "Loading…",
        secure: "Encrypted and secure",
        close: "Close deposit",
        language: "FR",
        operator: "Choose your operator",
      }
    : {
        amount: "MONTANT À PAYER",
        phoneLabel: "Votre numéro",
        placeholder: "Entrez 8 chiffres (ex : 12 34 56 78)",
        hint: "Veuillez saisir votre numéro de téléphone avec précision. Une saisie incorrecte peut entraîner la perte des fonds transférés.",
        next: "Suivant",
        loading: "Chargement…",
        secure: "Crypté et sécurisé",
        close: "Fermer le dépôt",
        language: "EN",
        operator: "Choisissez votre opérateur",
      };
  const formattedAmount = formatAmount(amount);
  const isNextDisabled = disabled || loading || phoneDigits.length !== 8 || !selectedOperatorId;
  const operatorNames = operators.map((operator) => operator.name).filter(Boolean).join(" / ");

  return (
    <main className="tg-phone-step">
      <section className="tg-phone-step__hero" aria-label={copy.amount}>
        <div className="tg-phone-step__hero-top">
          <div className="tg-phone-step__brand" aria-label="DIAMANT">
            <img src="/diamant-mark.svg" alt="" />
          </div>
          <button
            className="tg-phone-step__language"
            type="button"
            onClick={onLanguage}
            aria-label={isEnglish ? "Switch to French" : "Passer en anglais"}
          >
            {copy.language}
          </button>
          <button
            className="tg-phone-step__close"
            type="button"
            onClick={onClose}
            aria-label={copy.close}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="tg-phone-step__amount">
          <span>{copy.amount}</span>
          <strong><small>XOF</small> {formattedAmount}</strong>
        </div>
      </section>

      <section className="tg-phone-step__body">
        <div className="tg-phone-step__operator-heading">
          <PhoneIcon />
          <label htmlFor={phoneId}>
            {copy.phoneLabel} {operatorNames && <span>{operatorNames}</span>}
          </label>
        </div>

        <label className="tg-phone-step__input-wrap" htmlFor={phoneId}>
          <span className="tg-phone-step__prefix" aria-hidden="true">+228</span>
          <input
            id={phoneId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phoneDigits}
            maxLength={8}
            placeholder={copy.placeholder}
            onChange={(event) =>
              onPhoneChange(event.currentTarget.value.replace(/\D/g, "").slice(0, 8))
            }
            aria-invalid={phoneDigits.length > 0 && phoneDigits.length !== 8}
            aria-describedby={`${phoneId}-hint`}
            disabled={disabled || loading}
          />
        </label>

        <div className="tg-phone-step__notice" id={`${phoneId}-hint`}>
          <InfoIcon />
          <span>{copy.hint}</span>
        </div>

        {operators.length > 0 && (
          <div className="tg-phone-step__operator-list" role="group" aria-label={copy.operator}>
            {operators.map((operator) => {
              const selected = operator.id === selectedOperatorId;
              const lowerName = operator.name.toLowerCase();
              const fallbackName = lowerName.includes("moov")
                ? "Moov"
                : lowerName.includes("tmoney") || lowerName.includes("togocom")
                  ? "TMoney"
                  : lowerName.includes("yas") || lowerName.includes("togocel")
                  ? "Yas"
                  : operator.name.slice(0, 2).toUpperCase();
              const logoUrl = resolveTogoOperatorLogoUrl(
                operator.name,
                operator.logoUrl,
              );
              return (
                <button
                  className={`tg-phone-step__operator${selected ? " is-selected" : ""}`}
                  key={operator.id}
                  type="button"
                  onClick={() => onOperatorSelect(operator.id)}
                  aria-pressed={selected}
                  disabled={disabled || loading}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="" />
                  ) : (
                    <span className="tg-phone-step__operator-fallback" aria-hidden="true">
                      {fallbackName}
                    </span>
                  )}
                  <span>{operator.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div className="tg-phone-step__notice tg-phone-step__notice--error" role="alert">
            <InfoIcon />
            <span>{error}</span>
          </div>
        )}

        <button
          className="tg-phone-step__next"
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
          aria-busy={loading}
        >
          {loading ? copy.loading : copy.next}
        </button>

        <div className="tg-phone-step__secure">
          <ShieldIcon />
          <strong>{copy.secure}</strong>
        </div>
      </section>
    </main>
  );
}

export default TogoPhoneStep;
