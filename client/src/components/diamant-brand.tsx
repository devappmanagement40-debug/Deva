interface DiamantBrandProps {
  variant?: "on-dark" | "on-light";
  markSize?: number;
  className?: string;
  showWordmark?: boolean;
}

export function DiamantBrand({
  variant = "on-dark",
  markSize = 24,
  className = "",
  showWordmark = true,
}: DiamantBrandProps) {
  const wordmarkColor = variant === "on-dark" ? "#f4f2ff" : "#08285f";

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 ${className}`.trim()}
      role="img"
      aria-label="DIAMANT"
    >
      <img
        src="/diamant-mark.svg"
        alt=""
        aria-hidden="true"
        width={markSize}
        height={markSize}
        className="shrink-0 object-contain"
      />
      {showWordmark && (
        <span
          className="font-bold uppercase tracking-[0.16em]"
          style={{ color: wordmarkColor }}
        >
          DIAMANT
        </span>
      )}
    </span>
  );
}