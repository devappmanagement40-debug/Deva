import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const ACCENT_VIOLET = "#653de9";

export default function ChangeWithdrawalPinPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const pinStatusQuery = useQuery<{ hasPin: boolean; resetRequired: boolean }>({
    queryKey: ["/api/auth/transaction-pin-status", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/auth/transaction-pin-status", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) throw new Error(t.errorOccurred);
      return response.json();
    },
    enabled: Boolean(user?.id),
    staleTime: 0,
  });

  const changePinMutation = useMutation({
    mutationFn: async (data: { currentPin: string; newPin: string }) => {
      const response = await fetch("/api/auth/transaction-pin/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(result.message || t.errorOccurred) as Error & { code?: string };
        error.code = result.code;
        throw error;
      }
      return result;
    },
    onSuccess: async () => {
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      await queryClient.invalidateQueries({
        queryKey: ["/api/auth/transaction-pin-status", user?.id],
      });
      toast({ title: t.withdrawalPinChangeSuccess });
      navigate("/account");
    },
    onError: (error: Error) => {
      const code = (error as Error & { code?: string }).code;
      if (code === "TRANSACTION_PIN_RESET_REQUIRED") {
        void pinStatusQuery.refetch();
        toast({ title: t.withdrawalPinChangeRequiresReset, variant: "destructive" });
        return;
      }
      toast({
        title: code === "INVALID_TRANSACTION_PIN"
          ? t.withdrawalPinIncorrect
          : code === "TRANSACTION_PIN_UNCHANGED"
            ? t.withdrawalPinUnchanged
            : error.message || t.errorOccurred,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentPin || !newPin || !confirmPin) {
      toast({ title: t.requiredFields, description: t.fillAllFields, variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: t.errPasswordMismatch, variant: "destructive" });
      return;
    }
    if (currentPin === newPin) {
      toast({ title: t.withdrawalPinUnchanged, variant: "destructive" });
      return;
    }
    changePinMutation.mutate({ currentPin, newPin });
  };

  if (!user) return null;
  const resetRequired = Boolean(
    pinStatusQuery.data && (!pinStatusQuery.data.hasPin || pinStatusQuery.data.resetRequired),
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#efefef]">
      <header
        className="flex items-center px-4 py-4"
        style={{ background: ACCENT_VIOLET }}
      >
        <button
          type="button"
          onClick={() => navigate("/account")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-70"
          aria-label={t.back}
          data-testid="button-back-change-withdrawal-pin"
        >
          <ChevronLeft className="h-6 w-6 text-[#653de9]" strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 pr-9 text-center text-base font-semibold text-white">
          {t.changeWithdrawalPin}
        </h1>
      </header>

      {pinStatusQuery.isLoading ? (
        <div className="mx-4 mt-5 rounded-2xl bg-white p-5 text-center text-sm text-[#626262]" role="status">
          {t.loading}
        </div>
      ) : pinStatusQuery.isError ? (
        <div className="mx-4 mt-5 rounded-2xl bg-white p-5 text-center">
          <p className="text-sm text-[#626262]">{t.errorOccurred}</p>
          <button
            type="button"
            onClick={() => void pinStatusQuery.refetch()}
            className="mt-4 font-semibold text-[#653de9]"
            data-testid="button-retry-withdrawal-pin-status"
          >
            {t.retry}
          </button>
        </div>
      ) : resetRequired ? (
        <section className="mx-4 mt-5 rounded-2xl bg-white p-5" data-testid="panel-withdrawal-pin-reset-required">
          <p className="text-sm leading-6 text-[#626262]">
            {t.withdrawalPinChangeRequiresReset}
          </p>
          <button
            type="button"
            onClick={() => navigate("/withdrawal")}
            className="mt-5 h-12 w-full rounded-full font-semibold text-white"
            style={{ background: ACCENT_VIOLET }}
            data-testid="button-open-withdrawal-pin-reset"
          >
            {t.withdrawalPinResetOpenWithdrawal}
          </button>
        </section>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mx-4 mt-5 rounded-2xl bg-white p-5" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <p className="mb-5 text-sm leading-6 text-[#626262]">
              {t.changeWithdrawalPinDescription}
            </p>

            <label htmlFor="current-withdrawal-pin" className="mb-2 block text-sm font-medium text-[#333]">
              {t.currentWithdrawalPin}
            </label>
            <input
              id="current-withdrawal-pin"
              type="password"
              autoComplete="current-password"
              value={currentPin}
              onChange={(event) => setCurrentPin(event.target.value)}
              maxLength={72}
              className="mb-5 h-[52px] w-full rounded-lg border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
              data-testid="input-current-withdrawal-pin"
            />

            <label htmlFor="new-withdrawal-pin" className="mb-2 block text-sm font-medium text-[#333]">
              {t.newWithdrawalPin}
            </label>
            <input
              id="new-withdrawal-pin"
              type="password"
              autoComplete="new-password"
              value={newPin}
              onChange={(event) => setNewPin(event.target.value)}
              maxLength={72}
              className="mb-5 h-[52px] w-full rounded-lg border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
              data-testid="input-new-withdrawal-pin"
            />

            <label htmlFor="confirm-withdrawal-pin" className="mb-2 block text-sm font-medium text-[#333]">
              {t.confirmWithdrawalPin}
            </label>
            <input
              id="confirm-withdrawal-pin"
              type="password"
              autoComplete="new-password"
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value)}
              maxLength={72}
              className="h-[52px] w-full rounded-lg border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
              data-testid="input-confirm-withdrawal-pin"
            />
          </div>

          <div className="mt-8 px-6">
            <button
              type="submit"
              disabled={changePinMutation.isPending || pinStatusQuery.isLoading}
              className="h-14 w-full rounded-full text-lg font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
              style={{ background: ACCENT_VIOLET, boxShadow: "0 4px 14px rgba(101,61,233,0.35)" }}
              data-testid="button-change-withdrawal-pin-submit"
            >
              {changePinMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.processing}
                </span>
              ) : t.confirm}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}