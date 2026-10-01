import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  CircleHelp,
  CreditCard,
  Copy,
  Crown,
  Download,
  FileText,
  Gift,
  HandCoins,
  Headphones,
  Info,
  KeyRound,
  LockKeyhole,
  LogOut,
  MessageSquare,
  PanelsTopLeft,
  ReceiptText,
  Shield,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DiamantBrand } from "@/components/diamant-brand";
import { FloatingSupport } from "@/components/floating-support";
import { LanguagePicker } from "@/components/language-picker";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  computeVipLevelFromProduct,
  DEFAULT_VIP_CONFIGS,
  VIP_BADGE_STYLE,
  mergeAdminVipConfig,
} from "@/lib/vip";
import bannerTeamPhoto from "@/assets/images/diamant-banner-team-dsc-0636.jpg";
import bannerLeadershipPhoto from "@/assets/images/diamant-banner-leadership-team.jpg";
import bannerMeganePhoto from "@/assets/images/diamant-banner-megane.jpg";
import "./account.css";

const ACCOUNT_BANNER_POSTERS = [
  { id: "team-photo", src: bannerTeamPhoto, slideWidth: 198, fit: "cover" },
  { id: "leadership-team-photo", src: bannerLeadershipPhoto, slideWidth: 318, fit: "cover" },
  { id: "megane-photo", src: bannerMeganePhoto, slideWidth: 132, fit: "contain" },
] as const;

type AccountCopy = {
  deposit: string;
  withdraw: string;
  statements: string;
  transfer: string;
  orders: string;
  walletCard: string;
  balance: string;
  memberId: string;
  team: string;
  myCompany: string;
  earnings: string;
  rewards: string;
  vipTitle: string;
  vipAmountRemaining: string;
  vipMax: string;
  idCopied: string;
  idCopyFailed: string;
  faq: string;
  password: string;
  securityPin: string;
  support: string;
  companyDetails: string;
  about: string;
  logout: string;
  accountMenu: string;
  member: string;
  install: string;
  installing: string;
  installHint: string;
  installSuccess: string;
  pinUnavailable: string;
  pinUnavailableHint: string;
  chat: string;
};

const COPY: Record<Lang, AccountCopy> = {
  fr: {
    deposit: "Recharger",
    withdraw: "Retirer",
    statements: "Déclarations",
    transfer: "Transfert",
    orders: "Commandes",
    walletCard: "Portefeuille carte",
    balance: "Mon solde",
    memberId: "ID",
    team: "Équipe",
    myCompany: "Mon entreprise",
    earnings: "Solde",
    rewards: "Récompenses",
    vipTitle: "Niveau VIP",
    vipAmountRemaining: "Passer à {level} il manque encore {amount}",
    vipMax: "Vous avez atteint le niveau VIP maximum.",
    idCopied: "ID copié",
    idCopyFailed: "Impossible de copier l’ID.",
    faq: "FAQ",
    password: "Mot de passe",
    securityPin: "Code PIN de sécurité",
    support: "Soutien",
    companyDetails: "Détails de l'entreprise IELP",
    about: "À propos",
    logout: "DÉCONNEXION",
    accountMenu: "Mon compte",
    member: "Membre IELP",
    install: "Installer l'application",
    installing: "Installation…",
    installHint: "Utilisez le menu de votre navigateur pour installer l’application.",
    installSuccess: "Application installée.",
    pinUnavailable: "Code PIN non disponible",
    pinUnavailableHint: "Contactez le soutien pour toute question concernant votre code PIN.",
    chat: "Service client",
  },
  en: {
    deposit: "Deposit",
    withdraw: "Withdraw",
    statements: "Statements",
    transfer: "Transfer",
    orders: "Orders",
    walletCard: "Card wallet",
    balance: "My balance",
    memberId: "ID",
    team: "Team",
    myCompany: "My company",
    earnings: "Balance",
    rewards: "Rewards",
    vipTitle: "VIP level",
    vipAmountRemaining: "Reach {level} — {amount} more needed",
    vipMax: "You have reached the maximum VIP level.",
    idCopied: "ID copied",
    idCopyFailed: "Could not copy the ID.",
    faq: "FAQ",
    password: "Password",
    securityPin: "Security PIN",
    support: "Support",
    companyDetails: "IELP company details",
    about: "About",
    logout: "LOG OUT",
    accountMenu: "My account",
    member: "IELP member",
    install: "Install app",
    installing: "Installing…",
    installHint: "Use your browser menu to install the app.",
    installSuccess: "App installed.",
    pinUnavailable: "Security PIN unavailable",
    pinUnavailableHint: "Contact support for help with your security PIN.",
    chat: "Customer service",
  },
  ar: {
    deposit: "إيداع",
    withdraw: "سحب",
    statements: "السجل",
    transfer: "تحويل",
    orders: "الطلبات",
    walletCard: "المحفظة",
    balance: "رصيدي",
    memberId: "المعرّف",
    team: "الفريق",
    myCompany: "شركتي",
    earnings: "الرصيد",
    rewards: "المكافآت",
    vipTitle: "مستوى VIP",
    vipAmountRemaining: "للوصول إلى {level}، ما زال ينقصك {amount}",
    vipMax: "لقد وصلت إلى أعلى مستوى VIP.",
    idCopied: "تم نسخ المعرّف",
    idCopyFailed: "تعذر نسخ المعرّف.",
    faq: "الأسئلة الشائعة",
    password: "كلمة المرور",
    securityPin: "رمز PIN للأمان",
    support: "الدعم",
    companyDetails: "تفاصيل شركة IELP",
    about: "حول",
    logout: "تسجيل الخروج",
    accountMenu: "حسابي",
    member: "عضو IELP",
    install: "تثبيت التطبيق",
    installing: "جارٍ التثبيت…",
    installHint: "استخدم قائمة المتصفح لتثبيت التطبيق.",
    installSuccess: "تم تثبيت التطبيق.",
    pinUnavailable: "رمز PIN غير متاح",
    pinUnavailableHint: "تواصل مع الدعم للمساعدة بشأن رمز PIN.",
    chat: "خدمة العملاء",
  },
  zh: {
    deposit: "存款",
    withdraw: "提现",
    statements: "记录",
    transfer: "转账",
    orders: "订单",
    walletCard: "卡包",
    balance: "我的余额",
    memberId: "编号",
    team: "团队",
    myCompany: "我的企业",
    earnings: "余额",
    rewards: "奖励",
    vipTitle: "VIP等级",
    vipAmountRemaining: "升至 {level}，还差 {amount}",
    vipMax: "您已达到最高VIP等级。",
    idCopied: "编号已复制",
    idCopyFailed: "无法复制编号。",
    faq: "常见问题",
    password: "密码",
    securityPin: "安全 PIN 码",
    support: "支持",
    companyDetails: "IELP 公司详情",
    about: "关于",
    logout: "退出登录",
    accountMenu: "我的账户",
    member: "IELP 会员",
    install: "安装应用",
    installing: "正在安装…",
    installHint: "使用浏览器菜单安装应用。",
    installSuccess: "应用已安装。",
    pinUnavailable: "安全 PIN 不可用",
    pinUnavailableHint: "如需 PIN 帮助，请联系支持。",
    chat: "客户服务",
  },
};

const QUICK_ACTIONS: {
  copyKey: "deposit" | "withdraw" | "orders" | "walletCard";
  href: string;
  Icon: LucideIcon;
}[] = [
  { copyKey: "deposit", href: "/deposit", Icon: WalletCards },
  { copyKey: "withdraw", href: "/withdrawal", Icon: HandCoins },
  { copyKey: "orders", href: "/orders", Icon: ReceiptText },
  { copyKey: "walletCard", href: "/wallet", Icon: CreditCard },
];

const BUSINESS_ACTIONS: {
  copyKey: "team" | "earnings" | "rewards";
  href: string;
  Icon: LucideIcon;
}[] = [
  { copyKey: "team", href: "/team", Icon: UsersRound },
  { copyKey: "earnings", href: "/earnings", Icon: CircleDollarSign },
  { copyKey: "rewards", href: "/salary-bonus", Icon: Gift },
];

const ACCOUNT_LINKS: {
  copyKey: "faq" | "password" | "securityPin" | "support" | "companyDetails" | "about";
  href?: string;
  Icon: LucideIcon;
}[] = [
  { copyKey: "faq", href: "/rules", Icon: CircleHelp },
  { copyKey: "password", href: "/change-password", Icon: KeyRound },
  { copyKey: "securityPin", Icon: LockKeyhole },
  { copyKey: "support", href: "/service", Icon: Headphones },
  { copyKey: "companyDetails", href: "/about", Icon: BookOpen },
  { copyKey: "about", href: "/about", Icon: PanelsTopLeft },
];

const ACCOUNT_MENU_ACTIONS: {
  labelKey: "changePassword" | "wallet" | "redeem" | "checkinBtn" | "shareInformation" | "history" | "security" | "customerService" | "about" | "revenue" | "taskCenterTitle";
  href: string;
  Icon: LucideIcon;
}[] = [
  { labelKey: "changePassword", href: "/change-password", Icon: KeyRound },
  { labelKey: "wallet", href: "/wallet", Icon: CreditCard },
  { labelKey: "redeem", href: "/gift-code", Icon: Gift },
  { labelKey: "checkinBtn", href: "/checkin", Icon: CalendarDays },
  { labelKey: "shareInformation", href: "/share-information", Icon: Download },
  { labelKey: "history", href: "/history", Icon: ReceiptText },
  { labelKey: "revenue", href: "/earnings", Icon: CircleDollarSign },
  { labelKey: "taskCenterTitle", href: "/tasks", Icon: FileText },
  { labelKey: "security", href: "/rules", Icon: Bookmark },
  { labelKey: "customerService", href: "/service", Icon: Headphones },
  { labelKey: "about", href: "/about", Icon: Info },
];

function PasswordGlyph() {
  return (
    <span className="ielp-account-password-icon" aria-hidden="true">
      <span>***</span>
      <i />
    </span>
  );
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const copy = COPY[lang];
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);
  const { data: userProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/user/products"],
  });
  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const { data: catalogProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });
  const vipConfigs = mergeAdminVipConfig(DEFAULT_VIP_CONFIGS, settings);
  const vipLevel = computeVipLevelFromProduct(userProducts);
  const currentVip = vipConfigs[vipLevel] ?? DEFAULT_VIP_CONFIGS[0];
  const nextVip = vipConfigs[vipLevel + 1] ?? null;
  const vipBadge = VIP_BADGE_STYLE[vipLevel] ?? VIP_BADGE_STYLE[0];
  const nextVipProduct = nextVip
    ? catalogProducts.find((product: any) => Number(product.sortOrder) === vipLevel + 1 && product.isActive !== false)
    : null;
  const nextVipAmount = nextVipProduct ? Math.ceil(Number(nextVipProduct.price)) : null;
  const nextVipMessage = nextVip
    ? copy.vipAmountRemaining
      .replace("{level}", nextVip.label.replace(/\s+/g, ""))
      .replace("{amount}", nextVipAmount !== null && Number.isFinite(nextVipAmount) ? String(nextVipAmount) : "…")
    : copy.vipMax;

  useEffect(() => {
    if ((window as any)._installPrompt) setInstallPrompt((window as any)._installPrompt);
    const onPrompt = (event: any) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

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

  if (!user) return null;

  const phoneDigits = String(user.phone || "").replace(/\D/g, "");
  const maskedPhone = phoneDigits.length > 4
    ? `${phoneDigits.slice(0, 2)}${"*".repeat(phoneDigits.length - 4)}${phoneDigits.slice(-2)}`
    : "*".repeat(phoneDigits.length);
  const memberCode = user.referralCode || user.id;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleInstall = async () => {
    if (!installPrompt) {
      toast({ title: copy.installHint });
      return;
    }
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") {
        toast({ title: copy.installSuccess });
        setInstallPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyMemberId = async () => {
    try {
      await navigator.clipboard.writeText(String(memberCode));
      toast({ title: copy.idCopied });
    } catch {
      toast({ title: copy.idCopyFailed, variant: "destructive" });
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

  const handleSecurityPin = () => {
    if (user.isAdmin) {
      openAdmin();
      return;
    }
    navigate("/service");
  };

  return (
    <main className="ielp-home-page ielp-account-page" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="ielp-home-shell ielp-account-shell">
        <header className="ielp-home-header">
          <a className="ielp-home-brand" href="#/" aria-label="DIAMANT accueil" onClick={(event) => { event.preventDefault(); navigate("/"); }}>
            <DiamantBrand variant="on-dark" markSize={36} className="diamant-home-brand" />
          </a>
          <div className="ielp-home-header__actions">
            <LanguagePicker variant="home" />
            <button
              className="ielp-home-chat-top"
              type="button"
              onClick={() => navigate("/service")}
              aria-label={copy.chat}
              data-testid="button-account-chat"
            >
              <MessageSquare size={21} fill="white" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="ielp-account-content">
          <section className="ielp-account-hero" aria-label={copy.accountMenu}>
            <div className="ielp-account-banner" aria-hidden="true">
              <div className="ielp-account-banner-track">
                {[...ACCOUNT_BANNER_POSTERS, ...ACCOUNT_BANNER_POSTERS].map((poster, index) => (
                  <div
                    className="ielp-account-banner-slide"
                    key={`${poster.id}-${index}`}
                    style={{
                      width: poster.slideWidth,
                      flexBasis: poster.slideWidth,
                      backgroundColor: poster.fit === "contain" ? "#020304" : undefined,
                    }}
                  >
                    <img
                      src={poster.src}
                      alt=""
                      draggable={false}
                      style={{
                        objectFit: poster.fit,
                        transform: poster.fit === "contain" ? "none" : undefined,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="ielp-account-profile">
              <button
                type="button"
                className="ielp-account-avatar-button"
                onClick={() => setShowAccountMenu(true)}
                aria-label={copy.accountMenu}
                data-testid="button-account-menu"
              >
                <span className="ielp-account-avatar" aria-hidden="true">
                  <DiamantBrand variant="on-light" markSize={62} showWordmark={false} />
                </span>
              </button>
              <div className="ielp-account-profile-copy">
                <h1 className="ielp-account-name">DIAMANT</h1>
                <div className="ielp-account-identity-meta">
                  <span className="ielp-account-member-badge">{copy.memberId}</span>
                  <button
                    type="button"
                    className="ielp-account-phone-menu"
                    onClick={() => setShowAccountMenu(true)}
                    aria-label={copy.accountMenu}
                    data-testid="button-account-menu-phone"
                  >
                    {maskedPhone}
                  </button>
                  <span className="ielp-account-member-code">({memberCode})</span>
                  <button
                    type="button"
                    className="ielp-account-copy-id"
                    onClick={handleCopyMemberId}
                    aria-label={copy.idCopied}
                    data-testid="button-copy-member-id"
                  >
                    <Copy size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="ielp-account-balance-card" aria-label={copy.balance}>
            <div className="ielp-account-balance-heading">
              <span>{copy.balance}</span>
              <strong>{(Number(user.balance) || 0).toLocaleString()} FCFA</strong>
            </div>
            <nav className="ielp-account-shortcuts" aria-label={copy.accountMenu}>
              {QUICK_ACTIONS.map(({ copyKey, href, Icon }, index) => (
                <button
                  key={copyKey}
                  type="button"
                  className={`ielp-account-shortcut ielp-account-shortcut--${index + 1}`}
                  onClick={() => navigate(href)}
                  data-testid={`account-shortcut-${href.slice(1)}`}
                >
                  <span className="ielp-account-shortcut-icon">
                    <Icon size={23} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <span>{copy[copyKey]}</span>
                </button>
              ))}
            </nav>
          </section>

          <section
            className="ielp-account-vip-card"
            aria-label={copy.vipTitle}
            data-testid="account-vip-card"
          >
            <div className="ielp-account-vip-content">
              <div className="ielp-account-vip-heading">
                <span className="ielp-account-vip-title">
                  <Crown size={18} fill="currentColor" aria-hidden="true" />
                  {copy.vipTitle}
                </span>
                <span
                  className="ielp-account-vip-badge"
                  style={{
                    background: vipBadge.bg,
                    color: vipBadge.text,
                    borderColor: vipBadge.border,
                  }}
                >
                  {currentVip.label}
                </span>
              </div>
              <p className="ielp-account-vip-next">{nextVipMessage}</p>
              <div className="ielp-account-vip-progress" aria-hidden="true">
                <span />
              </div>
            </div>
            <svg className="ielp-account-vip-emblem" viewBox="0 0 90 104" aria-hidden="true">
              <defs>
                <linearGradient id="vip-emblem-shield" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset=".42" stopColor="#aeb8c8" />
                  <stop offset=".72" stopColor="#f8fbff" />
                  <stop offset="1" stopColor="#8793a6" />
                </linearGradient>
                <linearGradient id="vip-emblem-gem" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f8fbff" />
                  <stop offset=".5" stopColor="#aebbd0" />
                  <stop offset="1" stopColor="#eef3fb" />
                </linearGradient>
              </defs>
              <path d="M45 3 82 20v40L45 94 8 60V20Z" fill="url(#vip-emblem-shield)" stroke="#f8fbff" strokeWidth="2" />
              <path d="M45 12 72 25v31L45 81 18 56V25Z" fill="#526079" stroke="#7d899c" strokeWidth="1.5" />
              <path d="m22 37 9-12h28l9 12-23 29Z" fill="url(#vip-emblem-gem)" stroke="#fff" strokeWidth="1.2" />
              <path d="M22 37h46M31 25l7 12 7 29 7-29 7-12M38 37l7-12 7 12M31 37l14 9 14-9" fill="none" stroke="#71809a" strokeWidth="1.2" />
              <path d="m22 37 16 9-7-9ZM68 37l-16 9 7-9ZM38 46l7 20V37ZM52 46l-7 20V37Z" fill="#dce4f0" opacity=".72" />
              <text x="45" y="77" fill="#fff" fontSize="6" fontWeight="700" letterSpacing="1" textAnchor="middle">PREMIUM</text>
            </svg>
          </section>

          <section className="ielp-account-company-card" aria-label={copy.myCompany}>
            <h2>{copy.myCompany}</h2>
            <nav className="ielp-account-company-actions" aria-label={copy.myCompany}>
              {BUSINESS_ACTIONS.map(({ copyKey, href, Icon }) => (
                <button
                  key={copyKey}
                  type="button"
                  className={`ielp-account-company-action ielp-account-company-action--${copyKey}`}
                  onClick={() => navigate(href)}
                  data-testid={`account-company-${href.slice(1)}`}
                >
                  <span className="ielp-account-company-icon">
                    <Icon size={25} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span>{copy[copyKey]}</span>
                </button>
              ))}
            </nav>
          </section>

          <section className="ielp-account-links" aria-label={copy.accountMenu}>
            {ACCOUNT_LINKS.map(({ copyKey, href, Icon }, index) => (
              <button
                key={copyKey}
                type="button"
                className="ielp-account-link"
                onClick={() => href ? navigate(href) : handleSecurityPin()}
                data-testid={`account-link-${copyKey}`}
              >
                {copyKey === "password" ? <PasswordGlyph /> : <Icon size={24} strokeWidth={2.1} aria-hidden="true" />}
                <span>{copy[copyKey]}</span>
                {index !== 1 && <ChevronRight size={20} strokeWidth={1.8} aria-hidden="true" />}
              </button>
            ))}
          </section>

          <button
            type="button"
            className="ielp-account-logout"
            onClick={handleLogout}
            data-testid="button-account-logout"
          >
            {copy.logout}
          </button>
        </div>

      </div>

      <FloatingSupport placement="home" />

      <Dialog open={showAccountMenu} onOpenChange={setShowAccountMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{copy.accountMenu}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <div className="mb-3 rounded-xl bg-[#f3faf5] px-4 py-3">
              <p className="font-medium text-[#1f2933]">{maskedPhone}</p>
              <p className="mt-1 text-xs text-[#65736e]">{copy.member}</p>
            </div>
            {ACCOUNT_MENU_ACTIONS.map(({ labelKey, href, Icon }) => (
              <button
                key={href}
                onClick={() => { setShowAccountMenu(false); navigate(href); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-slate-50"
              >
                <Icon size={19} color="#0789e9" />
                <span className="text-sm text-[#30363a]">{t[labelKey]}</span>
              </button>
            ))}
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-slate-50 disabled:opacity-60"
            >
              <Download size={19} color="#0789e9" />
              <span className="text-sm text-[#30363a]">{installing ? copy.installing : copy.install}</span>
            </button>
            {user.isAdmin && (
              <button
                onClick={openAdmin}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left active:bg-slate-50"
              >
                <Shield size={19} color="#0789e9" />
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
              data-testid="button-verify-pin"
              style={{ backgroundColor: "#0789e9" }}
            >
              {verifyPinMutation.isPending ? "Verifying…" : t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}