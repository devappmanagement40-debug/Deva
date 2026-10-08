import { useEffect, useRef, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";

const SHOW_DELAY_MS = 90;
const MIN_VISIBLE_MS = 180;
const MAX_VISIBLE_MS = 1_400;

export default function NavigationLoader() {
  const hasUncachedRequest =
    useIsFetching({
      predicate: (query) =>
        query.state.data === undefined && query.state.fetchStatus === "fetching",
    }) > 0;
  const [visible, setVisible] = useState(false);
  const visibleSince = useRef<number | null>(null);

  useEffect(() => {
    let showTimer: number | undefined;
    let hideTimer: number | undefined;

    if (hasUncachedRequest) {
      showTimer = window.setTimeout(() => {
        visibleSince.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);

      // A slow or stalled request must not leave the global indicator on screen.
      hideTimer = window.setTimeout(() => {
        visibleSince.current = null;
        setVisible(false);
      }, MAX_VISIBLE_MS);
    } else {
      const elapsed = visibleSince.current === null
        ? MIN_VISIBLE_MS
        : Date.now() - visibleSince.current;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      hideTimer = window.setTimeout(() => {
        visibleSince.current = null;
        setVisible(false);
      }, remaining);
    }

    return () => {
      if (showTimer !== undefined) window.clearTimeout(showTimer);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, [hasUncachedRequest]);

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.12s ease",
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <div
        className="flex items-center justify-center rounded-[9px]"
        style={{
          width: 136,
          height: 136,
          background: "#000000",
          boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
        }}
      >
        <svg
          className="navigation-loader-spinner"
          width="38"
          height="38"
          viewBox="0 0 38 38"
          fill="none"
          aria-label="Chargement"
          style={{ animation: "nav-spin 0.7s linear infinite" }}
        >
          <circle cx="19" cy="19" r="15" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
          <path
            d="M19 4 A15 15 0 0 1 34 19"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <style>{`
        @keyframes nav-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .navigation-loader-spinner { animation-duration: 1.6s !important; }
        }
      `}</style>
    </div>
  );
}
