import { useState } from "react";
import { Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import "./_group.css";

const announcementLines = [
  "Bienvenue sur la plateforme DIAMANT.",
  "Les dépôts sont crédités après confirmation du paiement.",
  "Dépôt minimum : 18 XOF.",
  "Retrait minimum : 1 XOF via USDT BEP20, sans frais.",
  "Les retraits et le support sont disponibles de 09:00 à 17:00.",
  "Les gains des produits sont crédités automatiquement à la fin de leur cycle.",
  "Invitez vos amis et gagnez des commissions de parrainage.",
  "Merci de consulter les règles DIAMANT avant toute opération.",
];

export function Current() {
  const [open, setOpen] = useState(true);

  return (
    <main className="home-announcement-preview min-h-screen bg-[#0d1634]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(73,112,216,0.35),transparent_32%),linear-gradient(155deg,#101b43,#10152f_60%,#241e54)]" />
      <div className="absolute inset-x-5 top-8 space-y-4 opacity-35" aria-hidden="true">
        <div className="h-12 rounded-xl bg-white/15" />
        <div className="h-36 rounded-2xl bg-white/10" />
        <div className="h-24 rounded-2xl bg-white/10" />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[calc(100%-3rem)] max-w-[410px] overflow-visible border-0 bg-[#eaffe7] p-0 shadow-2xl [&>button]:hidden"
          style={{ borderRadius: 10, maxHeight: "calc(100vh - 110px)" }}
        >
          <img
            src="/__mockup/images/diamant-popup-mascot.png"
            alt=""
            className="pointer-events-none absolute left-1/2 z-10 h-[102px] w-[150px] -translate-x-1/2 object-contain"
            style={{ top: -57 }}
          />
          <DialogTitle className="sr-only">Annonce DIAMANT</DialogTitle>
          <div
            className="overflow-y-auto px-4 pb-5 pt-12"
            style={{ color: "#101010", fontSize: 16, lineHeight: 1.9 }}
          >
            {announcementLines.map((line, index) => (
              <p key={`${line}-${index}`} className="whitespace-pre-wrap">{line}</p>
            ))}
          </div>
          <div className="flex h-[78px] shrink-0 border-t border-[#d9ead6] bg-white" style={{ borderRadius: "0 0 10px 10px" }}>
            <button
              onClick={() => undefined}
              className="flex min-w-0 flex-1 items-center justify-center gap-1 border-r border-[#e3e3e3] px-2 active:opacity-70"
              style={{ color: "#111", fontSize: "clamp(17px, 5.4vw, 25px)" }}
            >
              <span className="flex shrink-0 items-center justify-center rounded-full bg-[#2aabee]" style={{ width: "clamp(32px, 8.7vw, 40px)", height: "clamp(32px, 8.7vw, 40px)" }}>
                <Send size={20} fill="white" color="white" strokeWidth={1.8} />
              </span>
              <span className="truncate whitespace-nowrap">Chaîne officielle</span>
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex min-w-0 flex-1 items-center justify-center px-2 active:opacity-70"
              style={{ color: "#08b83a", fontSize: "clamp(24px, 6.3vw, 29px)", fontWeight: 400 }}
            >
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
