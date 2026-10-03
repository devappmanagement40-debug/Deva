import { useLocation } from "wouter";
import checkinIcon from "@assets/generated_images/checkin-wheel-style-icon-256.png";

interface FloatingCheckinProps {
  label: string;
  bottomOffset?: number;
  appearance?: "default" | "wheel";
  zIndex?: number;
}

export function FloatingCheckin({
  label,
  bottomOffset = 24,
  appearance = "default",
  zIndex = 200,
}: FloatingCheckinProps) {
  const [, navigate] = useLocation();

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid="floating-checkin"
      onClick={() => navigate("/checkin")}
      style={{
        position: "fixed",
        right: appearance === "wheel"
          ? "max(24px, calc((100vw - 420px) / 2))"
          : "max(10px, calc((100vw - 480px) / 2 + 10px))",
        bottom: `calc(${bottomOffset + 120}px + env(safe-area-inset-bottom))`,
        zIndex,
        display: "flex",
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        border: appearance === "wheel"
          ? "2px solid rgba(255,248,220,.96)"
          : "1px solid rgba(166,147,255,.82)",
        borderRadius: "50%",
        color: "#fff",
        background: appearance === "wheel"
          ? "linear-gradient(145deg, #8fe96f, #19b969 58%, #07885e)"
          : "linear-gradient(145deg, #020b2e, #653de9)",
        boxShadow: appearance === "wheel"
          ? "0 4px 14px rgba(80,48,22,.32), inset 0 1px 2px rgba(255,255,255,.65)"
          : "0 4px 20px rgba(1,7,29,.42), 0 0 0 1px rgba(166,147,255,.28)",
        cursor: "pointer",
      }}
    >
      <img
        src={checkinIcon}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ display: "block", width: 40, height: 40, objectFit: "contain", pointerEvents: "none" }}
      />
    </button>
  );
}