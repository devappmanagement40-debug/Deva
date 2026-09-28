import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCountryByCode } from "@/lib/countries";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { localeForLang, useI18n } from "@/lib/i18n";
import { useMutation } from "@tanstack/react-query";
import {
  CreditCard,
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  Gift,
  HandCoins,
  Headphones,
  Info,
  KeyRound,
  LogOut,
  MoreVertical,
  Bookmark,
  ReceiptText,
  Shield,
  type LucideIcon,
} from "lucide-react";
import profileBike from "@assets/generated_images/tgood-profile-bike.png";
import missionBanner from "@assets/generated_images/tgood-tasks-bike-banner.jpg";

const TGOOD_GREEN = "#08b83a";

const PROFILE_ACTIONS: {
  labelKey: "deposit" | "withdraw" | "history" | "checkinBtn";
  href: string;
  Icon: LucideIcon;
  color: string;
}[] = [
  { labelKey: "deposit", href: "/deposit", Icon: CircleDollarSign, color: "#050505" },
  { labelKey: "withdraw", href: "/withdrawal", Icon: HandCoins, color: "#050505" },
  { labelKey: "history", href: "/history", Icon: ReceiptText, color: "#050505" },
  { labelKey: "checkinBtn", href: "/checkin", Icon: CalendarDays, color: "#050505" },
];

const MORE_ACTIONS: {
  labelKey: "about" | "security" | "history" | "customerService" | "shareInformation" | "wallet" | "changePassword" | "redeem";
  href: string;
  Icon: LucideIcon;
}[] = [
  { labelKey: "about", href: "/about", Icon: Info },
  { labelKey: "security", href: "/rules", Icon: Bookmark },
  { labelKey: "history", href: "/history", Icon: FileText },
  { labelKey: "customerService", href: "/service", Icon: Headphones },
  { labelKey: "shareInformation", href: "/share-information", Icon: Download },
  { labelKey: "wallet", href: "/wallet", Icon: CreditCard },
  { labelKey: "changePassword", href: "/change-password", Icon: KeyRound },
  { labelKey: "redeem", href: "/gift-code", Icon: Gift },
];

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if ((window as any)._installPrompt) setInstallPrompt((window as any)._installPrompt);
    const onPrompt = (event: any) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!user) return null;

  const verifyPinMutation = useMutation({
    mutationFn: async (pin: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-pin", { pin });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t.incorrectPin);
      }
      return res.json();
    },
    onSuccess: () => {
      setShowPinModal(false);
      setShowAccountMenu(false);
      setAdminPin("");
      navigate("/admin");
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleInstall = async () => {
    if (!installPrompt) {
        toast({ title: "Use your browser menu to install the app." });
      return;
    }
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") {
        toast({ title: "App installed successfully!" });
        setInstallPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const openAdmin = () => {
    if (user.isAdminPasswordRequired === false) {
      setShowAccountMenu(false);
      navigate("/admin");
      return;
    }
    setShowPinModal(true);
  };

  const rawBalance = parseFloat(user.balance || "0");
  const rawEarnings = parseFloat(user.totalEarnings || "0");
  const balance = Number.isFinite(rawBalance) ? rawBalance : 0;
  const earnings = Number.isFinite(rawEarnings) ? rawEarnings : 0;
  const country = getCountryByCode(user.country);
  const phonePrefix = country?.phonePrefix ? `+${country.phonePrefix} ` : "";
  const formatAmount = (value: number) => value.toLocaleString(localeForLang(lang), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <main className="account-page pb-20" style={{ minHeight: "100vh", background: "#f8fafb" }}>
      <section className="mx-auto w-full max-w-[480px] overflow-hidden bg-[#f8fafb]">
        <section className="mx-3 mt-3 overflow-hidden bg-white" style={{ borderRadius: 13, boxShadow: "0 1px 5px rgba(0,0,0,.04)" }}>
          <div className="flex h-[112px] items-center px-4">
            <img
              src={profileBike}
              alt="TGOOD electric bike"
              className="h-[78px] w-[94px] object-contain"
            />
            <div className="min-w-0 flex-1 pl-2">
              <p className="truncate font-normal" style={{ color: "#151515", fontSize: 22 }}>
                {phonePrefix}{user.phone}
              </p>
              <span
                className="mt-2 inline-flex min-w-[89px] items-center justify-center rounded-full py-1 text-white"
                style={{ background: "#20c95f", fontSize: 16 }}
              >
                Lv1
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleLogout}
                className="flex flex-col items-center active:opacity-60"
                style={{ color: "#111" }}
                data-testid="button-logout"
              >
                <LogOut size={26} strokeWidth={2.2} />
                <span style={{ fontSize: 13 }}>{t.logout}</span>
              </button>
              <button
                onClick={() => setShowAccountMenu(true)}
                className="h-5 w-6 text-[#777] active:opacity-60"
                aria-label="Open account settings"
                data-testid="button-account-menu"
              >
                <MoreVertical size={17} className="mx-auto" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-[#eeeeee]">
            <button
              onClick={() => navigate("/wallet")}
              className="border-r border-[#eeeeee] py-4 text-center active:bg-slate-50"
              data-testid="button-profile-balance"
            >
              <p className="font-normal" style={{ color: TGOOD_GREEN, fontSize: 26 }}>USDT {formatAmount(balance)}</p>
              <p className="mt-1" style={{ color: "#222", fontSize: 14 }}>{t.accountBalance}</p>
            </button>
            <button
              onClick={() => navigate("/earnings")}
              className="py-4 text-center active:bg-slate-50"
              data-testid="button-profile-earnings"
            >
              <p className="font-normal" style={{ color: TGOOD_GREEN, fontSize: 26 }}>USDT {formatAmount(earnings)}</p>
              <p className="mt-1" style={{ color: "#222", fontSize: 14 }}>{t.revenue}</p>
            </button>
          </div>
        </section>

        <section
          className="mx-3 mt-3 grid grid-cols-4 bg-white px-2 py-3"
          style={{ borderRadius: 11, boxShadow: "0 2px 8px rgba(0,0,0,.045)" }}
        >
          {PROFILE_ACTIONS.map(({ labelKey, href, Icon, color }) => (
            <button
              key={labelKey}
              onClick={() => navigate(href)}
              className="flex min-w-0 flex-col items-center justify-start gap-2 py-2 active:scale-95"
              style={{ color: "#252525", transition: "transform 120ms ease" }}
              data-testid={`profile-action-${href.slice(1)}`}
            >
              <Icon size={42} strokeWidth={2.35} color={color} aria-hidden="true" />
              <span className="px-0.5 text-center leading-tight" style={{ fontSize: 15 }}>
                {t[labelKey]}
              </span>
            </button>
          ))}
        </section>

        <section className="relative mx-3 mt-3 h-[272px] overflow-hidden" style={{ borderRadius: 12 }}>
          <img
            src={missionBanner}
            alt="Sustainable mobility with TGOOD electric bikes"
            className="h-full w-full object-cover"
            style={{ objectPosition: "center" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,18,10,.05) 0%, rgba(8,18,10,.18) 42%, rgba(8,18,10,.64) 100%)" }} />
          <div className="absolute right-5 top-[46px] w-[53%] text-white">
            <h1 className="font-semibold whitespace-nowrap" style={{ fontSize: 29, lineHeight: 1.1 }}>{t.taskCenterTitle}</h1>
            <p className="mt-3" style={{ fontSize: 19, lineHeight: 1.42 }}>
              Complete tasks and earn generous bonuses
            </p>
            <button
              onClick={() => navigate("/tasks")}
              className="mt-3 w-full py-2 font-medium text-white active:scale-[.98]"
              style={{ background: "#20c95f", borderRadius: 24, fontSize: 17, transition: "transform 120ms ease" }}
              data-testid="button-mission-center"
            >
              Go
            </button>
          </div>
        </section>

        <section className="mx-3 mt-3 bg-white px-3 pt-5 pb-3" style={{ borderRadius: 11, boxShadow: "0 1px 5px rgba(0,0,0,.035)" }}>
           <h2 className="ml-3 font-normal" style={{ color: "#1e1e1e", fontSize: 22 }}>More</h2>
          <div className="mt-5 grid grid-cols-4">
          {MORE_ACTIONS.map(({ labelKey, href, Icon }) => (
              <button
              key={href}
                onClick={() => navigate(href)}
                className="flex min-w-0 flex-col items-center gap-2 px-0.5 py-3 active:scale-95"
                style={{ color: "#111", transition: "transform 120ms ease" }}
                data-testid={`more-action-${href.slice(1)}`}
              >
                <Icon size={43} strokeWidth={2.5} />
                <span className="min-h-[36px] text-center leading-snug" style={{ fontSize: 15 }}>
                {t[labelKey]}
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <Dialog open={showAccountMenu} onOpenChange={setShowAccountMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>My account</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <div className="mb-3 rounded-xl bg-[#f3faf5] px-4 py-3">
              <p className="font-medium text-[#1f2933]">{phonePrefix}{user.phone}</p>
              <p className="mt-1 text-xs text-[#65736e]">TGOOD member</p>
            </div>
            {[
              { label: t.changePassword, href: "/change-password", Icon: KeyRound },
              { label: t.wallet, href: "/wallet", Icon: CreditCard },
              { label: t.redeem, href: "/gift-code", Icon: Gift },
            ].map(({ label, href, Icon }) => (
              <button
                key={href}
                onClick={() => { setShowAccountMenu(false); navigate(href); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-slate-50"
              >
                <Icon size={19} color={TGOOD_GREEN} />
                <span className="text-sm text-[#30363a]">{label}</span>
              </button>
            ))}
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-slate-50 disabled:opacity-60"
            >
              <Download size={19} color={TGOOD_GREEN} />
              <span className="text-sm text-[#30363a]">{installing ? "Installing…" : "Install app"}</span>
            </button>
            {user.isAdmin && (
              <button
                onClick={openAdmin}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-slate-50"
              >
                <Shield size={19} color={TGOOD_GREEN} />
                <span className="text-sm text-[#30363a]">{t.adminPanel}</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#fff0f0] px-3 py-3 font-medium text-[#d22f2f] active:opacity-70"
            >
              <LogOut size={18} />
              {t.logout}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t.adminAccessCode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              value={adminPin}
              onChange={(event) => setAdminPin(event.target.value)}
              placeholder={t.pinPlaceholder}
              className="text-center text-2xl tracking-widest"
              maxLength={8}
              data-testid="input-admin-pin"
            />
            <Button
              onClick={() => {
                if (adminPin.length < 4) {
                  toast({ title: t.pinMinLength, variant: "destructive" });
                  return;
                }
                verifyPinMutation.mutate(adminPin);
              }}
              disabled={verifyPinMutation.isPending || adminPin.length < 4}
              className="w-full"
              style={{ backgroundColor: TGOOD_GREEN }}
              data-testid="button-verify-pin"
            >
              {verifyPinMutation.isPending ? "Verifying…" : t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}