import { useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { CountrySelector } from "@/components/country-selector";
import { useI18n } from "@/lib/i18n";
import { setAppLoading } from "@/components/navigation-loader";
import { AuthScene } from "@/components/auth-scene";
import {
  AUTH_COUNTRIES,
  DEFAULT_AUTH_COUNTRY_CODE,
  isAuthCountryCode,
} from "@shared/auth-countries";

interface CaptchaResponse {
  image: string;
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { register } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const countryTriggerRef = useRef<HTMLButtonElement>(null);
  const searchParams = new URLSearchParams(searchString);
  const refCode = (
    searchParams.get("ref")
    || searchParams.get("invite_code")
    || searchParams.get("money")
    || searchParams.get("reg")
    || ""
  ).trim().toUpperCase();

  const registerSchema = z.object({
    phone: z.string().min(8, t.errInvalidPhone),
    country: z.string().refine(isAuthCountryCode, t.selectCountry),
    password: z.string().min(6, t.errMinPassword),
    confirmPassword: z.string().min(1, t.errConfirmPassword),
    transactionPassword: z.string().min(1, t.errTransactionPasswordRequired),
    invitationCode: z.string().optional(),
    captchaCode: z.string().trim().min(1, t.authCaptchaRequired),
  }).superRefine((data, context) => {
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: t.errPasswordMismatch,
      });
    }
  });
  type RegisterForm = z.infer<typeof registerSchema>;
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: "",
      country: DEFAULT_AUTH_COUNTRY_CODE,
      password: "",
      confirmPassword: "",
      transactionPassword: "",
      invitationCode: refCode,
      captchaCode: "",
    },
  });
  const { data: captcha, refetch: refreshCaptcha } = useQuery<CaptchaResponse>({
    queryKey: ["/api/auth/captcha"],
    queryFn: async () => {
      const response = await fetch("/api/auth/captcha", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Impossible de charger le code de vérification");
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const selectedCountry = form.watch("country");
  const countryData = AUTH_COUNTRIES.find(country => country.code === selectedCountry)
    ?? AUTH_COUNTRIES[0];
  const countryLocale = lang === "zh" ? "zh-CN" : lang === "ar" ? "ar" : lang === "en" ? "en-US" : "fr-FR";
  const countryName = countryData?.code && typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames([countryLocale], { type: "region" }).of(countryData.code)
    : countryData?.name;

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    setAppLoading(true);
    try {
      await register({
        fullName: `User_${data.phone}`,
        phone: data.phone,
        country: data.country,
        password: data.password,
        transactionPassword: data.transactionPassword,
        invitationCode: data.invitationCode,
        captchaCode: data.captchaCode,
      });
      toast({ title: t.successRegister, description: t.welcomeMsg });
      navigate("/");
    } catch (error: any) {
      void refreshCaptcha();
      toast({ title: error.message || t.errRegisterFailed, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setAppLoading(false);
    }
  }

  return (
    <AuthScene>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form auth-register-form" noValidate>
        <input type="hidden" {...form.register("country")} />
        <div className="auth-input">
          <button
            ref={countryTriggerRef}
            type="button"
            onClick={() => setCountryModalOpen(true)}
            className="auth-country-trigger"
            aria-label={`${t.selectCountry}: ${countryName || countryData.name}, +${countryData.phonePrefix}`}
            aria-haspopup="dialog"
            aria-expanded={countryModalOpen}
            data-testid="button-select-country"
          >
            +{countryData.phonePrefix}
          </button>
          <input
            {...form.register("phone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            aria-label={t.authPhoneLabel}
            placeholder={t.authPhoneLabel}
            data-testid="input-phone"
          />
        </div>
        {form.formState.errors.phone && <p className="auth-form-error" role="alert">{form.formState.errors.phone.message}</p>}

        <div className="auth-input">
          <input
            {...form.register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-label={t.authPasswordLabel}
            placeholder={t.authPasswordLabel}
            data-testid="input-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(value => !value)}
            className="auth-reveal-button"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
          </button>
        </div>
        {form.formState.errors.password && <p className="auth-form-error" role="alert">{form.formState.errors.password.message}</p>}

        <div className="auth-input">
          <input
            {...form.register("confirmPassword")}
            type="password"
            autoComplete="new-password"
            aria-label={t.repeatPassword}
            placeholder={t.repeatPassword}
            data-testid="input-confirm-password"
          />
        </div>
        {form.formState.errors.confirmPassword && <p className="auth-form-error" role="alert">{form.formState.errors.confirmPassword.message}</p>}

        <div className="auth-input">
          <input
            {...form.register("transactionPassword")}
            type={showPin ? "text" : "password"}
            autoComplete="new-password"
            aria-label={t.authPinLabel}
            placeholder={t.authPinLabel}
            data-testid="input-transaction-password"
          />
          <button
            type="button"
            onClick={() => setShowPin(value => !value)}
            className="auth-reveal-button"
            aria-label={showPin ? "Masquer le code PIN" : "Afficher le code PIN"}
            aria-pressed={showPin}
          >
            {showPin ? <EyeOff size={21} /> : <Eye size={21} />}
          </button>
        </div>
        {form.formState.errors.transactionPassword && <p className="auth-form-error" role="alert">{form.formState.errors.transactionPassword.message}</p>}

        <div className="auth-input">
          <input
            {...form.register("invitationCode")}
            type="text"
            autoComplete="off"
            aria-label={t.referralCode}
            placeholder={t.invitationCodePlaceholder}
            data-testid="input-invitation-code"
          />
        </div>

        <div className="auth-captcha-field">
          <input
            {...form.register("captchaCode")}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label={t.authCaptchaLabel}
            placeholder={t.authCaptchaLabel}
            data-testid="input-captcha"
          />
          <button
            type="button"
            className="auth-captcha-image"
            onClick={() => void refreshCaptcha()}
            aria-label="Actualiser le code de vérification"
            data-testid="button-refresh-captcha"
          >
            {captcha?.image && <img src={captcha.image} alt="Code de vérification visuel" />}
          </button>
        </div>
        {form.formState.errors.captchaCode && <p className="auth-form-error" role="alert">{form.formState.errors.captchaCode.message}</p>}

        <button type="submit" disabled={isLoading} className="auth-submit" data-testid="button-register">
          {isLoading ? t.registerLoading : t.registerBtn}
        </button>
      </form>

      <div className="auth-account-switch">
        <span>{t.authHasAccountPrompt}</span>
        <button type="button" onClick={() => navigate("/login")} data-testid="link-login">
          {t.loginBtn}
        </button>
      </div>
      <CountrySelector
        open={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={code => form.setValue("country", code, { shouldValidate: true })}
        selectedCode={selectedCountry}
        triggerRef={countryTriggerRef}
      />
    </AuthScene>
  );
}