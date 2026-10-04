/**
 * Result dialog shown after a wheel spin.
 */
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { displayCurrencyText } from "@/lib/content";
import WheelBoardModal from "./wheel-board-modal";

interface Props {
  open: boolean;
  onClose: () => void;
  kind: "win" | "loss" | "no-spins";
  amount?: number;
  label?: string;
  titleOverride?: string;
  messageOverride?: string;
}

export default function WheelResultModal({
  open,
  onClose,
  kind,
  amount,
  label,
  titleOverride,
  messageOverride,
}: Props) {
  const { t } = useI18n();
  const modalRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const closeButton = modalRef.current?.querySelector("button");
    closeButton?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButton?.focus();
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
  const title = titleOverride ?? (kind === "win"
    ? t.wheelResultWinTitle
    : kind === "loss"
      ? t.wheelResultLossTitle
      : t.wheelResultNoSpinsTitle);
  const message = messageOverride ?? (kind === "win"
    ? t.wheelResultWinMessage.replace("{0}", displayAmount)
    : kind === "loss"
      ? t.wheelResultLossMessage
      : t.wheelResultNoSpinsMessage);

  return (
    <div ref={modalRef}>
      <WheelBoardModal
        open={open}
        onClose={onClose}
        closeLabel={t.wheelResultConfirm}
        ariaLabel={title}
      >
        <div style={{ padding: "8px 5px 12px", textAlign: "center" }}>
          <h2
            id="wheel-result-title"
            style={{
              margin: "0 0 12px",
              color: "#713823",
              fontFamily: "Roboto, Arial, sans-serif",
              fontSize: "clamp(21px, 6vw, 26px)",
              fontWeight: 800,
              lineHeight: 1.25,
            }}
          >
            {title}
          </h2>
          <p
            id="wheel-result-message"
            aria-live="polite"
            style={{
              margin: 0,
              color: "#713823",
              fontFamily: "Roboto, Arial, sans-serif",
              fontSize: 17,
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>
        </div>
      </WheelBoardModal>
    </div>
  );
}
