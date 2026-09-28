import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_SPIN_WHEEL_SEGMENTS, type SpinWheelSegment } from "@shared/spin-wheel";

interface FloatingWheelProps {
  bottomOffset?: number;
}

function MiniWheel({ size = 64, segments }: { size?: number; segments: SpinWheelSegment[] }) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 1;
  const inner = outer - 2;
  const hub = size / 7;
  const n = segments.length;
  const arc = (2 * Math.PI) / n;
  const fills = ["#f7c5df", "#ffffff", "#efa2cb", "#ffd9eb"];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="miniWheelRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff0f8" />
          <stop offset="35%" stopColor="#f4b4d3" />
          <stop offset="70%" stopColor="#e987bb" />
          <stop offset="100%" stopColor="#fff2f9" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={outer} fill="url(#miniWheelRim)" stroke="#fff" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={outer - 1.5} fill="none" stroke="#e98abd" strokeWidth="0.8" opacity="0.8" />

      {segments.map((segment, i) => {
        const start = i * arc - Math.PI / 2;
        const end = start + arc;
        const x1 = cx + Math.cos(start) * inner;
        const y1 = cy + Math.sin(start) * inner;
        const x2 = cx + Math.cos(end) * inner;
        const y2 = cy + Math.sin(end) * inner;
        return (
          <g key={segment.id}>
            <path
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${inner} ${inner} 0 0 1 ${x2} ${y2} Z`}
              fill={fills[i % fills.length]}
              stroke="#fff7fb"
              strokeWidth="1.3"
            />
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={hub + 2} fill="#fff" stroke="#ec8fbd" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={hub} fill="#ffe9f4" stroke="#fff" strokeWidth="0.7" />
      <circle cx={cx} cy={cy} r={hub / 2} fill="#ed8abb" />
      <path d={`M ${cx} 1 L ${cx - 3} 7 L ${cx + 3} 7 Z`} fill="#fff" stroke="#ed8abb" strokeWidth="0.8" />
    </svg>
  );
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
  const buttonSize = 44;

  const { data: configuredSegments } = useQuery<SpinWheelSegment[]>({
    queryKey: ["/api/spin-wheel/config"],
  });
  const segments = configuredSegments?.length ? configuredSegments : DEFAULT_SPIN_WHEEL_SEGMENTS;

  useEffect(() => {
    const resetPosition = () => setPos({
      right: Math.max(2, (window.innerWidth - 480) / 2 + 2),
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
          bottom:      pos.bottom,
          zIndex:      200,
          width:       buttonSize,
          height:      buttonSize,
          borderRadius:"50%",
          border:      "none",
          padding:     0,
          cursor:      "grab",
          background:  "transparent",
          boxShadow:   "0 4px 20px rgba(0,0,0,0.30)",
          overflow:    "hidden",
          touchAction: "none",
          userSelect:  "none",
          display:     "flex",
          alignItems:  "center",
          justifyContent: "center",
        }}
      >
        <div style={{
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          width:           "100%",
          height:          "100%",
        }}>
          <MiniWheel size={buttonSize} segments={segments} />
        </div>
      </button>
    </>
  );
}
