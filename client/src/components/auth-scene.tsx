import { useQuery } from "@tanstack/react-query";
import { MessageCircleMore } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";
import { FloatingSupport } from "@/components/floating-support";

interface SupportLinks {
  supportLink?: string;
  support2Link?: string;
  floatingSupportTarget?: string;
}

export function AuthBrand() {
  return (
    <header className="auth-brand" aria-label="DIAMANT">
      <img className="auth-brand__logo" src="/diamant-logo-dark.png" alt="DIAMANT" />
    </header>
  );
}

export function AuthScene({
  children,
  showChatButton = false,
}: {
  children: React.ReactNode;
  showChatButton?: boolean;
}) {
  const { t } = useI18n();
  const { data: support } = useQuery<SupportLinks>({
    queryKey: ["/api/settings/links"],
    staleTime: 5 * 60 * 1000,
  });
  const supportLink = support?.floatingSupportTarget === "support2"
    ? support.support2Link
    : support?.supportLink;

  return (
    <main className="auth-screen">
      <LanguagePicker variant="auth" />
      <AuthBrand />
      <section className="auth-content">{children}</section>
      <FloatingSupport placement="auth" />
      {showChatButton && (
        <button
          type="button"
          className="auth-chat-button"
          aria-label={t.customerService}
          onClick={() => {
            if (supportLink) window.open(supportLink, "_blank", "noopener,noreferrer");
          }}
        >
          <MessageCircleMore size={34} strokeWidth={2.7} aria-hidden="true" />
        </button>
      )}
    </main>
  );
}