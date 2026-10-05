import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const buttonSize = 52;
  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);

  useEffect(() => {
    const resetPosition = () => setPos({
      right: appearance === "wheel"
        ? Math.max(24, (window.innerWidth - 420) / 2)
        : Math.max(10, (window.innerWidth - 480) / 2 + 10),
      bottom: bottomOffset + 120,
    });

    resetPosition();
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, [appearance, bottomOffset]);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!btnRef.current || pos === null) return;
    dragging.current = true;
    didDrag.current = false;
    btnRef.current.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    const rect = btnRef.current.getBoundingClientRect();
    startOffset.current = { x: rect.left, y: rect.top };
    e.preventDefault();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
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
    if (!didDrag.current) navigate("/checkin");
  };

  const onPointerCancel = () => {
    dragging.current = false;
  };

  if (pos === null) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={label}
      title={label}
      data-testid="floating-checkin"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={(e) => {
        if (e.detail === 0) navigate("/checkin");
      }}
      style={{
        position: "fixed",
        right: pos.right,
        bottom: `calc(${pos.bottom}px + env(safe-area-inset-bottom))`,
        zIndex,
        display: "flex",
        width: buttonSize,
        height: buttonSize,
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
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
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