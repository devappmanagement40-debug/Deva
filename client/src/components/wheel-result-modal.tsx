/**
 * White result card shown after a wheel spin.
 */
import { displayCurrencyText } from "@/lib/content";

interface Props {
  open: boolean;
  onClose: () => void;
  won: boolean;
  amount?: number;
  label?: string;
}

export default function WheelResultModal({ open, onClose, won, amount, label }: Props) {
  if (!open) return null;

  const displayAmount = displayCurrencyText(
    amount && amount > 0
      ? amount >= 1000
        ? `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)} 000 XOF`
        : `${amount} XOF`
      : label ?? "0 XOF",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.40)" }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: 380, background: "#fff" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Body */}
        <div className="px-6 py-8 space-y-3 text-center">
          {won ? (
            <>
              <div className="text-5xl mb-1">🎉</div>
              <p className="text-lg font-bold text-gray-900">
                Congratulations!
              </p>
              <p className="text-[15px] leading-relaxed text-gray-700">
                You won{" "}
                <span className="font-extrabold" style={{ color: "#E63946" }}>
                  {displayAmount}
                </span>
                {" "}credited directly to your balance.
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-1">😔</div>
              <p className="text-lg font-bold text-gray-900">
                Better luck next time!
              </p>
              <p className="text-[14px] leading-relaxed text-gray-500">
                Try again on your next spin.
              </p>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#e5e7eb" }} />

        {/* OK */}
        <button
          onClick={onClose}
          className="w-full py-4 text-center text-base font-semibold transition active:opacity-70"
          style={{ color: "#3B82F6" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
