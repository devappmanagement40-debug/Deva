import { useEffect, useRef, useState, type RefObject } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CountryOption } from "@/lib/countries";

interface CountrySelectorProps {
  countries: CountryOption[];
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
  selectedCode?: string;
  triggerRef?: RefObject<HTMLButtonElement | null>;
}

export function CountrySelector({
  countries,
  open,
  onClose,
  onSelect,
  selectedCode,
  triggerRef,
}: CountrySelectorProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        requestAnimationFrame(() => triggerRef?.current?.focus());
        wasOpen.current = false;
      }
      return;
    }
    wasOpen.current = true;
    setSearch("");
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", keyHandler);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      dialogRef.current
        ?.querySelector<HTMLElement>('[aria-selected="true"]')
        ?.scrollIntoView({ block: "center" });
    });
    return () => {
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose, triggerRef]);

  const normalizedSearch = search
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const visibleCountries = countries.filter((country) => {
    if (!normalizedSearch) return true;
    const searchable = `${country.name} ${country.code} ${country.phonePrefix}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return searchable.includes(normalizedSearch);
  });

  if (!open) return null;

  const moveOptionFocus = (direction: 1 | -1) => {
    const options = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') || [],
    );
    if (options.length === 0) return;
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = currentIndex === -1
      ? (direction > 0 ? 0 : options.length - 1)
      : (currentIndex + direction + options.length) % options.length;
    options[nextIndex]?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onMouseDown={onClose}
    >
      <div
        ref={dialogRef}
        className="fixed inset-x-[8.2%] top-[82px] bottom-[11vh] overflow-hidden bg-[#f9fafb] shadow-[0_12px_30px_rgba(0,0,0,.35)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-selector-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveOptionFocus(1);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveOptionFocus(-1);
          }
          if (event.key === "Tab") {
            const focusable = Array.from(
              dialogRef.current?.querySelectorAll<HTMLElement>(
                'input:not([disabled]), button:not([disabled])',
              ) || [],
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <h2 id="country-selector-title" className="sr-only">{t.selectCountry}</h2>
        <div className="absolute inset-x-0 top-0 z-10 h-[56px] border-[2px] border-[#111] bg-[#f9fafb] px-[14px] shadow-[0_2px_4px_rgba(0,0,0,.08)]">
          <label className="flex h-full items-center gap-3">
            <Search size={25} strokeWidth={3} className="shrink-0 text-[#5d6064]" aria-hidden="true" />
            <span className="sr-only">Rechercher un pays ou un indicatif</span>
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#364e5c] outline-none placeholder:text-[#aab2bb]"
              aria-label="Rechercher un pays ou un indicatif"
              data-testid="input-country-search"
            />
          </label>
        </div>

        <div className="h-full overflow-y-auto pb-2 pt-[56px]" role="listbox" aria-label="Liste des pays" data-testid="country-list">
          {visibleCountries.map((country) => {
            const isSelected = country.code === selectedCode;
            return (
              <button
                key={country.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={`${country.name}, +${country.phonePrefix}`}
                onClick={() => {
                  onSelect(country.code);
                  onClose();
                }}
                className="flex h-[53px] w-full items-center justify-between px-[14px] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#222] focus-visible:outline-offset-[-2px]"
                style={{
                  background: isSelected ? "#eeeeee" : "transparent",
                  color: "#354e5c",
                  fontSize: 18,
                }}
                data-testid={`country-option-${country.code}`}
              >
                  <span>{country.name} (+{country.phonePrefix})</span>
                {isSelected && (
                  <CheckCircle2
                    size={21}
                    className="shrink-0 text-[#666]"
                    fill="#666"
                    color="white"
                    aria-label="Selected country"
                  />
                )}
              </button>
            );
          })}
          {visibleCountries.length === 0 && (
            <p className="px-[14px] pt-5 text-[16px] text-[#687581]">No country found</p>
          )}
        </div>
      </div>
    </div>
  );
}
