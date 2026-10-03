import { CalendarDays } from "lucide-react";
import { useLocation } from "wouter";

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
      <CalendarDays size={28} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}