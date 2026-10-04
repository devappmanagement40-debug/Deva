import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { FALLBACK_COUNTRIES, fetchPublicCountries, type ApiCountry } from "@/lib/countries";
import { CountrySelector } from "@/components/country-selector";
import { DEFAULT_COUNTRY_CODE, WORLD_COUNTRIES } from "@/lib/world-countries";
import { useI18n } from "@/lib/i18n";
import { setAppLoading } from "@/components/navigation-loader";
import { AuthScene } from "@/components/auth-scene";

const REMEMBERED_PHONE_KEY = "ielp-auth-phone";
const REMEMBERED_COUNTRY_KEY = "ielp-auth-country";

function readRememberedLogin() {
  try {
    return {
      phone: window.localStorage.getItem(REMEMBERED_PHONE_KEY) || "",
      country: window.localStorage.getItem(REMEMBERED_COUNTRY_KEY) || DEFAULT_COUNTRY_CODE,
    };
  } catch {
    return { phone: "", country: DEFAULT_COUNTRY_CODE };
  }
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedLogin] = useState(readRememberedLogin);
  const [rememberMe, setRememberMe] = useState(Boolean(savedLogin.phone));
  const countryTriggerRef = useRef<HTMLButtonElement>(null);

  const loginSchema = z.object({
    phone: z.string().min(8, t.errInvalidPhone),
    country: z.string().min(2, t.selectCountry),
    password: z.string().min(1, t.errPasswordRequired),
  });
  type LoginForm = z.infer<typeof loginSchema>;
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: savedLogin.phone, country: savedLogin.country, password: "" },
  });
  const { data: apiCountries = [] } = useQuery<ApiCountry[]>({
    queryKey: ["/api/countries"],
    queryFn: fetchPublicCountries,
    retry: false,
  });
  const selectedCountry = form.watch("country");
  const countryData = apiCountries.find(country => country.code === selectedCountry && country.isActive)
    ?? WORLD_COUNTRIES.find(country => country.code === selectedCountry)
    ?? FALLBACK_COUNTRIES.find(country => country.code === selectedCountry);
  const countryLocale = lang === "zh" ? "zh-CN" : lang === "ar" ? "ar" : lang === "en" ? "en-US" : "fr-FR";
  const countryName = countryData?.code && typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames([countryLocale], { type: "region" }).of(countryData.code)
    : countryData?.name;

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setAppLoading(true);
    try {
      await login(data.phone, data.country, data.password);
      try {
        if (rememberMe) {
          window.localStorage.setItem(REMEMBERED_PHONE_KEY, data.phone);
          window.localStorage.setItem(REMEMBERED_COUNTRY_KEY, data.country);
        } else {
          window.localStorage.removeItem(REMEMBERED_PHONE_KEY);
          window.localStorage.removeItem(REMEMBERED_COUNTRY_KEY);
        }
      } catch {
        // Continue the successful sign-in if browser storage is unavailable.
      }
      navigate("/");
    } catch (error: any) {
      toast({ title: error.message || t.errLoginFailed, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setAppLoading(false);
    }
  }

  return (
    <AuthScene>
      <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form auth-login-form" noValidate>
        <input type="hidden" {...form.register("country")} />
        <div className="auth-input">
          <button
            ref={countryTriggerRef}
            type="button"
            onClick={() => setCountryModalOpen(true)}
            className="auth-country-trigger"
            aria-label={`${t.selectCountry}: ${countryName || countryData?.name || "United States"}, +${countryData?.phonePrefix || "1"}`}
            aria-haspopup="dialog"
            aria-expanded={countryModalOpen}
            data-testid="button-select-country"
          >
            +{countryData?.phonePrefix || "1"}
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
            autoComplete="current-password"
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

        <label className="auth-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={event => setRememberMe(event.target.checked)}
            data-testid="checkbox-remember-me"
          />
          <span className="auth-remember__check" aria-hidden="true" />
          <span>{t.authRememberMe}</span>
        </label>

        <button type="submit" disabled={isLoading} className="auth-submit" data-testid="button-login">
          {isLoading ? t.loginLoading : t.loginBtn}
        </button>
      </form>

      <div className="auth-account-switch">
        <span>{t.authNoAccountPrompt}</span>
        <button type="button" onClick={() => navigate("/register")} data-testid="link-register">
          {t.registerBtn}
        </button>
      </div>
      <CountrySelector
        open={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={code => form.setValue("country", code, { shouldValidate: true })}
        selectedCode={selectedCountry}
        apiCountries={apiCountries}
        triggerRef={countryTriggerRef}
      />
    </AuthScene>
  );
}