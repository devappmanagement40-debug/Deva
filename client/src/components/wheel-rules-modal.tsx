/**
 * Popup carte blanche — règles du jeu
 * Texte configurable depuis le panel admin (spinWheelRulesText)
 */
interface WheelRulesModalProps {
  open: boolean;
  onClose: () => void;
  text: string;
  highlight?: string;
}

export default function WheelRulesModal({
  open,
  onClose,
  text,
  highlight,
}: WheelRulesModalProps) {
  if (!open) return null;

  let before = text;
  let after = "";
  if (highlight && text.includes(highlight)) {
    const idx = text.indexOf(highlight);
    before = text.slice(0, idx);
    after  = text.slice(idx + highlight.length);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{
        background: "rgba(2, 7, 29, .76)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        fontFamily: "Roboto, Arial, sans-serif",
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full overflow-hidden rounded-[22px]"
        style={{
          maxWidth: 380,
          color: "#fff",
          border: "1px solid rgba(255,255,255,.2)",
          backgroundColor: "#02071d",
          backgroundImage:
            "linear-gradient(180deg, rgba(5, 15, 46, .72), rgba(2, 7, 29, .96)), url('/auth-night-sky.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow:
            "0 22px 48px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12)",
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Règles du jeu"
      >
        {/* Body */}
        <div className="px-6 py-7">
          <p style={{ color: "#fff", fontSize: 16, lineHeight: 1.6 }}>
            {highlight ? (
              <>
                {before}
                <span className="font-extrabold" style={{ color: "#c5baff" }}>
                  {highlight}
                </span>
                {after}
              </>
            ) : (
              text
            )}
          </p>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,.16)" }} />

        <button
          type="button"
          onClick={onClose}
          className="auth-submit transition active:translate-y-[3px]"
          style={{ width: "calc(100% - 40px)", margin: "16px 20px 20px" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
