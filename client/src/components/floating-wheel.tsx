import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import wheelIcon from "@assets/stickers-roue-de-la-fortune.jpg_1791017541674.jpg";

interface FloatingWheelProps {
  bottomOffset?: number;
}

export function FloatingWheel({ bottomOffset = 24 }: FloatingWheelProps) {
  const [, navigate] = useLocation();
  const { t }        = useI18n();
  const btnRef       = useRef<HTMLButtonElement>(null);
  const dragging     = useRef(false);
  const didDrag      = useRef(false);
  const startPos     = useRef({ x: 0, y: 0 });
  const startOffset  = useRef({ x: 0, y: 0 });

  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);
  const buttonSize = 52;

  useEffect(() => {
    const resetPosition = () => setPos({
      right: Math.max(10, (window.innerWidth - 480) / 2 + 10),
      bottom: bottomOffset + 120,
    });
    resetPosition();
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, [bottomOffset]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!btnRef.current || pos === null) return;
    dragging.current  = true;
    didDrag.current   = false;
    btnRef.current.setPointerCapture(e.pointerId);
    startPos.current    = { x: e.clientX, y: e.clientY };
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
    const newTop  = startOffset.current.y + dy;
    const btnSize = buttonSize;
    const clampedLeft = Math.max(0, Math.min(window.innerWidth  - btnSize, newLeft));
    const clampedTop  = Math.max(0, Math.min(window.innerHeight - btnSize, newTop));
    setPos({
      right:  window.innerWidth  - clampedLeft - btnSize,
      bottom: window.innerHeight - clampedTop  - btnSize,
    });
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!didDrag.current) navigate("/spin-wheel");
  };

  if (pos === null) return null;

  return (
    <>
      <button
        ref={btnRef}
        aria-label={t.wheelTitle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position:    "fixed",
          right:       pos.right,
          bottom:      `calc(${pos.bottom}px + env(safe-area-inset-bottom))`,
          zIndex:      200,
          width:       buttonSize,
          height:      buttonSize,
          borderRadius:"50%",
          border:      "none",
          padding:     0,
          cursor:      "grab",
          background:  "transparent",
          boxShadow:   "0 4px 20px rgba(1,7,29,0.42), 0 0 0 1px rgba(166,147,255,.42)",
          overflow:    "hidden",
          touchAction: "none",
          userSelect:  "none",
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
        }}
      >
        <img
          src={wheelIcon}
          alt=""
          draggable={false}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      </button>
    </>
  );
}
