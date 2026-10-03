/**
 * Result dialog shown after a wheel spin.
 */
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { displayCurrencyText } from "@/lib/content";

interface Props {
  open: boolean;
  onClose: () => void;
  won: boolean;
  amount?: number;
  label?: string;
}

export default function WheelResultModal({ open, onClose, won, amount, label }: Props) {
  const { t } = useI18n();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const displayAmount = displayCurrencyText(
    amount && amount > 0
      ? `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} XOF`
      : label ?? "0 XOF",
  );
  const title = won ? t.wheelResultWinTitle : t.wheelResultLossTitle;
  const message = won
    ? t.wheelResultWinMessage.replace("{0}", displayAmount)
    : t.wheelResultLossMessage;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-5 py-6"
      style={{ background: "rgba(5, 8, 29, 0.76)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-result-title"
        aria-describedby="wheel-result-message"
        className="w-full overflow-hidden rounded-[22px] shadow-2xl"
        style={{
          maxWidth: 440,
          background: "#071638",
          border: "1px solid rgba(162, 181, 226, 0.24)",
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.48)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-7 text-left sm:px-7 sm:py-8">
          <h2 id="wheel-result-title" className="text-[17px] font-semibold leading-[1.5] text-slate-50 sm:text-[18px]">
            {title}
          </h2>
          <p
            id="wheel-result-message"
            aria-live="polite"
            className="mt-2 text-[16px] leading-[1.7] text-slate-100 sm:text-[17px]"
          >
            {message}
          </p>
        </div>

        <div
          aria-hidden="true"
          style={{ height: 1, background: "rgba(162, 181, 226, 0.22)" }}
        />

        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="mx-5 my-4 w-[calc(100%-2.5rem)] rounded-[16px] py-[17px] text-center text-[18px] font-bold text-white transition-transform active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 sm:mx-6 sm:my-[18px] sm:w-[calc(100%-3rem)]"
          style={{
            background: "#6840e8",
            border: "1px solid #a18aff",
            boxShadow: "0 5px 0 #4221b5",
          }}
        >
          {t.wheelResultConfirm}
        </button>
      </div>
    </div>
  );
}
