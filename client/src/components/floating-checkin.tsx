import { useLocation } from "wouter";
import checkinIcon from "@assets/generated_images/checkin-wheel-style-icon-256.png";

interface FloatingCheckinProps {
  label: string;
  bottomOffset?: number;
}

export function FloatingCheckin({ label, bottomOffset = 24 }: FloatingCheckinProps) {
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
        right: "max(10px, calc((100vw - 480px) / 2 + 10px))",
        bottom: `calc(${bottomOffset + 120}px + env(safe-area-inset-bottom))`,
        zIndex: 200,
        display: "flex",
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        border: "1px solid rgba(166,147,255,.82)",
        borderRadius: "50%",
        color: "#fff",
        background: "linear-gradient(145deg, #020b2e, #653de9)",
        boxShadow: "0 4px 20px rgba(1,7,29,.42), 0 0 0 1px rgba(166,147,255,.28)",
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