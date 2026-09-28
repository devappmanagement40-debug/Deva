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
    <header className="auth-brand" aria-label="IELP">
      <svg className="auth-brand__seal" viewBox="0 0 90 90" role="img" aria-label="Icahn Enterprises L.P.">
        <circle cx="45" cy="45" r="45" fill="#3775a8" />
        <text x="57" y="37" textAnchor="middle" className="auth-brand__seal-text">ICAHN</text>
        <text x="45" y="49" textAnchor="middle" className="auth-brand__seal-text">ENTERPRISES</text>
        <text x="61" y="61" textAnchor="middle" className="auth-brand__seal-text">L.P.</text>
      </svg>
      <div className="auth-brand__wordmark">IELP</div>
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