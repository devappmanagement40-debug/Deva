import { Switch, Route, useLocation, Redirect, Router } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { getSearchFromLocation, internalPathFromLocation, toIndexPath } from "@/lib/opaque-routes";

// Use readable /index/... page URLs instead of hash-based navigation.
function useIndexPath(_opts?: object): [string, (to: string, opts?: object) => void] {
  const getPath = () => internalPathFromLocation(window.location);
  const [loc, setLoc] = useState(getPath);
  useEffect(() => {
    const handler = () => setLoc(getPath());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  const navigate = useCallback((to: string, opts?: any) => {
    const method = opts?.replace ? "replaceState" : "pushState";
    history[method](opts?.state ?? null, "", toIndexPath(to));
    window.dispatchEvent(new PopStateEvent("popstate", { state: opts?.state ?? null }));
  }, []);
  return [loc, navigate];
}
// Expose readable /index/... URLs to <Link> and <Redirect>.
(useIndexPath as any).hrefs = (href: string) => toIndexPath(href);

// Read query parameters from the page URL or the public root invitation URL.
function useIndexSearch(_opts?: object): string {
  const getSearch = () => getSearchFromLocation(window.location);
  const [search, setSearch] = useState(getSearch);
  useEffect(() => {
    const handler = () => setSearch(getSearch());
    window.addEventListener("hashchange", handler);
    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("hashchange", handler);
      window.removeEventListener("popstate", handler);
    };
  }, []);
  return search;
}
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import BottomNav from "@/components/bottom-nav";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HomePage from "@/pages/ielp-home";
import TasksPage from "@/pages/tasks";
import InvestPage from "@/pages/invest";
import ProductsPage from "@/pages/products";
import OrdersPage from "@/pages/orders";
import TeamPage from "@/pages/team";
import ShareInformationPage from "@/pages/share-information";
import WithdrawalProofsPage from "@/pages/withdrawal-proofs";
import AccountPage from "@/pages/account";
import AdminPage from "@/pages/admin";
import AdminTeamPage from "@/pages/admin-team";
import BankerPage from "@/pages/banker";
import DepositPage from "@/pages/deposit";
import WithdrawalPage from "@/pages/withdrawal";
import DepositHistoryPage from "@/pages/deposit-history";
import DepositsHistoryPage from "@/pages/deposit-history-real";
import HistoryPage from "@/pages/history";
import ServicePage from "@/pages/service";
import SupportChatPage from "@/components/support-chat/SupportChatPage";
import WalletPage from "@/pages/wallet";
import ChangePasswordPage from "@/pages/change-password";
import ChangeWithdrawalPinPage from "@/pages/change-withdrawal-pin";
import ChangeAdminPinPage from "@/pages/change-admin-pin";
import AboutPage from "@/pages/about";
import RulesPage from "@/pages/rules";
import GiftCodePage from "@/pages/gift-code";
import TeamDetailsPage from "@/pages/team-details";
import MembersPage from "@/pages/members";
import EarningsPage from "@/pages/earnings";
import CheckinPage from "@/pages/checkin";
import WithdrawalHistoryPage from "@/pages/withdrawal-history";
import DepositOrdersPage from "@/pages/deposit-orders";
import DepositCallbackPage from "@/pages/deposit-callback";
import SalaryBonusPage from "@/pages/salary-bonus";
import NewsDetailPage from "@/pages/news-article";
import SpinWheelPage from "@/pages/spin-wheel";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import NavigationLoader from "@/components/navigation-loader";
import "./ielp-member-theme.css";

function BannedMessage() {
  const { t } = useI18n();
  return (
    <>
      <h1 className="text-2xl font-bold text-destructive mb-2">{t.accountSuspended}</h1>
      <p className="text-muted-foreground">{t.accountSuspendedDesc}</p>
    </>
  );
}

/** Spinner de chargement unifié */
function AuthLoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#f4f7f5",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", zIndex: 9999,
    }}>
      <div style={{
        width: 136, height: 136, borderRadius: 9,
        background: "#000000",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
      }}>
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none"
          style={{ animation: "diamant-spin 0.8s linear infinite" }}>
          <circle cx="19" cy="19" r="15" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
          <path d="M19 4 A15 15 0 0 1 34 19" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      <style>{`@keyframes diamant-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <BannedMessage />
        </div>
      </div>
    );
  }

  if ((user as any).isBanker && !user.isAdmin && location !== "/banker") {
    return <Redirect to="/banker" />;
  }

  return <>{children}</>;
}

function BankerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;

  if (!user) return <Redirect to="/login" />;
  if (!(user as any).isBanker && !user.isAdmin) return <Redirect to="/" />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;

  if (!user || !user.isAdmin) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;

  if (user) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function AppLayout({ children, home = false, productListScroll = false }: { children: React.ReactNode; home?: boolean; productListScroll?: boolean }) {
  return (
    <div className={`app-shell min-h-screen ${home ? "ielp-home-app-shell" : "bg-background pb-2"} ${productListScroll ? "diamant-invest-app-shell" : ""}`}>
      {children}
      <BottomNav home={home} />
    </div>
  );
}

function RouterComponent() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.split("?")[0] || "/";
    const outsideScope =
      path === "/banker" ||
      path.startsWith("/banker/") ||
      path === "/admin" ||
      path.startsWith("/admin/");
    const fullIelpIdentity = new Set([
      "/login",
      "/register",
      "/invitation",
      "/rejoindre",
      "/",
      "/invest",
      "/team",
      "/account",
      "/service",
    ]).has(path);
    const enabled = !outsideScope && !fullIelpIdentity;

    document.documentElement.classList.toggle("ielp-route-theme", enabled);
    document.body.classList.toggle("ielp-route-theme", enabled);
    return () => {
      document.documentElement.classList.remove("ielp-route-theme");
      document.body.classList.remove("ielp-route-theme");
    };
  }, [location]);

  useEffect(() => {
    const viewport = document.querySelector<HTMLElement>(".diamant-route-viewport");
    if (viewport) viewport.scrollTop = 0;
  }, [location]);

  return (
    <div className="diamant-route-viewport">
      <Switch>
        <Route path="/login">
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        </Route>
        <Route path="/register">
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        </Route>
        <Route path="/invitation">
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        </Route>
        <Route path="/rejoindre">
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        </Route>
        <Route path="/">
          <ProtectedRoute>
            <AppLayout home>
              <HomePage />
            </AppLayout>
          </ProtectedRoute>
        </Route>
      <Route path="/tasks">
        <ProtectedRoute>
          <AppLayout>
            <TasksPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/checkin">
        <ProtectedRoute>
          <CheckinPage />
        </ProtectedRoute>
      </Route>
      <Route path="/invest">
        <ProtectedRoute>
          <AppLayout home productListScroll>
            <ProductsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute>
          <AppLayout>
            <OrdersPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/team">
        <ProtectedRoute>
          <AppLayout home>
            <TeamPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/share-information">
        <ProtectedRoute>
          <ShareInformationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/withdrawal-proofs">
        <ProtectedRoute>
          <AppLayout>
            <WithdrawalProofsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/my-products">
        <Redirect to="/orders" />
      </Route>
      <Route path="/earnings">
        <ProtectedRoute>
          <AppLayout>
            <EarningsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/account">
        <ProtectedRoute>
          <AppLayout home>
            <AccountPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deposit">
        <ProtectedRoute>
          <DepositPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-issue">
        <ProtectedRoute>
          <DepositPage startInIssue />
        </ProtectedRoute>
      </Route>
      <Route path="/withdrawal">
        <ProtectedRoute>
          <WithdrawalPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-history">
        <ProtectedRoute>
          <DepositHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposits-history">
        <ProtectedRoute>
          <DepositsHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/withdrawal-history">
        <ProtectedRoute>
          <WithdrawalHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-orders">
        <ProtectedRoute>
          <DepositOrdersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-callback/:id">
        <ProtectedRoute>
          <DepositCallbackPage />
        </ProtectedRoute>
      </Route>
      <Route path="/service">
        <ServicePage />
      </Route>
      <Route path="/support-chat">
        <ProtectedRoute>
          <SupportChatPage />
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute>
          <WalletPage />
        </ProtectedRoute>
      </Route>
      <Route path="/change-password">
        <ProtectedRoute>
          <ChangePasswordPage />
        </ProtectedRoute>
      </Route>
      <Route path="/change-withdrawal-pin">
        <ProtectedRoute>
          <ChangeWithdrawalPinPage />
        </ProtectedRoute>
      </Route>
      <Route path="/change-admin-pin">
        <ProtectedRoute>
          <ChangeAdminPinPage />
        </ProtectedRoute>
      </Route>
      <Route path="/about">
        <ProtectedRoute>
          <AboutPage />
        </ProtectedRoute>
      </Route>
      <Route path="/rules">
        <ProtectedRoute>
          <RulesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/gift-code">
        <ProtectedRoute>
          <GiftCodePage />
        </ProtectedRoute>
      </Route>
      <Route path="/team-details/:level">
        <ProtectedRoute>
          <TeamDetailsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/team-details">
        <ProtectedRoute>
          <TeamDetailsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/members">
        <ProtectedRoute>
          <MembersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/salary-bonus">
        <ProtectedRoute>
          <AppLayout>
            <SalaryBonusPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/spin-wheel">
        <ProtectedRoute>
          <SpinWheelPage />
        </ProtectedRoute>
      </Route>
      <Route path="/news/:id">
        <ProtectedRoute>
          <AppLayout>
            <NewsDetailPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      </Route>
      <Route path="/admin/team/:id">
        <AdminRoute>
          <AdminTeamPage />
        </AdminRoute>
      </Route>
      <Route path="/banker">
        <BankerRoute>
          <BankerPage />
        </BankerRoute>
      </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router hook={useIndexPath} searchHook={useIndexSearch}>
              <RouterComponent />
            </Router>
            <NavigationLoader />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
