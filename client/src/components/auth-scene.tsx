import { LanguagePicker } from "@/components/language-picker";
import { FloatingSupport } from "@/components/floating-support";

export function AuthBrand() {
  return (
    <header className="auth-brand" aria-label="DIAMANT">
      <img className="auth-brand__logo" src="/diamant-logo-dark.png" alt="DIAMANT" />
    </header>
  );
}

export function AuthScene({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-screen">
      <LanguagePicker variant="auth" />
      <AuthBrand />
      <section className="auth-content">{children}</section>
      <FloatingSupport placement="auth" />
    </main>
  );
}