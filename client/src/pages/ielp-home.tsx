import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  CalendarDays,
  CircleDollarSign,
  CircleHelp,
  CloudDownload,
  Crown,
  HandCoins,
  Lightbulb,
  MessageCircleMore,
  MessageSquare,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { getContent } from "@/lib/content";
import { useToast } from "@/hooks/use-toast";
import { LanguagePicker } from "@/components/language-picker";
import { DiamantBrand } from "@/components/diamant-brand";
import { FloatingSupport } from "@/components/floating-support";
import HomeAnnouncementModal from "@/components/home-announcement-modal";

type HomeStats = {
  totalUsers: number;
  totalProduction: number;
};

type TeamStats = {
  totalCommission?: number;
};

const COPY: Record<Lang, {
  notice: string;
  totalAssets: string;
  miningWallet: string;
  earningsWallet: string;
  commissionWallet: string;
  deposit: string;
  withdraw: string;
  vip: string;
  events: string;
  faq: string;
  invite: string;
  about: string;
  application: string;
  products: string;
  earn: string;
  users: string;
  production: string;
  companyDetails: string;
  livePrices: string;
  partners: string;
  share: string;
  sharePrompt: string;
  chat: string;
  installTitle: string;
  installHint: string;
  linkCopied: string;
  shareFailed: string;
}> = {
  fr: {
    notice: "Mise en vigueur afin de garantir la sécurité des fonds de nos utilisateurs. Consultez les annonces avant toute opération.",
    totalAssets: "Actifs totaux",
    miningWallet: "Portefeuille de minage",
    earningsWallet: "Gagnez un portefeuille",
    commissionWallet: "Portefeuille de commission",
    deposit: "Dépôt",
    withdraw: "Retirer",
    vip: "VIP",
    events: "Événements",
    faq: "FAQ",
    invite: "Inviter",
    about: "À propos",
    application: "Application",
    products: "Produits",
    earn: "Gagner",
    users: "Nombre total d'utilisateurs",
    production: "Production totale",
    companyDetails: "Détails de l'entreprise IELP",
    livePrices: "prix en direct",
    partners: "Partenaires",
    share: "Partager",
    sharePrompt: "Partagez votre lien et gagnez",
    chat: "Service client",
    installTitle: "Installer l’application",
    installHint: "Ouvrez le menu de votre navigateur pour ajouter cette application à l’écran d’accueil.",
    linkCopied: "Lien copié",
    shareFailed: "Le partage n’a pas pu être ouvert.",
  },
  en: {
    notice: "Important notice to help protect the safety of user funds. Check announcements before making a transaction.",
    totalAssets: "Total assets",
    miningWallet: "Mining portfolio",
    earningsWallet: "Earnings portfolio",
    commissionWallet: "Commission portfolio",
    deposit: "Deposit",
    withdraw: "Withdraw",
    vip: "VIP",
    events: "Events",
    faq: "FAQ",
    invite: "Invite",
    about: "About",
    application: "Application",
    products: "Products",
    earn: "Earn",
    users: "Total users",
    production: "Total production",
    companyDetails: "IELP company details",
    livePrices: "live prices",
    partners: "Partners",
    share: "Share",
    sharePrompt: "Share your link and earn",
    chat: "Customer service",
    installTitle: "Install the app",
    installHint: "Open your browser menu to add this app to your home screen.",
    linkCopied: "Link copied",
    shareFailed: "Sharing could not be opened.",
  },
  ar: {
    notice: "إشعار مهم للمساعدة في حماية أموال المستخدمين. راجع الإعلانات قبل إجراء أي معاملة.",
    totalAssets: "إجمالي الأصول",
    miningWallet: "محفظة التعدين",
    earningsWallet: "محفظة الأرباح",
    commissionWallet: "محفظة العمولات",
    deposit: "إيداع",
    withdraw: "سحب",
    vip: "VIP",
    events: "الأحداث",
    faq: "الأسئلة",
    invite: "دعوة",
    about: "حول",
    application: "التطبيق",
    products: "المنتجات",
    earn: "اربح",
    users: "إجمالي المستخدمين",
    production: "إجمالي الإنتاج",
    companyDetails: "تفاصيل شركة IELP",
    livePrices: "الأسعار المباشرة",
    partners: "الشركاء",
    share: "مشاركة",
    sharePrompt: "شارك رابطك واربح",
    chat: "خدمة العملاء",
    installTitle: "تثبيت التطبيق",
    installHint: "افتح قائمة المتصفح لإضافة التطبيق إلى الشاشة الرئيسية.",
    linkCopied: "تم نسخ الرابط",
    shareFailed: "تعذرت المشاركة.",
  },
  zh: {
    notice: "重要提醒：为保障用户资金安全，请在交易前查看平台公告。",
    totalAssets: "总资产",
    miningWallet: "矿业钱包",
    earningsWallet: "收益钱包",
    commissionWallet: "佣金钱包",
    deposit: "充值",
    withdraw: "提现",
    vip: "VIP",
    events: "活动",
    faq: "常见问题",
    invite: "邀请",
    about: "关于",
    application: "应用",
    products: "产品",
    earn: "赚取",
    users: "用户总数",
    production: "总产值",
    companyDetails: "IELP 公司详情",
    livePrices: "实时价格",
    partners: "合作伙伴",
    share: "分享",
    sharePrompt: "分享链接，赚取奖励",
    chat: "客户服务",
    installTitle: "安装应用",
    installHint: "打开浏览器菜单，将此应用添加到主屏幕。",
    linkCopied: "链接已复制",
    shareFailed: "无法打开分享。",
  },
};

const SHORTCUTS: {
  key: keyof Pick<typeof COPY.fr, "deposit" | "withdraw" | "vip" | "events" | "faq" | "invite" | "about" | "application">;
  href?: string;
  Icon: LucideIcon;
}[] = [
  { key: "deposit", href: "/deposit", Icon: CircleDollarSign },
  { key: "withdraw", href: "/withdrawal", Icon: HandCoins },
  { key: "vip", href: "/vip", Icon: Crown },
  { key: "events", href: "/checkin", Icon: CalendarDays },
  { key: "faq", href: "/rules", Icon: CircleHelp },
  { key: "invite", href: "/team", Icon: UsersRound },
  { key: "about", href: "/about", Icon: Building2 },
  { key: "application", Icon: CloudDownload },
];

const MARKET_COINS = [
  { ticker: "BTC", name: "Bitcoin", mark: "₿", color: "#f7931a", shape: "circle" },
  { ticker: "ETH", name: "Ethereum", mark: "◆", color: "#dfe7f3", shape: "diamond" },
  { ticker: "BCH", name: "Bitcoin Cash", mark: "Ƀ", color: "#21b66f", shape: "circle" },
  { ticker: "BNB", name: "BNB", mark: "◆", color: "#f3ba2f", shape: "square" },
  { ticker: "DOT", name: "Polkadot", mark: "●", color: "#17191e", shape: "square" },
  { ticker: "LTC", name: "Litecoin", mark: "Ł", color: "#a6b8d0", shape: "circle" },
  { ticker: "TRX", name: "TRON", mark: "△", color: "#e61b3c", shape: "square" },
  { ticker: "SHIB", name: "Shiba Inu", mark: "◉", color: "#f05a24", shape: "square" },
  { ticker: "AVAX", name: "Avalanche", mark: "▲", color: "#e84142", shape: "circle" },
];

const PARTNER_NAMES = [
  "BINANCE",
  "ethereum",
  "BITMAIN",
  "TRON",
  "tether",
  "coinbase",
  "Huobi",
  "DOGECOIN",
  "CoinDCX",
];

const EXCHANGES = ["BINANCE", "OKX", "HUOBI", "COINBASE"];

const numberFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: unknown) {
  const amount = Number(value);
  return numberFormat.format(Number.isFinite(amount) ? amount : 0);
}

function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { lang } = useI18n();
  const { toast } = useToast();
  const copy = COPY[lang];
  const [activeExchange, setActiveExchange] = useState("OKX");
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const { data: settings = {} } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });
  const { data: homeStats } = useQuery<HomeStats>({
    queryKey: ["/api/home/stats"],
    staleTime: 60_000,
  });
  const { data: teamStats } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
    staleTime: 60_000,
  });

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as any);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  const shareUrl = useMemo(() => {
    const referralCode = user?.referralCode ? `?ref=${encodeURIComponent(user.referralCode)}` : "";
    return `${window.location.origin}/#/register${referralCode}`;
  }, [user?.referralCode]);

  if (!user) return null;

  const balance = Number(user.balance || 0);
  const earnings = Number(user.totalEarnings || 0);
  const commission = Number(teamStats?.totalCommission || 0);
  const totalAssets = balance + earnings;

  async function handleApplication() {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      return;
    }
    toast({ title: copy.installTitle, description: copy.installHint });
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: copy.linkCopied });
    } catch {
      toast({ title: copy.shareFailed, variant: "destructive" });
    }
  }

  function shareTo(target: string) {
    const encodedUrl = encodeURIComponent(shareUrl);
    const message = encodeURIComponent(copy.sharePrompt);
    const destinations: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${message}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${message}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${message}%20${encodedUrl}`,
    };
    const destination = destinations[target];
    if (destination) {
      window.open(destination, "_blank", "noopener,noreferrer");
    } else if (navigator.share) {
      void navigator.share({ title: "IELP", text: copy.sharePrompt, url: shareUrl }).catch(() => undefined);
    } else {
      void copyShareLink();
    }
  }

  return (
    <main className="ielp-home-page" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="ielp-home-shell">
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
              data-testid="button-home-chat"
            >
              <MessageSquare size={21} fill="white" strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="ielp-home-content">
          <div className="ielp-home-notice" role="status">
            <Bell size={19} fill="none" strokeWidth={2.2} aria-hidden="true" />
            <div className="ielp-home-notice__clip">
              <span>{getContent(settings, "content_home_securityNotice", copy.notice)}</span>
            </div>
          </div>

          <section className="ielp-home-dashboard" aria-label={copy.totalAssets}>
            <div className="ielp-home-balance">
              <div className="ielp-home-total">
                <span>{copy.totalAssets}</span>
                <span className="ielp-home-total__divider" />
                <strong><small>USDT</small> {formatMoney(totalAssets)}</strong>
              </div>
              <div className="ielp-home-balances">
                <div><span>{copy.miningWallet}</span><strong>USDT {formatMoney(balance)}</strong></div>
                <div><span>{copy.earningsWallet}</span><strong>USDT {formatMoney(earnings)}</strong></div>
                <div><span>{copy.commissionWallet}</span><strong>USDT {formatMoney(commission)}</strong></div>
              </div>
            </div>

            <div className="ielp-home-shortcuts">
              {SHORTCUTS.map(({ key, href, Icon }) => (
                <button
                  key={key}
                  className="ielp-home-shortcut"
                  type="button"
                  onClick={() => href ? navigate(href) : void handleApplication()}
                  data-testid={`home-shortcut-${key}`}
                >
                  <span className="ielp-home-shortcut__icon">
                    <Icon size={29} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span>{copy[key]}</span>
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            className="ielp-home-products-banner"
            onClick={() => navigate("/invest")}
            data-testid="home-products-banner"
          >
            <span className="ielp-home-products-banner__icon">
              <Lightbulb size={33} strokeWidth={2.6} aria-hidden="true" />
              <CircleDollarSign size={17} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="ielp-home-products-banner__copy">
              <strong>{copy.products}</strong>
              <small>{copy.earn}</small>
            </span>
          </button>

          <section className="ielp-home-stats" aria-label={copy.production}>
            <article className="ielp-home-stat-card">
              <span className="ielp-home-stat-card__icon"><UsersRound size={29} fill="white" strokeWidth={2.2} aria-hidden="true" /></span>
              <strong>{numberFormat.format(Number(homeStats?.totalUsers || 0))}</strong>
              <span>{copy.users}</span>
            </article>
            <article className="ielp-home-stat-card">
              <span className="ielp-home-stat-card__icon"><CircleDollarSign size={30} strokeWidth={2.5} aria-hidden="true" /></span>
              <strong>USDT {formatMoney(homeStats?.totalProduction || 0)}</strong>
              <span>{copy.production}</span>
            </article>
          </section>

          <button
            type="button"
            className="ielp-home-company-link"
            onClick={() => navigate("/about")}
          >
            <span>{copy.companyDetails}</span>
            <span aria-hidden="true">›</span>
          </button>

          <section className="ielp-home-market">
            <h2>{copy.livePrices}</h2>
            <div className="ielp-home-market-panel">
              <div className="ielp-home-exchanges" role="tablist" aria-label={copy.livePrices}>
                {EXCHANGES.map((exchange) => (
                  <button
                    key={exchange}
                    type="button"
                    role="tab"
                    aria-selected={activeExchange === exchange}
                    className={activeExchange === exchange ? "is-active" : ""}
                    onClick={() => setActiveExchange(exchange)}
                  >
                    {exchange}
                  </button>
                ))}
              </div>
              <div className="ielp-home-market-list">
                {MARKET_COINS.map((coin) => (
                  <div className="ielp-home-market-row" key={coin.ticker}>
                    <span className={`ielp-home-coin ielp-home-coin--${coin.shape}`} style={{ backgroundColor: coin.color }}>
                      {coin.mark}
                    </span>
                    <span className="ielp-home-coin-label">
                      <strong>{coin.ticker}</strong><small>/USDT</small>
                    </span>
                    <span className="ielp-home-market-change">--</span>
                    <span className="ielp-home-market-value">--%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="ielp-home-partners">
            <h2>{copy.partners}</h2>
            <div className="ielp-home-partner-panel">
              {PARTNER_NAMES.map((partner, index) => (
                <div className={`ielp-home-partner ielp-home-partner--${index}`} key={partner}>
                  <span aria-hidden="true">{["◈", "♦", "▰", "△", "T", "C", "火", "Ð", "◉"][index]}</span>
                  <strong>{partner}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="ielp-home-share">
            <h2>{copy.share}</h2>
            <div className="ielp-home-share-panel">
              <p>{copy.sharePrompt}</p>
              <div className="ielp-home-socials">
                <button type="button" aria-label="X" onClick={() => shareTo("x")}><span className="ielp-social-x">𝕏</span></button>
                <button type="button" aria-label="Facebook" onClick={() => shareTo("facebook")}><span className="ielp-social-facebook">f</span></button>
                <button type="button" aria-label="Telegram" onClick={() => shareTo("telegram")}><MessageCircleMore size={22} aria-hidden="true" /></button>
                <button type="button" aria-label="LinkedIn" onClick={() => shareTo("linkedin")}><span className="ielp-social-linkedin">in</span></button>
                <button type="button" aria-label="WhatsApp" onClick={() => shareTo("whatsapp")}><span className="ielp-social-whatsapp">☎</span></button>
                <button type="button" aria-label="Instagram" onClick={() => shareTo("instagram")}><span className="ielp-social-instagram">◎</span></button>
                <button type="button" aria-label="TikTok" onClick={() => shareTo("tiktok")}><span className="ielp-social-tiktok">♪</span></button>
                <button type="button" aria-label="Partager le lien" onClick={() => shareTo("native")}><UsersRound size={19} aria-hidden="true" /></button>
              </div>
            </div>
          </section>
        </div>

      </div>

      <FloatingSupport placement="home" />
      <HomeAnnouncementModal />
    </main>
  );
}

export default HomePage;