import { AlertTriangle, Check, Copy, Info, Loader2 } from "lucide-react";
import "./international-crypto.css";

export type InternationalCryptoPaymentStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "expired"
  | "failed";

export type InternationalCryptoPaymentDetailProps = {
  token: string;
  network: string;
  iconSrc?: string;
  networkIconSrc?: string;
  /** Exact amount string from the payment provider; displayed without numeric rounding. */
  exactPayAmount: string;
  /** Currency of the provider's payable amount (may differ from the credited asset). */
  exactPayCurrency: string;
  /** Exact USDT amount credited after payment processing, supplied by the parent. */
  creditedUsdtAmount: string;
  address: string;
  qrDataUrl: string;
  status: InternationalCryptoPaymentStatus;
  noteText: string;
  onCopyAddress: () => void;
  onCopyAmount: () => void;
  onCheckStatus: () => void;
  addressCopied?: boolean;
  amountCopied?: boolean;
  isCheckingStatus?: boolean;
  checkStatusLabel?: string;
};

const statusLabels: Record<InternationalCryptoPaymentStatus, string> = {
  waiting: "En attente du paiement",
  confirming: "Transaction en cours de confirmation",
  confirmed: "Transaction confirmée",
  expired: "Cette demande de paiement a expiré",
  failed: "Le statut du paiement nécessite une vérification",
};

export function InternationalCryptoPaymentDetail({
  token,
  network,
  iconSrc,
  networkIconSrc,
  exactPayAmount,
  exactPayCurrency,
  creditedUsdtAmount,
  address,
  qrDataUrl,
  status,
  noteText,
  onCopyAddress,
  onCopyAmount,
  onCheckStatus,
  addressCopied = false,
  amountCopied = false,
  isCheckingStatus = false,
  checkStatusLabel = "Vérifier le statut",
}: InternationalCryptoPaymentDetailProps) {
  const networkLabel = network.trim();
  const tokenLabel = token.trim().toUpperCase();

  return (
    <section className="icx icx-detail" aria-label="Détails du dépôt crypto">
      <div className="icx-detail__body">
        <section className="icx-panel icx-qr-panel" aria-labelledby="icx-qr-heading">
          <div className="icx-qr">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`Code QR de paiement ${tokenLabel} sur ${networkLabel}`} />
            ) : (
              <span className="icx-qr__empty" role="status">Le code QR sera affiché ici lorsqu’il sera disponible.</span>
            )}
          </div>
        </section>

        <div className="icx-method-line">
          <span className="icx-option__icon" aria-hidden="true">
            {iconSrc ? <img src={iconSrc} alt="" /> : <span className="icx-option__monogram">{tokenLabel.slice(0, 4)}</span>}
            {networkIconSrc && (
              <span className="icx-option__network-icon"><img src={networkIconSrc} alt="" /></span>
            )}
          </span>
          <div>
            <strong>{tokenLabel} · {networkLabel}</strong>
            <span>Montant crédité : {creditedUsdtAmount} USDT</span>
          </div>
        </div>

        <div className="icx-detail__amount-band">
          <div>
            <span>Montant exact à envoyer</span>
            <strong>{exactPayAmount} {exactPayCurrency}</strong>
          </div>
          <button
            type="button"
            className="icx-copy-amount"
            onClick={onCopyAmount}
            aria-label={amountCopied ? "Montant copié" : "Copier le montant exact"}
          >
            {amountCopied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            {amountCopied ? "Copié" : "Copier"}
          </button>
        </div>

        <section className="icx-panel icx-address-panel" aria-labelledby="icx-address-heading">
          <h3 className="icx-panel__title" id="icx-address-heading">Adresse de dépôt</h3>
          <div className="icx-address-row">
            <p className="icx-address" aria-label="Adresse de dépôt">{address}</p>
            <button
              type="button"
              className="icx-copy-address"
              onClick={onCopyAddress}
              disabled={!address}
              aria-label={addressCopied ? "Adresse copiée" : "Copier l’adresse de dépôt"}
            >
              {addressCopied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            </button>
          </div>
        </section>

        <button
          type="button"
          className="icx-button icx-button--wide"
          onClick={onCheckStatus}
          disabled={isCheckingStatus}
          aria-busy={isCheckingStatus}
        >
          {isCheckingStatus
            ? <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            : <Check size={17} aria-hidden="true" />}
          {checkStatusLabel}
        </button>

        <div className="icx-detail__status" data-status={status} role="status" aria-live="polite">
          <span className="icx-detail__status-dot" aria-hidden="true" />
          <span>{statusLabels[status]}</span>
        </div>

        <div className="icx-note">
          <AlertTriangle size={16} aria-hidden="true" />
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>{noteText}</p>
        </div>
        <p className="icx-detail__network" style={{ alignItems: "flex-start", marginInline: 2 }}>
          <Info size={16} aria-hidden="true" />
          <span>Vérifiez le montant et le réseau avant d’envoyer. Une transaction sur un mauvais réseau peut être irréversible.</span>
        </p>
      </div>
    </section>
  );
}
