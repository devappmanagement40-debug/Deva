import { useEffect, useRef, useState } from "react";
import type { PaymentNumber } from "@shared/schema";
import { renderTogoUssdTemplate } from "@shared/togo-ussd";
import { useToast } from "@/hooks/use-toast";
import {
  TogoPhoneStep,
  type TogoPhoneOperator,
} from "./phone-step-design/TogoPhoneStep";
import {
  TgPaymentInstructions,
  type TgCopyField,
} from "./payment-step-design/TgPaymentInstructions";

const PAYMENT_WINDOW_SECONDS = 30 * 60;

type TogoMobileMoneyCheckoutProps = {
  amountXof: number;
  payerPhone: string;
  operators: PaymentNumber[];
  loadingOperators: boolean;
  operatorsError?: string | null;
  submitting: boolean;
  language: string;
  onPhoneChange(value: string): void;
  onToggleLanguage(): void;
  onClose(): void;
  onSubmit(operator: PaymentNumber, payerPhoneDigits: string): void;
};

function getTogoPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("228")) return digits.slice(3);
  return digits.length === 8 ? digits : "";
}

function copyFallback(value: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export default function TogoMobileMoneyCheckout({
  amountXof,
  payerPhone,
  operators,
  loadingOperators,
  operatorsError,
  submitting,
  language,
  onPhoneChange,
  onToggleLanguage,
  onClose,
  onSubmit,
}: TogoMobileMoneyCheckoutProps) {
  const isEnglish = language.toLowerCase().startsWith("en");
  const uiLanguage = isEnglish ? "en" : "fr";
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "payment">("phone");
  const [selectedOperatorId, setSelectedOperatorId] = useState<number | null>(null);
  const [instructionError, setInstructionError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<TgCopyField | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(PAYMENT_WINDOW_SECONDS);
  const deadlineRef = useRef<number | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  const phoneDigits = getTogoPhoneDigits(payerPhone);
  const selectedOperator = operators.find((operator) => operator.id === selectedOperatorId);
  const ussdCode = selectedOperator
    ? renderTogoUssdTemplate(selectedOperator.ussdTemplate, {
        amount: amountXof,
        number: selectedOperator.phone,
        phone: phoneDigits,
        currency: "XOF",
        operator: selectedOperator.operatorName,
      })
    : null;
  const phoneOperators: TogoPhoneOperator[] = operators.map((operator) => ({
    id: operator.id,
    name: operator.operatorName,
    logoUrl: operator.logoUrl,
  }));
  const operatorError =
    operatorsError ||
    (!loadingOperators && operators.length === 0
      ? isEnglish
        ? "No Togo payment operators are configured yet. Please contact support."
        : "Aucun opérateur de paiement n’est configuré pour le Togo. Veuillez contacter l’assistance."
      : null);

  useEffect(() => {
    if (step !== "payment") return;
    deadlineRef.current ??= Date.now() + PAYMENT_WINDOW_SECONDS * 1000;
    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current! - Date.now()) / 1000),
      );
      setRemainingSeconds(remaining);
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(
    () => () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const handleNext = () => {
    if (!selectedOperator) return;
    if (!ussdCode) {
      setInstructionError(
        isEnglish
          ? "Payment instructions are incomplete. Please contact support."
          : "Les instructions de paiement de cet opérateur ne sont pas configurées. Veuillez contacter l’assistance.",
      );
      return;
    }
    setInstructionError(null);
    setStep("payment");
  };

  const handleCopy = async (value: string, field: TgCopyField) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!copyFallback(value)) {
        throw new Error("Clipboard copy failed");
      }
      setCopiedState(field);
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => setCopiedState(null), 1800);
    } catch {
      toast({
        title: isEnglish ? "Copy failed" : "Copie impossible",
        description: isEnglish
          ? "Select and copy the payment details manually."
          : "Sélectionnez et copiez les informations de paiement manuellement.",
        variant: "destructive",
      });
    }
  };

  if (step === "payment" && selectedOperator && ussdCode) {
    return (
      <TgPaymentInstructions
        amount={amountXof}
        countdown={remainingSeconds}
        operatorName={selectedOperator.operatorName}
        operatorLogoUrl={selectedOperator.logoUrl}
        recipientLabel={
          selectedOperator.paymentRecipientLabel?.trim() ||
          selectedOperator.operatorName
        }
        badge={selectedOperator.paymentBadgeLabel?.trim() || "CARTE MARCHAND"}
        accountNumber={selectedOperator.phone}
        ussdCode={ussdCode}
        ownerName={selectedOperator.ownerName}
        payerPhone={phoneDigits}
        copiedState={copiedState}
        submitting={submitting}
        language={uiLanguage}
        onClose={onClose}
        onToggleLanguage={onToggleLanguage}
        onCopy={handleCopy}
        onEditPhone={() => setStep("phone")}
        onComplete={() => onSubmit(selectedOperator, phoneDigits)}
      />
    );
  }

  return (
    <TogoPhoneStep
      amount={amountXof}
      phoneDigits={phoneDigits}
      operators={phoneOperators}
      selectedOperatorId={selectedOperatorId}
      loading={loadingOperators}
      error={instructionError || operatorError}
      disabled={submitting}
      onPhoneChange={onPhoneChange}
      onOperatorSelect={(id) => {
        setSelectedOperatorId(Number(id));
        setInstructionError(null);
      }}
      onNext={handleNext}
      onClose={onClose}
      onLanguage={onToggleLanguage}
      language={uiLanguage}
    />
  );
}
