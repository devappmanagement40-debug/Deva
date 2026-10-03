import type { ReactNode } from "react";
import trophyImage from "@assets/generated_images/spin-wheel-ranking-trophy-300.png";

interface WheelBoardModalProps {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  ariaLabel: string;
  children: ReactNode;
  showTrophy?: boolean;
}

export default function WheelBoardModal({
  open,
  onClose,
  closeLabel,
  ariaLabel,
  children,
  showTrophy = false,
}: WheelBoardModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center px-3"
      style={{
        background: "rgba(40, 24, 13, .60)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        fontFamily: "Roboto, Arial, sans-serif",
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full"
        style={{ maxWidth: 460 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className="relative flex flex-col overflow-visible"
          style={{
            height: "min(52dvh, 500px)",
            minHeight: 330,
            padding: "0 8px 8px",
            border: "1px solid rgba(255,255,255,.95)",
            borderRadius: "22px 22px 44px 44px",
            background: "linear-gradient(180deg, #fffdf8 0%, #fff 70%, #fff9f2 100%)",
            boxShadow: "0 15px 38px rgba(66, 29, 17, .40), 0 3px 0 rgba(139, 66, 36, .5)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              zIndex: 4,
              top: 4,
              left: 4,
              right: 4,
              height: 56,
              borderRadius: "18px 18px 48% 48% / 18px 18px 30px 30px",
              border: "5px solid #ffd2a5",
              borderBottom: "6px solid #ffe3c8",
              background: "linear-gradient(180deg, #ff533d 0%, #f33328 78%, #ed271f 100%)",
              boxShadow: "0 4px 8px rgba(164, 61, 33, .22)",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "12%",
                right: "12%",
                bottom: -1,
                height: 17,
                borderBottom: "5px solid #ffe9d7",
                borderRadius: "0 0 50% 50%",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: -18,
                top: 2,
                width: 50,
                height: 34,
                borderRadius: 20,
                background: "linear-gradient(90deg, #ed3023, #ffa653 50%, #fff0cb)",
                border: "3px solid #ffd19a",
              }}
            />
          </div>

          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              zIndex: 5,
              left: 2,
              top: 43,
              bottom: 58,
              width: 8,
              borderRadius: 8,
              background: "repeating-linear-gradient(135deg, #f6b47a 0 4px, #fff5e7 4px 8px, #e96d3c 8px 12px)",
              boxShadow: "1px 1px 2px rgba(103,39,18,.25)",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              zIndex: 5,
              right: 2,
              top: 43,
              bottom: 58,
              width: 8,
              borderRadius: 8,
              background: "repeating-linear-gradient(135deg, #f6b47a 0 4px, #fff5e7 4px 8px, #e96d3c 8px 12px)",
              boxShadow: "-1px 1px 2px rgba(103,39,18,.25)",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              zIndex: 5,
              left: -2,
              bottom: 54,
              width: 12,
              height: 42,
              borderRadius: "3px 3px 9px 9px",
              background: "linear-gradient(90deg, #dc6332, #ffb75c 55%, #e66a32)",
              clipPath: "polygon(15% 0, 85% 0, 100% 74%, 50% 100%, 0 74%)",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              zIndex: 5,
              right: -2,
              bottom: 54,
              width: 12,
              height: 42,
              borderRadius: "3px 3px 9px 9px",
              background: "linear-gradient(90deg, #dc6332, #ffb75c 55%, #e66a32)",
              clipPath: "polygon(15% 0, 85% 0, 100% 74%, 50% 100%, 0 74%)",
            }}
          />

          {showTrophy && (
            <img
              src={trophyImage}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                position: "absolute",
                zIndex: 8,
                top: -11,
                left: -18,
                width: "clamp(82px, 23vw, 112px)",
                height: "clamp(82px, 23vw, 112px)",
                objectFit: "contain",
                transform: "rotate(-8deg)",
                filter: "drop-shadow(0 4px 3px rgba(117, 59, 19, .34))",
                pointerEvents: "none",
              }}
            />
          )}

          <div
            className="relative z-[2] flex-1 overflow-hidden"
            style={{
              marginTop: 47,
              borderRadius: "0 0 35px 35px",
              background: "#fff0f2",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.9)",
            }}
          >
            <div
              className="h-full overflow-y-auto"
              style={{
                padding: "38px 13px 18px",
                scrollbarWidth: "thin",
                scrollbarColor: "#f5b6a8 transparent",
              }}
            >
              {children}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mx-auto mt-4 flex items-center justify-center active:scale-[.98] transition-transform"
          style={{
            width: "min(242px, 72vw)",
            height: 76,
            borderRadius: 999,
            border: "7px solid #ff8e85",
            background: "linear-gradient(180deg, #fff9df 0%, #ffe0a0 100%)",
            boxShadow: "0 4px 10px rgba(112, 41, 26, .22), inset 0 2px 0 rgba(255,255,255,.95)",
            color: "#512218",
            fontSize: 21,
            fontWeight: 700,
          }}
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}