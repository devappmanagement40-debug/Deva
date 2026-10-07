import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, Loader2, LockKeyhole } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n, type Lang } from "@/lib/i18n";

const ACCENT_VIOLET = "#653de9";

const COPY: Record<Lang, {
  title: string;
  description: string;
  accountPassword: string;
  newPin: string;
  confirmPin: string;
  submit: string;
  success: string;
  required: string;
  passwordIncorrect: string;
  invalidPin: string;
  mismatch: string;
  unchanged: string;
  sameAsPassword: string;
  locked: string;
  genericError: string;
}> = {
  fr: {
    title: "Changer le PIN administrateur",
    description: "Confirme le mot de passe de ton compte et choisis un nouveau code de 4 chiffres. Ne partage pas ce code.",
    accountPassword: "Mot de passe du compte",
    newPin: "Nouveau PIN d’accès",
    confirmPin: "Confirmer le nouveau PIN",
    submit: "Enregistrer le nouveau PIN",
    success: "PIN administrateur modifié",
    required: "Renseigne le mot de passe et les deux champs PIN.",
    passwordIncorrect: "Mot de passe du compte incorrect.",
    invalidPin: "Le PIN doit contenir exactement 4 chiffres.",
    mismatch: "Les deux PIN ne correspondent pas.",
    unchanged: "Choisis un PIN différent de l’ancien.",
    sameAsPassword: "Le PIN doit être différent du mot de passe du compte.",
    locked: "Trop de tentatives. Réessaie dans quelques minutes.",
    genericError: "Impossible de modifier le PIN. Réessaie plus tard.",
  },
  en: {
    title: "Change admin access PIN",
    description: "Confirm your account password and choose a new 4-digit code. Do not share it.",
    accountPassword: "Account password",
    newPin: "New access PIN",
    confirmPin: "Confirm new PIN",
    submit: "Save new PIN",
    success: "Admin PIN changed",
    required: "Enter your account password and both PIN fields.",
    passwordIncorrect: "The account password is incorrect.",
    invalidPin: "The PIN must contain exactly 4 digits.",
    mismatch: "The PIN entries do not match.",
    unchanged: "Choose a PIN different from the current one.",
    sameAsPassword: "The PIN must be different from your account password.",
    locked: "Too many attempts. Try again in a few minutes.",
    genericError: "Could not change the PIN. Try again later.",
  },
  ar: {
    title: "تغيير رمز دخول الإدارة",
    description: "أكد كلمة مرور حسابك واختر رمزاً جديداً من 4 أرقام. لا تشاركه.",
    accountPassword: "كلمة مرور الحساب",
    newPin: "رمز الدخول الجديد",
    confirmPin: "تأكيد الرمز الجديد",
    submit: "حفظ الرمز الجديد",
    success: "تم تغيير رمز الإدارة",
    required: "أدخل كلمة مرور الحساب والرمز مرتين.",
    passwordIncorrect: "كلمة مرور الحساب غير صحيحة.",
    invalidPin: "يجب أن يتكون الرمز من 4 أرقام بالضبط.",
    mismatch: "الرمزان غير متطابقين.",
    unchanged: "اختر رمزاً مختلفاً عن الرمز الحالي.",
    sameAsPassword: "يجب أن يختلف الرمز عن كلمة مرور الحساب.",
    locked: "محاولات كثيرة. أعد المحاولة بعد بضع دقائق.",
    genericError: "تعذر تغيير الرمز. حاول مرة أخرى لاحقاً.",
  },
  zh: {
    title: "更改管理员访问 PIN",
    description: "请验证账户密码，并设置一个新的 4 位数字 PIN。请勿分享。",
    accountPassword: "账户密码",
    newPin: "新的访问 PIN",
    confirmPin: "确认新的 PIN",
    submit: "保存新的 PIN",
    success: "管理员 PIN 已更改",
    required: "请输入账户密码并填写两次 PIN。",
    passwordIncorrect: "账户密码不正确。",
    invalidPin: "PIN 必须恰好为 4 位数字。",
    mismatch: "两次输入的 PIN 不一致。",
    unchanged: "请设置一个与当前不同的 PIN。",
    sameAsPassword: "PIN 必须与账户密码不同。",
    locked: "尝试次数过多，请稍后再试。",
    genericError: "无法更改 PIN，请稍后重试。",
  },
};

type ApiError = Error & { code?: string };

export default function ChangeAdminPinPage() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const copy = COPY[lang];
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [accountPassword, setAccountPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    if (user && !user.isAdmin) navigate("/account");
  }, [user, navigate]);

  const changePinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/change-pin", {
        accountPassword,
        newPin,
        confirmPin,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error("ADMIN_PIN_CHANGE_FAILED") as ApiError;
        error.code = result.code;
        throw error;
      }
      return result;
    },
    onSuccess: () => {
      setAccountPassword("");
      setNewPin("");
      setConfirmPin("");
      toast({ title: copy.success });
      navigate("/account");
    },
    onError: (error: ApiError) => {
      const message = error.code === "INVALID_ACCOUNT_PASSWORD"
        ? copy.passwordIncorrect
        : error.code === "INVALID_ADMIN_PIN_FORMAT"
          ? copy.invalidPin
          : error.code === "ADMIN_PIN_MISMATCH"
            ? copy.mismatch
            : error.code === "ADMIN_PIN_UNCHANGED"
              ? copy.unchanged
              : error.code === "ADMIN_PIN_SAME_AS_PASSWORD"
                ? copy.sameAsPassword
                : error.code === "ADMIN_PIN_TEMPORARILY_LOCKED"
                  ? copy.locked
                  : copy.genericError;
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accountPassword || !newPin || !confirmPin) {
      toast({ title: copy.required, variant: "destructive" });
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      toast({ title: copy.invalidPin, variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: copy.mismatch, variant: "destructive" });
      return;
    }
    if (newPin === accountPassword) {
      toast({ title: copy.sameAsPassword, variant: "destructive" });
      return;
    }
    changePinMutation.mutate();
  };

  if (!user?.isAdmin) return null;

  return (
    <main className="flex min-h-screen flex-col bg-[#efefef]">
      <header className="flex items-center px-4 py-4" style={{ background: ACCENT_VIOLET }}>
        <button
          type="button"
          onClick={() => navigate("/account")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 active:opacity-70"
          aria-label={t.back}
          data-testid="button-back-change-admin-pin"
        >
          <ChevronLeft className="h-6 w-6 text-[#653de9]" strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 pr-9 text-center text-base font-semibold text-white">{copy.title}</h1>
      </header>

      <form onSubmit={handleSubmit}>
        <section
          className="mx-4 mt-5 rounded-2xl bg-white p-5"
          style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}
        >
          <p className="mb-5 text-sm leading-6 text-[#626262]">{copy.description}</p>

          <label htmlFor="admin-pin-account-password" className="mb-2 block text-sm font-medium text-[#333]">
            {copy.accountPassword}
          </label>
          <input
            id="admin-pin-account-password"
            type="password"
            autoComplete="current-password"
            value={accountPassword}
            onChange={(event) => setAccountPassword(event.target.value)}
            className="mb-5 h-[52px] w-full rounded-lg border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
            data-testid="input-admin-pin-account-password"
          />

          <label htmlFor="admin-pin-new" className="mb-2 block text-sm font-medium text-[#333]">
            {copy.newPin}
          </label>
          <input
            id="admin-pin-new"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="[0-9]{4}"
            maxLength={4}
            value={newPin}
            onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            className="mb-5 h-[52px] w-full rounded-lg border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
            data-testid="input-admin-pin-new"
          />

          <label htmlFor="admin-pin-confirm" className="mb-2 block text-sm font-medium text-[#333]">
            {copy.confirmPin}
          </label>
          <input
            id="admin-pin-confirm"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="[0-9]{4}"
            maxLength={4}
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-[52px] w-full rounded-lg border border-[#dddddd] bg-[#f9f9f9] px-3 outline-none focus:border-[#653de9]"
            data-testid="input-admin-pin-confirm"
          />
        </section>

        <div className="mt-8 px-6">
          <button
            type="submit"
            disabled={changePinMutation.isPending}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-lg font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: ACCENT_VIOLET, boxShadow: "0 4px 14px rgba(101,61,233,0.35)" }}
            data-testid="button-change-admin-pin-submit"
          >
            {changePinMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.processing}
              </>
            ) : (
              <>
                <LockKeyhole className="h-5 w-5" />
                {copy.submit}
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
