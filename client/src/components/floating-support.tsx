import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import customerServiceIcon from "@assets/customer-service-icon-512.png";

interface SettingsLinks {
  supportLink: string;
  supportType: string;
  supportLabel: string;
  support2Link: string;
  support2Type: string;
  support2Label: string;
  floatingSupportTarget?: string;
}

interface FloatingSupportProps {
  bottomOffset?: number;
  placement?: "bottom" | "auth" | "home";
}

export function FloatingSupport({ bottomOffset = 24, placement = "bottom" }: FloatingSupportProps) {
  const { t } = useI18n();
  const { data } = useQuery<SettingsLinks>({
    queryKey: ["/api/settings/links"],
    staleTime: 5 * 60 * 1000,
  });

  // Choisit le lien selon le paramètre admin (support1 par défaut)
  const target = data?.floatingSupportTarget || "support1";
  const link = target === "support2"
    ? (data?.support2Link || "#")
    : (data?.supportLink || "#");

  // Drag state
  const btnRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });

  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);

  const buttonSize = placement === "auth" ? 56 : placement === "home" ? 52 : 64;

  useEffect(() => {
    if (placement !== "home") {
      setPos({
        right: placement === "auth" ? 10 : 18,
        bottom: placement === "auth"
          ? Math.max(0, window.innerHeight / 2 - buttonSize)
          : bottomOffset + 40,
      });
      return;
    }
    const resetPosition = () => {
      setPos({
        right: Math.max(10, (window.innerWidth - 480) / 2 + 10),
        bottom: Math.max(0, window.innerHeight / 2 - buttonSize),
      });
    };
    resetPosition();
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, [bottomOffset, buttonSize, placement]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!btnRef.current || pos === null) return;
    dragging.current = true;
    didDrag.current = false;
    btnRef.current.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    const rect = btnRef.current.getBoundingClientRect();
    startOffset.current = { x: rect.left, y: rect.top };
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || pos === null) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;

    const newLeft = startOffset.current.x + dx;
    const newTop = startOffset.current.y + dy;
    const clampedLeft = Math.max(0, Math.min(window.innerWidth - buttonSize, newLeft));
    const clampedTop = Math.max(0, Math.min(window.innerHeight - buttonSize, newTop));

    setPos({
      right: window.innerWidth - clampedLeft - buttonSize,
      bottom: window.innerHeight - clampedTop - buttonSize,
    });
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!didDrag.current && link && link !== "#") {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  if (pos === null) return null;

  return (
    <button
      ref={btnRef}
      aria-label={t.customerService}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "fixed",
        right: pos.right,
        bottom: pos.bottom,
        zIndex: 200,
      width: buttonSize,
      height: buttonSize,
        borderRadius: "50%",
      border: placement === "auth" || placement === "home" ? "2px solid rgba(255,255,255,.95)" : "none",
      padding: 0,
        cursor: "grab",
      background: "#fff",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25), 0 0 10px rgba(0,0,0,0.25)",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <img
        src={customerServiceIcon}
        alt={t.customerService}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 42%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
