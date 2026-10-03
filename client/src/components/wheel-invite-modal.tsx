import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
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
  referralCode?: string;
}

export default function WheelInviteModal({
  open,
  onClose,
  text,
  highlight,
  referralCode,
}: WheelInviteModalProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const referralLink = referralCode
    ? `${window.location.origin}/#/register?invite_code=${encodeURIComponent(referralCode)}`
    : "";

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: t.wheelLinkCopied });
    } catch {
      toast({ title: t.wheelLinkCopyError, variant: "destructive" });
    }
  };

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
      <button
        type="button"
        onClick={copyReferralLink}
        disabled={!referralLink}
        aria-label={t.wheelCopyMyLink}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 px-4 py-3 shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderColor: "#ed9c68",
          color: "#713823",
          background: "linear-gradient(180deg, #fff7dc 0%, #ffe0a0 100%)",
          fontFamily: "Roboto, Arial, sans-serif",
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        <Copy aria-hidden="true" className="h-4 w-4" />
        {t.wheelCopyMyLink}
      </button>
    </WheelBoardModal>
  );
}
