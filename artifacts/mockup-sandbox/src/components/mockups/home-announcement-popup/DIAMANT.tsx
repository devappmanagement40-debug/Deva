import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import "./_group.css";

const popupLines = [
  "Dépôts disponibles par Mobile Money et USDT BEP20, crédités après confirmation.",
  "Dépôt minimum : 2 500 XOF.",
  "Retrait minimum : 1 000 XOF par Mobile Money ou USDT BEP20, selon les options disponibles.",
  "Les retraits et le support sont disponibles de 09:00 à 17:00.",
  "Les gains des produits sont crédités automatiquement à la fin de leur cycle.",
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
          className="grid aspect-[3/4] max-h-[calc(100dvh-20px)] w-[calc(100%-20px)] max-w-[700px] grid-rows-[26%_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[12px] border border-[#f2e6b8] bg-white p-0 text-[#292929] shadow-[0_22px_72px_rgba(0,0,0,0.42)] [&>button]:hidden"
        >
          <header className="relative min-h-0 overflow-hidden bg-[#fddc5a]">
            <DialogTitle className="absolute left-[11%] top-1/2 z-10 max-w-[61%] -translate-y-1/2 font-['Arial'] text-[clamp(18px,4.5vw,36px)] font-bold leading-[1.08] tracking-[-0.025em] text-[#302f35]">
              Bienvenue sur DIAMANT
            </DialogTitle>
            <img
              src="/__mockup/images/diamant-welcome-astronaut.png"
              alt=""
              aria-hidden="true"
              className="absolute right-[3%] top-0 h-full w-[40%] object-cover object-center"
            />
            <svg
              className="absolute inset-x-0 bottom-[-1px] h-[19%] w-full"
              viewBox="0 0 700 62"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0 40c17-3 18-18 38-16 10-16 34-15 43 0 18-14 43-6 48 9 17-9 39-9 52 3 14-17 40-21 55-4 17-23 51-18 61 2 14-16 41-15 52 2 13-18 44-15 51 3 15-8 37-6 47 5 19-22 51-18 61-1 20-10 39-5 49 8 17-16 42-14 55 1 18-11 41-5 48 7v23H0z"
                fill="#fff"
              />
            </svg>
          </header>

          <main className="min-h-0 overflow-y-auto bg-white px-[8.5%] pb-[2%] pt-[5.5%]">
            <DialogDescription className="mb-[clamp(8px,2vw,14px)] text-[clamp(14px,3.5vw,24px)] font-normal leading-[1.25] text-[#303030]">
              Bienvenue sur la plateforme DIAMANT.
            </DialogDescription>
            <ol className="space-y-[clamp(12px,3vw,26px)] text-[clamp(14px,3.5vw,24px)] font-normal leading-[1.24] text-[#303030]">
              {popupLines.map((line, index) => (
                <li
                  key={line}
                  className="grid grid-cols-[1.35em_minmax(0,1fr)] gap-[0.12em]"
                >
                  <span aria-hidden="true">{index + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </main>

          <footer className="space-y-[clamp(9px,2.4vw,18px)] bg-white px-[6%] pb-[4%] pt-[2.5%]">
            <button
              type="button"
              onClick={() => undefined}
              className="flex min-h-[clamp(48px,12.2vw,88px)] w-full items-center justify-center gap-[clamp(8px,1.8vw,14px)] rounded-[9px] border border-[#efd458] bg-[#ffe16b] px-3 py-2 text-center text-[clamp(14px,3.5vw,24px)] font-normal leading-[1.2] text-[#39352d] shadow-[0_2px_6px_rgba(123,99,15,0.12)] transition-[transform,filter,box-shadow] hover:brightness-[1.02] active:translate-y-px active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#258ec6] focus-visible:ring-offset-2"
              data-testid="button-popup-telegram"
            >
              <span className="flex h-[clamp(30px,7vw,50px)] w-[clamp(30px,7vw,50px)] shrink-0 items-center justify-center rounded-full bg-[#229fdf] text-white">
                <Send
                  className="h-[clamp(17px,3.7vw,27px)] w-[clamp(17px,3.7vw,27px)]"
                  fill="currentColor"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
              <span>Rejoindre le groupe de discussion Telegram</span>
            </button>
            <DialogClose asChild>
              <button
                type="button"
                className="min-h-[clamp(44px,10vw,74px)] w-full rounded-[9px] bg-[#30304f] px-4 py-2 text-[clamp(16px,3.6vw,25px)] font-medium leading-tight text-white transition-colors hover:bg-[#39395d] active:bg-[#272743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30304f] focus-visible:ring-offset-2"
                data-testid="button-announcement-confirm"
              >
                OK
              </button>
            </DialogClose>
          </footer>
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
