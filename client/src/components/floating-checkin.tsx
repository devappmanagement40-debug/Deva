import { useLocation } from "wouter";

interface FloatingCheckinProps {
  label: string;
  bottomOffset?: number;
}

function ColorfulCheckinIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="checkin-wheel-spectrum" x1="9" y1="13" x2="43" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ef3b2d" />
          <stop offset=".2" stopColor="#ff9d1e" />
          <stop offset=".4" stopColor="#ffe34d" />
          <stop offset=".6" stopColor="#43c84b" />
          <stop offset=".8" stopColor="#258ce8" />
          <stop offset="1" stopColor="#b83dcc" />
        </linearGradient>
        <linearGradient id="checkin-wheel-hub" x1="31" y1="30" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff8650" />
          <stop offset="1" stopColor="#e83a2b" />
        </linearGradient>
      </defs>
      <rect x="5.5" y="7" width="41" height="40" rx="9" fill="#333" stroke="#191919" strokeWidth="1.5" />
      <rect x="9" y="10.5" width="34" height="32.5" rx="5.5" fill="#fff7c6" />
      <path d="M14.5 10.5h23A5.5 5.5 0 0 1 43 16v4H9v-4a5.5 5.5 0 0 1 5.5-5.5Z" fill="url(#checkin-wheel-spectrum)" />
      <path d="M9 20h34" stroke="#333" strokeWidth="1.3" />
      <path d="M16 7.5v9M36 7.5v9" stroke="#292929" strokeWidth="4" strokeLinecap="round" />
      <circle cx="16" cy="26" r="2.6" fill="#ef3b2d" />
      <circle cx="25" cy="26" r="2.6" fill="#f5ca35" />
      <circle cx="34" cy="26" r="2.6" fill="#43bb49" />
      <circle cx="16" cy="34" r="2.6" fill="#278fe8" />
      <circle cx="25" cy="34" r="2.6" fill="#b83dcc" />
      <circle cx="37.5" cy="36.5" r="8.5" fill="url(#checkin-wheel-hub)" stroke="#333" strokeWidth="1.5" />
      <path d="m33.8 36.5 2.4 2.4 4.8-5.1" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
      <ColorfulCheckinIcon />
    </button>
  );
}