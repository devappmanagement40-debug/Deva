import { useLocation } from "wouter";
import { House, WalletCards, UsersRound, UserRound, type LucideIcon } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";

const MEMBER_NAV_ACTIVE = "#b7a8ff";
const INACTIVE = "rgba(243, 243, 255, .78)";

const NAV_ITEMS: {
  path: string;
  labelKey: "home" | "team" | "me";
  testId: string;
  Icon: LucideIcon;
}[] = [
  { path: "/", labelKey: "home", testId: "home", Icon: House },
  { path: "/invest", labelKey: "home", testId: "invest", Icon: WalletCards },
  { path: "/team", labelKey: "team", testId: "team", Icon: UsersRound },
  { path: "/account", labelKey: "me", testId: "me", Icon: UserRound },
];

const INVEST_LABELS: Record<Lang, string> = {
  fr: "Investir",
  en: "Invest",
  ar: "استثمر",
  zh: "投资",
};

export default function BottomNav({ home = false }: { home?: boolean }) {
  const [location, navigate] = useLocation();
  const { t, lang } = useI18n();
  const items = NAV_ITEMS.map((item) => ({
    ...item,
    label: item.path === "/invest" ? INVEST_LABELS[lang] : t[item.labelKey],
  }));

  return (
    <nav
      className={`bottom-nav fixed z-50 ${home ? "bottom-nav--ielp" : "bottom-0 left-0 right-0 bg-white"}`}
      aria-label={lang === "en" ? "Main navigation" : lang === "ar" ? "التنقل الرئيسي" : lang === "zh" ? "主导航" : "Navigation principale"}
    >
      <div className={`bottom-nav__inner mx-auto flex h-full w-full items-stretch justify-around ${home ? "" : "max-w-[480px]"}`}>
        {items.map(({ path, label, testId, Icon }) => {
          const isActive = path === "/" ? location === "/" : location === path || location.startsWith(`${path}/`);
          const color = isActive ? MEMBER_NAV_ACTIVE : INACTIVE;

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
                size={25}
                strokeWidth={isActive ? 2.4 : 1.9}
                aria-hidden="true"
              />
              <span className={home ? "bottom-nav__label--ielp" : ""} style={{ fontSize: home ? 12 : 14, lineHeight: home ? 1.04 : 1.1, fontWeight: isActive ? 650 : 450 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}