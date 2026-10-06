import { useState } from "react";
import {
  BookOpen,
  Check,
  Clock3,
  Info,
  Send,
  ShieldCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import "./_group.css";

const announcementItems = [
  {
    icon: Info,
    text: "Les dépôts sont crédités après confirmation du paiement.",
  },
  {
    icon: WalletCards,
    text: "Dépôt minimum : 18 XOF.",
  },
  {
    icon: WalletCards,
    text: "Retrait minimum : 1 XOF via USDT BEP20, sans frais.",
  },
  {
    icon: Clock3,
    text: "Les retraits et le support sont disponibles de 09:00 à 17:00.",
  },
  {
    icon: Check,
    text: "Les gains des produits sont crédités automatiquement à la fin de leur cycle.",
  },
  {
    icon: UsersRound,
    text: "Invitez vos amis et gagnez des commissions de parrainage.",
  },
  {
    icon: BookOpen,
    text: "Merci de consulter les règles DIAMANT avant toute opération.",
  },
];

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
          className="flex max-h-[calc(100dvh-28px)] w-[calc(100%-24px)] max-w-[430px] flex-col overflow-hidden rounded-[22px] border border-[#d8dcf1] bg-[#f6f7ff] p-0 text-[#202749] shadow-[0_26px_90px_rgba(11,15,48,0.42)] [&>button]:hidden"
        >
          <div className="shrink-0 border-b border-[#dfe2f4] bg-[#eceeff] px-5 pb-5 pt-4 sm:px-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6258d2]" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#606b99]">
                  Message officiel
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-[#626c96] transition-colors hover:bg-[#dfe3ff] hover:text-[#343c87] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#656bd1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eceeff]"
                aria-label="Annuler et fermer l’annonce"
                data-testid="button-announcement-close"
              >
                Annuler
                <X size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>

            <DialogTitle className="font-['Plus_Jakarta_Sans'] text-[25px] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#252d63] sm:text-[29px]">
              Annonce DIAMANT
            </DialogTitle>
            <p className="mt-2 text-[14px] leading-6 text-[#5e688e]">
              Bienvenue sur la plateforme DIAMANT. Voici les informations à connaître.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2 sm:px-6">
            <div className="divide-y divide-[#e1e4f2]">
              {announcementItems.map(({ icon: Icon, text }, index) => (
                <div className="flex gap-3.5 py-3.5" key={text}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#e8eaff] text-[#5865c5]">
                    <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <p className="min-w-0 flex-1 self-center text-[14px] leading-[1.55] text-[#3b456c] sm:text-[15px]">
                    {text}
                  </p>
                  <span className="sr-only">Information {index + 1} sur 7</span>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#dfe2f4] bg-[#f6f7ff] px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-4 sm:px-6">
            <button
              type="button"
              onClick={() => undefined}
              aria-describedby="official-channel-note"
              className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[15px] bg-[#4569d8] px-4 text-center text-[15px] font-bold leading-5 text-white shadow-[0_5px_0_#304ba9] transition-[transform,background-color,box-shadow] hover:bg-[#3b5fc8] active:translate-y-[2px] active:shadow-[0_3px_0_#304ba9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4259ba] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f7ff] sm:text-[16px]"
              data-testid="button-popup-telegram"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Send size={17} fill="currentColor" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>Rejoindre la chaîne Telegram</span>
            </button>
            <p
              id="official-channel-note"
              className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] leading-4 text-[#6a7396]"
            >
              <ShieldCheck size={13} strokeWidth={1.8} aria-hidden="true" />
              <span>Accès à la chaîne officielle DIAMANT</span>
            </p>
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
