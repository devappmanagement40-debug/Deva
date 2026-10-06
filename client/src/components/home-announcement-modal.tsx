import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, ShieldCheck, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getContent } from "@/lib/content";

const DEFAULT_LINES = [
  "🚀 DIAMANT RDC: official launch!",
  "📅 DIAMANT officially launches on 03/09/2026!",
  "✅ Minimum deposit: 18 XOF",
  "✅ Minimum withdrawal: 1 XOF via USDT BEP20, with no fee",
  "👥 Invite your friends and earn commissions",
  "🕘 Withdrawals and support: 09:00–17:00",
  "🔥 Product earnings are credited automatically to the earnings balance at the end of the cycle 📈",
  "📖 Please review the DIAMANT rules before operating.",
];

export default function HomeAnnouncementModal() {
  const [open, setOpen] = useState(true);
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const lines = Array.from({ length: 8 }, (_, index) => getContent(
    settings,
    `content_home_popupLine${index + 1}`,
    settings[`popupLine${index + 1}`] || DEFAULT_LINES[index],
  )).filter(Boolean);
  const popupTitle = getContent(settings, "content_home_popupTitle", settings.popupTitle || "DIAMANT Announcement");
  // The homepage announcement must point to the configured official channel,
  // not to the customer-support link.
  const telegramUrl = settings.channelEnabled === "false"
    ? ""
    : (settings.channelLink || "").trim();
  const telegramLabel = settings.channelLabel || settings.popupTelegramLabel || "Chaîne officielle DIAMANT";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex max-h-[calc(100dvh-32px)] w-[calc(100%-24px)] max-w-[430px] flex-col gap-0 overflow-hidden rounded-[22px] border border-[#d9def8] bg-[#f7f8ff] p-0 text-[#1b2450] shadow-[0_26px_90px_rgba(20,21,80,0.38)] [&>button]:hidden"
      >
        <header className="relative shrink-0 bg-gradient-to-br from-[#0f1a4b] via-[#37398f] to-[#3965d2] px-5 pb-5 pt-6 sm:px-6">
          <div className="absolute right-3 top-3">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#37398f]"
                aria-label="Annuler et fermer l’annonce"
                data-testid="button-announcement-close"
              >
                <span>Annuler</span>
                <X size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </DialogClose>
          </div>
          <DialogTitle className="pr-24 pt-10 font-['Roboto'] text-[23px] font-bold leading-tight tracking-normal text-white sm:text-[26px]">
            {popupTitle}
          </DialogTitle>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6">
          <div className="divide-y divide-[#e0e4f7]">
            {lines.map((line, index) => (
              <div className="flex gap-3 py-3.5" key={`${line}-${index}`}>
                <span
                  className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#5a51dd] ring-4 ring-[#eeedff]"
                  aria-hidden="true"
                />
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-[14px] leading-[1.55] text-[#25315c] sm:text-[15px]">
                  {line}
                </p>
              </div>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-[#dce2f8] bg-[#f7f8ff] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => telegramUrl && window.open(telegramUrl, "_blank", "noopener,noreferrer")}
            disabled={!telegramUrl}
            className="flex min-h-[62px] w-full items-center justify-center gap-3 rounded-[15px] bg-gradient-to-r from-[#2f62da] via-[#5746d5] to-[#713fc8] px-4 py-3 text-center text-[15px] font-bold leading-5 text-white shadow-[0_5px_0_#352c9a] transition-[transform,filter,box-shadow] hover:brightness-105 active:translate-y-[2px] active:shadow-[0_3px_0_#352c9a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8ff] sm:text-[16px]"
            data-testid="button-popup-telegram"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Send size={18} fill="currentColor" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col items-start">
              <span>{telegramUrl ? "Rejoindre la chaîne Telegram" : "Canal officiel non configuré"}</span>
              {telegramUrl && <span className="text-[11px] font-medium leading-4 text-white/75">{telegramLabel}</span>}
            </span>
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] leading-4 text-[#6871a6]">
            <ShieldCheck size={13} strokeWidth={1.8} aria-hidden="true" />
            <span>Accès à la chaîne officielle DIAMANT</span>
          </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}