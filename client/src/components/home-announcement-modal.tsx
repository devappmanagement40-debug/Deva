import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getContent } from "@/lib/content";

export default function HomeAnnouncementModal() {
  const [open, setOpen] = useState(true);
  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  const popupTitle = getContent(settings, "content_home_popupTitle", settings.popupTitle || "Annonce DIAMANT");
  // The homepage announcement must point to the configured official channel,
  // not to the customer-support link.
  const telegramUrl = settings.channelEnabled === "false"
    ? ""
    : (settings.channelLink || "").trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex max-h-[calc(100dvh-32px)] w-[calc(100%-24px)] max-w-[360px] flex-col gap-0 overflow-hidden rounded-[20px] border border-[#d9def8] bg-[#f7f8ff] p-0 text-[#1b2450] shadow-[0_26px_90px_rgba(20,21,80,0.38)] [&>button]:hidden"
      >
        <header className="relative shrink-0 bg-gradient-to-br from-[#0f1a4b] via-[#37398f] to-[#3965d2] px-4 pb-4 pt-4">
          <div className="absolute right-3 top-3">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#37398f]"
                aria-label="Annuler et fermer l’annonce"
                data-testid="button-announcement-close"
              >
                <span>Annuler</span>
                <X size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </DialogClose>
          </div>
          <DialogTitle className="line-clamp-2 max-w-full pr-20 pt-8 font-['Roboto'] text-[20px] font-bold leading-tight tracking-normal text-white">
            {popupTitle}
          </DialogTitle>
        </header>

        <footer className="shrink-0 border-t border-[#dce2f8] bg-[#f7f8ff] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={() => telegramUrl && window.open(telegramUrl, "_blank", "noopener,noreferrer")}
            disabled={!telegramUrl}
            className="flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-gradient-to-r from-[#2f62da] via-[#5746d5] to-[#713fc8] px-3 py-2.5 text-center text-[14px] font-bold leading-5 text-white shadow-[0_4px_0_#352c9a] transition-[transform,filter,box-shadow] hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_#352c9a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f8ff]"
            data-testid="button-popup-telegram"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Send size={16} fill="currentColor" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span>{telegramUrl ? "Rejoindre la chaîne Telegram" : "Canal Telegram non configuré"}</span>
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}