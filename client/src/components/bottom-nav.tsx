import { useLocation } from "wouter";
import { House, Bike, Hash, UserRound, Cpu, CircleDollarSign, UsersRound, WalletCards, type LucideIcon } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";

const TGOOD_GREEN = "#08b83a";
const INACTIVE = "#bdbdbd";

const NAV_ITEMS: {
  path: string;
  labelKey: "home" | "products" | "team" | "me";
  testId: string;
  Icon: LucideIcon;
}[] = [
  { path: "/", labelKey: "home", testId: "home", Icon: House },
  { path: "/invest", labelKey: "products", testId: "products", Icon: Bike },
  { path: "/team", labelKey: "team", testId: "team", Icon: Hash },
  { path: "/account", labelKey: "me", testId: "me", Icon: UserRound },
];

const IELP_NAV_ITEMS: { path: string; Icon: LucideIcon }[] = [
  { path: "/", Icon: House },
  { path: "/my-products", Icon: Cpu },
  { path: "/invest", Icon: CircleDollarSign },
  { path: "/team", Icon: UsersRound },
  { path: "/account", Icon: WalletCards },
];

const IELP_NAV_LABELS: Record<Lang, string[]> = {
  fr: ["Maison", "Exploitation minière", "Investir+", "Équipe", "Moi"],
  en: ["Home", "Mining", "Invest+", "Team", "Me"],
  ar: ["الرئيسية", "التعدين", "استثمار+", "الفريق", "حسابي"],
  zh: ["首页", "矿业", "投资+", "团队", "我的"],
};

export default function BottomNav({ home = false }: { home?: boolean }) {
  const [location, navigate] = useLocation();
  const { t, lang } = useI18n();
  const items = home
    ? IELP_NAV_ITEMS.map((item, index) => ({ ...item, label: IELP_NAV_LABELS[lang][index], testId: `ielp-${index}` }))
    : NAV_ITEMS.map((item) => ({ ...item, label: t[item.labelKey] }));

  return (
    <nav
      className={`bottom-nav fixed z-50 ${home ? "bottom-nav--ielp" : "bottom-0 left-0 right-0 bg-white"}`}
      style={home ? undefined : {
        borderTop: "1px solid #eeeeee",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.04)",
      }}
      aria-label="Navigation principale"
    >
      <div className={`bottom-nav__inner mx-auto flex h-full w-full items-stretch justify-around ${home ? "" : "max-w-[480px]"}`}>
        {items.map(({ path, label, testId, Icon }) => {
          const isActive = home
            ? path === "/" ? location === "/" : location === path || location.startsWith(`${path}/`)
            : location === path;
          const color = home ? (isActive ? "#f26bc4" : "#f8f9fc") : (isActive ? TGOOD_GREEN : INACTIVE);

          return (
            <button
              key={path}
              onClick={() => {
                navigate(path);
                if (path === "/") window.dispatchEvent(new Event("home-tab-clicked"));
              }}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center active:scale-95 ${home ? "bottom-nav__item--ielp" : "gap-1"}`}
              style={{ color, transition: "color 140ms ease, transform 100ms ease" }}
              data-testid={`nav-${testId}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={28}
                strokeWidth={isActive ? 2.8 : 2.4}
                aria-hidden="true"
              />
              <span className={home ? "bottom-nav__label--ielp" : ""} style={{ fontSize: home ? 12 : 14, lineHeight: home ? 1.04 : 1.1, fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}