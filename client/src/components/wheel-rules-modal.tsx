import WheelBoardModal from "./wheel-board-modal";

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
    after = text.slice(idx + highlight.length);
  }

  return (
    <WheelBoardModal
      open={open}
      onClose={onClose}
      closeLabel="Fermer"
      ariaLabel="Règles du jeu"
    >
      <p
        style={{
          margin: 0,
          color: "#713823",
          fontFamily: "Roboto, Arial, sans-serif",
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.6,
        }}
      >
        {highlight && text.includes(highlight) ? (
          <>
            {before}
            <span style={{ color: "#c76437", fontWeight: 800 }}>{highlight}</span>
            {after}
          </>
        ) : (
          text
        )}
      </p>
    </WheelBoardModal>
  );
}
