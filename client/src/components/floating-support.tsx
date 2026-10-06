import { useRef, useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import customerServiceIcon from "@assets/customer-service-icon-512.png";
import supportAvatar from "@assets/generated_images/diamant-support-avatar-3d.png";
import telegramIcon from "@/assets/images/telegram-icon.png";

interface FloatingSupportProps {
  bottomOffset?: number;
  appearance?: "default" | "wheel";
  placement?: "bottom" | "auth" | "home";
  rightOffset?: number;
  zIndex?: number;
}

export function FloatingSupport({
  bottomOffset = 24,
  appearance = "default",
  placement = "bottom",
  rightOffset = 18,
  zIndex = 200,
}: FloatingSupportProps) {
  const { t } = useI18n();
  const [, navigate] = useLocation();

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
        right: placement === "auth" ? 10 : rightOffset,
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
  }, [bottomOffset, buttonSize, placement, rightOffset]);

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
    const dragThreshold = e.pointerType === "touch" ? 10 : 4;
    if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) didDrag.current = true;

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
  };

  const onPointerCancel = () => {
    dragging.current = false;
    didDrag.current = false;
  };

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const wasDragged = didDrag.current;
    didDrag.current = false;
    if (!wasDragged) {
      // Finish the tap on this button before changing routes. Navigating from
      // pointerup can let mobile's synthesized click activate the new page's
      // card underneath the floating button.
      navigate("/service");
    }
  };

  if (pos === null) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={t.customerService}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      data-testid="floating-support-launcher"
      style={{
        position: "fixed",
        right: pos.right,
        bottom: pos.bottom,
        zIndex,
        width: buttonSize,
        height: buttonSize,
        borderRadius: "50%",
        border: appearance === "wheel" || placement === "auth" || placement === "home"
          ? "2px solid rgba(255,255,255,.95)"
          : "none",
        padding: 0,
        cursor: "grab",
        background: appearance === "wheel" ? "#10182b" : "#fff",
        boxShadow: appearance === "wheel"
          ? "0 4px 12px rgba(49,30,31,.35)"
          : "0 4px 16px rgba(0,0,0,0.25), 0 0 10px rgba(0,0,0,0.25)",
        overflow: appearance === "wheel" ? "visible" : "hidden",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {appearance === "wheel" ? (
        <>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              border: "2px solid #fff",
              borderRadius: "50%",
              background: "radial-gradient(circle at 50% 38%, #33344c, #080c19 76%)",
            }}
          >
            <img
              src={supportAvatar}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 28%",
                display: "block",
                pointerEvents: "none",
              }}
            />
          </span>
          <img
            src={telegramIcon}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              left: -5,
              bottom: -3,
              width: 26,
              height: 26,
              border: "2px solid #fff",
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 2px 5px rgba(7,15,39,.3)",
              pointerEvents: "none",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 2,
              top: 2,
              width: 13,
              height: 13,
              border: "2px solid #fff",
              borderRadius: "50%",
              background: "#45b8ff",
            }}
          />
        </>
      ) : (
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
      )}
    </button>
  );
}
