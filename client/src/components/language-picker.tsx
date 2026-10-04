import { Check, ChevronDown, Globe2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";

interface LanguagePickerProps {
  global?: boolean;
  variant?: "default" | "auth" | "home";
}

export function LanguagePicker({ global = false, variant = "default" }: LanguagePickerProps) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedLanguage = LANGUAGES.find((language) => language.code === lang) ?? LANGUAGES[0];
  const selectedLabel = lang === "fr" ? "sélectionné" : lang === "ar" ? "محدد" : lang === "zh" ? "已选" : "selected";

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
        ?.focus();
    });
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [close, open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={t.languageLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center justify-center ${variant !== "default" ? "gap-2" : "gap-0.5"} ${global ? "fixed z-[60]" : ""}`}
        style={variant === "auth"
          ? {
              position: "absolute",
              zIndex: 60,
              top: 5,
              right: 14,
              minWidth: 110,
              height: 37,
              padding: "0 10px",
              borderRadius: 999,
              color: "#fff",
              background: "rgba(4, 10, 30, .62)",
              border: "1px solid rgba(255,255,255,.12)",
              boxShadow: "none",
            }
          : variant === "home"
          ? {
              position: "relative",
              minWidth: 106,
              height: 37,
              padding: "0 10px",
              borderRadius: 999,
              color: "#fff",
              background: "rgba(2, 10, 39, .42)",
              border: "1px solid rgba(255,255,255,.12)",
              boxShadow: "none",
            }
          : global
          ? {
              top: 12,
              right: "max(12px, calc((100vw - 480px) / 2 + 16px))",
              minWidth: 48,
              height: 42,
              padding: "0 7px",
              borderRadius: 999,
              background: "rgba(255,255,255,.94)",
              border: "1px solid rgba(0,0,0,.09)",
              boxShadow: "0 4px 14px rgba(0,0,0,.18)",
            }
          : {
              width: 42,
              height: 42,
              borderRadius: 999,
              background: "rgba(255,255,255,.94)",
              border: "1px solid rgba(0,0,0,.09)",
            }}
      >
        {variant !== "default" ? (
          <>
            <Globe2 size={19} color="white" strokeWidth={2.1} aria-hidden="true" />
            <span className="text-[16px] font-normal text-white">{selectedLanguage.nativeName}</span>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-[19px] leading-none">{selectedLanguage.flag}</span>
            <ChevronDown size={14} color="#087a38" strokeWidth={2.4} />
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/50" onMouseDown={close}>
          <div
            ref={panelRef}
            role="menu"
            aria-label={t.languageLabel}
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const focusable = Array.from(
                panelRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") || [],
              );
              if (!focusable.length) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
            className="absolute w-[min(250px,calc(100vw-24px))] overflow-hidden border-[2px] border-[#111] bg-[#f9fafb] font-sans text-[#354e5c] shadow-[0_12px_30px_rgba(0,0,0,.35)] outline-none"
            style={{
              top: variant === "home" ? 56 : 62,
              right: "max(12px, calc((100vw - 480px) / 2 + 16px))",
              borderRadius: 14,
              maxHeight: "calc(100vh - 76px)",
              fontFamily: "Arial, Roboto, sans-serif",
            }}
          >
            <div className="flex h-[54px] items-center justify-between border-b-2 border-[#111] bg-[#f9fafb] px-4">
              <div className="flex items-center gap-2 text-[#354e5c]">
                <Globe2 size={21} color="#5d6064" />
                <span className="text-[18px] font-normal">{t.languageLabel}</span>
              </div>
              <button type="button" onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full text-[#5d6064] hover:bg-[#eeeeee]" aria-label={t.cancel}>
                <X size={20} />
              </button>
            </div>
            <div role="listbox" aria-label={t.languageLabel}>
              {LANGUAGES.map((language, index) => {
                const isSelected = language.code === lang;
                return (
                  <button
                    key={language.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setLang(language.code as Lang);
                      close();
                    }}
                    className="flex h-[58px] w-full items-center justify-between px-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#222] focus-visible:outline-offset-[-2px]"
                    style={{
                      borderBottom: index < LANGUAGES.length - 1 ? "1px solid #d1d5db" : "none",
                      background: isSelected ? "#eeeeee" : "transparent",
                      color: "#354e5c",
                      fontFamily: "Arial, Roboto, sans-serif",
                      fontSize: 18,
                      fontWeight: 400,
                    }}
                    data-testid={`language-option-${language.code}`}
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center text-[23px] leading-none">
                        {language.flag}
                      </span>
                      <span className="text-[18px] font-normal text-[#354e5c]">{language.nativeName}</span>
                    </span>
                    {isSelected && <Check size={22} strokeWidth={2.7} color="#666" aria-label={`${language.nativeName} ${selectedLabel}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
