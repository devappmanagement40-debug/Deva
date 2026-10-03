import WheelBoardModal from "./wheel-board-modal";

/**
 * Popup carte blanche — s'affiche quand on clique sur "+"
 * Texte configurable depuis le panel admin (spinWheelInviteText)
 */
interface WheelInviteModalProps {
  open: boolean;
  onClose: () => void;
  text: string;
  highlight?: string; // highlighted portion (bold red)
}

export default function WheelInviteModal({
  open,
  onClose,
  text,
  highlight,
}: WheelInviteModalProps) {
  if (!open) return null;

  // Split text around the highlight so we can style it
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
      ariaLabel="Invitez vos amis"
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
