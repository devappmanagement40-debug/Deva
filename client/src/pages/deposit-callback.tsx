import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { CheckCircle, Loader2, XCircle, Headphones } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function DepositCallbackPage() {
  const { refreshUser } = useAuth();
  const { t } = useI18n();

  const { id: depositId } = useParams<{ id: string }>();

  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = new URLSearchParams(search);
  const callbackStatus = params.get("status");
  const ref = params.get("ref");

  const [depositStatus, setDepositStatus] = useState<
    "polling" | "approved" | "rejected" | "timeout"
  >("polling");

  useEffect(() => {
    if (!depositId) return;

    if (callbackStatus === "failed" || callbackStatus === "failure") {
      setDepositStatus("rejected");
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/deposits/${depositId}/verify`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "approved") {
            setDepositStatus("approved");
            refreshUser();
            return;
          }
          if (data.status === "rejected") {
            setDepositStatus("rejected");
            return;
          }
        }
      } catch {
        // network error — keep polling
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        setDepositStatus("timeout");
        return;
      }
      timer = setTimeout(poll, 5000);
    };

    timer = setTimeout(poll, 2000);
    return () => clearTimeout(timer);
  }, [depositId, callbackStatus]);

  /* ── Success ── */
  if (depositStatus === "approved") {
    return (
      <Screen>
        <CheckCircle className="mx-auto h-16 w-16 text-[#36d399]" />
        <h1 className="text-xl font-bold text-white">{t.depositSuccessTitle}</h1>
        <p className="text-sm text-white/75">{t.depositSuccessDesc}</p>
        {ref && (
          <p className="break-all rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs text-white/75">
            {t.depositRefLabel} {ref}
          </p>
        )}
        <Link href="/deposit-history">
          <button
            className="w-full min-h-[52px] rounded-xl bg-gradient-to-r from-[#6947f5] to-[#7b36ed] px-4 py-3.5 text-center font-bold leading-5 text-white shadow-[0_5px_15px_rgba(40,20,120,.4)] transition hover:brightness-110"
          >
            {t.depositViewHistory}
          </button>
        </Link>
        <Link href="/">
          <button className="w-full min-h-[48px] rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium leading-5 text-white/85 transition hover:bg-white/10">
            {t.depositGoHome}
          </button>
        </Link>
      </Screen>
    );
  }

  /* ── Failure ── */
  if (depositStatus === "rejected") {
    return (
      <Screen>
        <XCircle className="mx-auto h-16 w-16 text-[#ff6b6b]" />
        <h1 className="text-xl font-bold text-white">{t.depositFailTitle}</h1>
        <p className="text-sm text-white/75">{t.depositFailDesc}</p>
        <Link href="/deposit">
          <button
            className="w-full min-h-[52px] rounded-xl bg-gradient-to-r from-[#6947f5] to-[#7b36ed] px-4 py-3.5 text-center font-bold leading-5 text-white shadow-[0_5px_15px_rgba(40,20,120,.4)] transition hover:brightness-110"
          >
            {t.depositRetry}
          </button>
        </Link>
        <Link href="/">
          <button className="w-full min-h-[48px] rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium leading-5 text-white/85 transition hover:bg-white/10">
            {t.depositGoHome}
          </button>
        </Link>
      </Screen>
    );
  }

  /* ── Timeout ── */
  if (depositStatus === "timeout") {
    return (
      <Screen>
        <Headphones className="mx-auto h-16 w-16 text-[#59a5ff]" />
        <h1 className="text-xl font-bold text-white">{t.depositPendingTitle}</h1>
        <p className="text-sm text-white/75">{t.depositPendingDesc}</p>
        {ref && (
          <p className="break-all rounded-lg bg-white/10 px-3 py-1.5 font-mono text-xs text-white/75">
            {t.depositRefLabel} {ref}
          </p>
        )}
        <Link href="/service">
          <button
            className="w-full min-h-[52px] rounded-xl bg-gradient-to-r from-[#6947f5] to-[#7b36ed] px-4 py-3.5 text-center font-bold leading-5 text-white shadow-[0_5px_15px_rgba(40,20,120,.4)] transition hover:brightness-110"
          >
            {t.depositContactSupport}
          </button>
        </Link>
        <Link href="/">
          <button className="w-full min-h-[48px] rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-medium leading-5 text-white/85 transition hover:bg-white/10">
            {t.depositGoHome}
          </button>
        </Link>
      </Screen>
    );
  }

  /* ── Polling / Loading ── */
  return (
    <Screen>
      <h1 className="text-xl font-bold text-white">{t.depositVerifyingTitle}</h1>
      <p className="text-sm text-white/75">{t.depositVerifyingDesc}</p>
      <div className="flex min-h-12 items-center justify-center" role="status" aria-label={t.depositVerifyingTitle}>
        <Loader2 className="h-8 w-8 animate-spin text-[#59a5ff]" aria-hidden="true" />
      </div>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen min-h-[100svh] flex-col items-center justify-center px-4 py-6"
      style={{ background: "linear-gradient(180deg, #050923 0%, #07113a 52%, #07518a 100%)" }}
    >
      <div className="flex min-h-[400px] w-full max-w-sm flex-col justify-center space-y-5 rounded-[22px] border border-white/15 bg-gradient-to-b from-[#242d55] to-[#1e5b91] p-6 text-center shadow-[0_10px_28px_rgba(1,5,25,.3)]">
        {children}
      </div>
    </div>
  );
}
