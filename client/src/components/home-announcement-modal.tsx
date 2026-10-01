import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import popupMascot from "@assets/generated_images/diamant-popup-mascot.png";
import { getContent } from "@/lib/content";

const POPUP_ACCENT = "#08b83a";

const DEFAULT_LINES = [
  "🚀 DIAMANT RDC: official launch!",
  "📅 DIAMANT officially launches on 03/09/2026!",
  "✅ Minimum deposit: 18 XOF",
  "✅ Minimum withdrawal: 1 XOF via USDT BEP20, with no fee",
  "✅ Registration bonus: 2 XOF",
  "👥 Invite your friends and earn commissions",
  "🕘 Withdrawals and support: 09:00–17:00",
  "🔥 Your first earning is available after purchase. Collect it in Revenue, then collect new earnings every 24 hours 📈",
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
  const telegramLabel = settings.channelLabel || settings.popupTelegramLabel || "Telegram >";
  const confirmLabel = settings.popupConfirmLabel || "OK";
  const announcementTitle = popupTitle;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-[calc(100%-3rem)] max-w-[410px] overflow-visible border-0 bg-[#eaffe7] p-0 shadow-2xl [&>button]:hidden"
        style={{ borderRadius: 10, maxHeight: "calc(100vh - 110px)" }}
      >
        <img
          src={popupMascot}
          alt=""
          className="pointer-events-none absolute left-1/2 z-10 h-[102px] w-[150px] -translate-x-1/2 object-contain"
          style={{ top: -57 }}
        />
        <DialogTitle className="sr-only">{announcementTitle}</DialogTitle>
        <div
          className="overflow-y-auto px-4 pb-5 pt-12"
          style={{ color: "#101010", fontSize: 16, lineHeight: 1.9 }}
        >
          {lines.map((line, index) => (
            <p key={`${line}-${index}`} className="whitespace-pre-wrap">{line}</p>
          ))}
        </div>
        <div className="flex h-[78px] shrink-0 border-t border-[#d9ead6] bg-white" style={{ borderRadius: "0 0 10px 10px" }}>
          <button
            onClick={() => telegramUrl && window.open(telegramUrl, "_blank", "noopener,noreferrer")}
            disabled={!telegramUrl}
            className="flex min-w-0 flex-1 items-center justify-center gap-1 border-r border-[#e3e3e3] px-2 active:opacity-70"
            style={{ color: "#111", fontSize: "clamp(17px, 5.4vw, 25px)" }}
            data-testid="button-popup-telegram"
          >
            <span className="flex shrink-0 items-center justify-center rounded-full bg-[#2aabee]" style={{ width: "clamp(32px, 8.7vw, 40px)", height: "clamp(32px, 8.7vw, 40px)" }}>
              <Send size={20} fill="white" color="white" strokeWidth={1.8} />
            </span>
             <span className="truncate whitespace-nowrap">{telegramUrl ? telegramLabel : "Support non configuré"}</span>
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex min-w-0 flex-1 items-center justify-center px-2 active:opacity-70"
            style={{ color: POPUP_ACCENT, fontSize: "clamp(24px, 6.3vw, 29px)", fontWeight: 400 }}
            data-testid="button-popup-ok"
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}