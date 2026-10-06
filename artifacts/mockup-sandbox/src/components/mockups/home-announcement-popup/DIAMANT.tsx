import { useState } from "react";
import { Send, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import "./_group.css";

export function DIAMANT() {
  const [open, setOpen] = useState(true);

  return (
    <main className="home-announcement-preview relative isolate flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0d1634] px-4 py-8 text-[#202749]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_10%,rgba(104,91,213,0.27),transparent_36%),radial-gradient(ellipse_at_90%_88%,rgba(57,112,210,0.22),transparent_38%),linear-gradient(155deg,#101735,#111a38_57%,#1b2347)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-4 top-7 -z-10 mx-auto max-w-md space-y-3 opacity-25" aria-hidden="true">
        <div className="h-12 rounded-2xl border border-white/20 bg-white/10" />
        <div className="h-36 rounded-3xl border border-white/15 bg-white/[0.07]" />
        <div className="h-24 rounded-3xl border border-white/15 bg-white/[0.07]" />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[calc(100dvh-28px)] w-[calc(100%-24px)] max-w-[360px] flex-col gap-0 overflow-hidden rounded-[20px] border border-[#d8dcf1] bg-[#f6f7ff] p-0 text-[#202749] shadow-[0_26px_90px_rgba(11,15,48,0.42)] [&>button]:hidden"
        >
          <div className="relative shrink-0 bg-gradient-to-br from-[#0f1a4b] via-[#37398f] to-[#3965d2] px-4 pb-4 pt-4">
            <div className="absolute right-3 top-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#37398f]"
                aria-label="Annuler et fermer l’annonce"
                data-testid="button-announcement-close"
              >
                Annuler
                <X size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            <DialogTitle className="line-clamp-2 max-w-full pr-20 pt-8 font-['Plus_Jakarta_Sans'] text-[20px] font-bold leading-tight text-white">
              Annonce DIAMANT
            </DialogTitle>
          </div>

          <div className="shrink-0 border-t border-[#dfe2f4] bg-[#f6f7ff] px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-4">
            <button
              type="button"
              onClick={() => undefined}
              className="flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-gradient-to-r from-[#2f62da] via-[#5746d5] to-[#713fc8] px-3 py-2.5 text-center text-[14px] font-bold leading-5 text-white shadow-[0_4px_0_#352c9a] transition-[transform,filter,box-shadow] hover:brightness-105 active:translate-y-[2px] active:shadow-[0_2px_0_#352c9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5145d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f7ff]"
              data-testid="button-popup-telegram"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Send size={16} fill="currentColor" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>Rejoindre la chaîne Telegram</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {!open && (
        <div className="absolute inset-x-5 bottom-7 mx-auto flex max-w-sm items-center justify-between gap-4 rounded-2xl border border-white/15 bg-[#20274b]/95 px-4 py-3 text-white shadow-xl backdrop-blur-sm">
          <p className="text-sm text-white/80">Annonce fermée</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-[#b8c7ff] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8c7ff]"
          >
            Consulter
          </button>
        </div>
      )}
    </main>
  );
}
