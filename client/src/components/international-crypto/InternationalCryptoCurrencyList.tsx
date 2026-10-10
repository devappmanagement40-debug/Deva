import { ChevronRight } from "lucide-react";
import "./international-crypto.css";

export type InternationalCryptoOption = {
  /** Stable identifier supplied by the parent (for example an API currency/network key). */
  id: string;
  token: string;
  network: string;
  /** Display name used as the primary row title. */
  label: string;
  iconSrc?: string;
  networkIconSrc?: string;
  description?: string;
  disabled?: boolean;
};

export type InternationalCryptoCurrencyListProps = {
  options: InternationalCryptoOption[];
  onSelect: (option: InternationalCryptoOption) => void;
  title?: string;
  eyebrow?: string;
  emptyMessage?: string;
  ariaLabel?: string;
};

export function InternationalCryptoCurrencyList({
  options,
  onSelect,
  title = "Choisissez un actif",
  eyebrow = "Dépôt international · USDT",
  emptyMessage = "Aucun actif disponible pour le moment.",
  ariaLabel = "Choisir une devise et un réseau",
}: InternationalCryptoCurrencyListProps) {
  return (
    <section className="icx icx-list" aria-label={ariaLabel}>
      <header className="icx-list__heading">
        <p className="icx-eyebrow">{eyebrow}</p>
        <h2 className="icx-list__title">{title}</h2>
      </header>
      {options.length > 0 ? (
        <div className="icx-options" role="list">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="listitem"
              className="icx-option"
              onClick={() => onSelect(option)}
              disabled={option.disabled}
              aria-label={`Sélectionner ${option.label}, réseau ${option.network}`}
            >
              <span className="icx-option__icon" aria-hidden="true">
                {option.iconSrc ? (
                  <img src={option.iconSrc} alt="" />
                ) : (
                  <span className="icx-option__monogram">{option.token.slice(0, 4).toUpperCase()}</span>
                )}
                {option.networkIconSrc && (
                  <span className="icx-option__network-icon">
                    <img src={option.networkIconSrc} alt="" />
                  </span>
                )}
              </span>
              <span className="icx-option__copy">
                <span className="icx-option__name">{option.label}</span>
                <span className="icx-option__meta">
                  {option.description || `${option.token.toUpperCase()} · ${option.network}`}
                </span>
              </span>
              <ChevronRight className="icx-option__arrow" size={19} aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <p className="icx-option__meta" role="status" style={{ padding: "18px 20px" }}>
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
