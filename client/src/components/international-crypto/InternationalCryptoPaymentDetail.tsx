import { AlertTriangle, Check, Copy, Info, ShieldCheck, WalletCards } from "lucide-react";
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
  checkStatusLabel = "Vérifier le statut",
}: InternationalCryptoPaymentDetailProps) {
  const networkLabel = network.trim();
  const tokenLabel = token.trim().toUpperCase();

  return (
    <section className="icx icx-detail" aria-label="Détails du dépôt crypto">
      <header className="icx-detail__top">
        <div className="icx-detail__amount-row">
          <div>
            <p className="icx-eyebrow">Montant exact à envoyer</p>
            <p className="icx-detail__amount">
              {exactPayAmount} <small>{exactPayCurrency}</small>
            </p>
          </div>
          <span className="icx-detail__secure">
            <ShieldCheck size={15} aria-hidden="true" />
            Paiement sécurisé
          </span>
        </div>
        <p className="icx-detail__network">
          <span className="icx-detail__status-dot" aria-hidden="true" />
          Envoyez uniquement <strong>{tokenLabel} sur {networkLabel}</strong>
        </p>
        <p className="icx-detail__network" style={{ marginTop: 7 }}>
          <span aria-hidden="true" />
          Montant crédité : <strong>{creditedUsdtAmount} USDT</strong>
        </p>
      </header>

      <div className="icx-detail__body">
        <section className="icx-panel" aria-labelledby="icx-qr-heading">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h3 className="icx-panel__title" id="icx-qr-heading">Scannez pour payer</h3>
              <p className="icx-panel__hint">Scannez ce code QR avec votre portefeuille.</p>
            </div>
            <WalletCards size={20} color="#087a38" aria-hidden="true" />
          </div>
          <div className="icx-qr">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`Code QR de paiement ${tokenLabel} sur ${networkLabel}`} />
            ) : (
              <span className="icx-qr__empty" role="status">Le code QR sera affiché ici lorsqu’il sera disponible.</span>
            )}
          </div>
        </section>

        <section className="icx-panel icx-address-panel" aria-labelledby="icx-address-heading">
          <div className="icx-address-head">
            <div>
              <h3 className="icx-panel__title" id="icx-address-heading">Adresse de dépôt</h3>
              <p className="icx-panel__hint">{tokenLabel} · {networkLabel}</p>
            </div>
            <span className="icx-required">Obligatoire</span>
          </div>
          <p className="icx-address" aria-label="Adresse de dépôt">{address}</p>
          <button type="button" className="icx-button icx-button--wide" onClick={onCopyAddress} disabled={!address}>
            {addressCopied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            {addressCopied ? "Adresse copiée" : "Copier l’adresse"}
          </button>
        </section>

        <div className="icx-detail__status" data-status={status} role="status" aria-live="polite">
          <span className="icx-detail__status-dot" aria-hidden="true" />
          <span>{statusLabels[status]}</span>
        </div>
        <button type="button" className="icx-button icx-button--wide" onClick={onCheckStatus}>
          <Check size={17} aria-hidden="true" />
          {checkStatusLabel}
        </button>

        <div className="icx-note">
          <AlertTriangle size={16} aria-hidden="true" />
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>{noteText}</p>
        </div>
        <p className="icx-detail__network" style={{ alignItems: "flex-start", marginInline: 2 }}>
          <Info size={16} aria-hidden="true" />
          <span>Vérifiez le montant et le réseau avant d’envoyer. Une transaction sur un mauvais réseau peut être irréversible.</span>
        </p>
        <button
          type="button"
          className="icx-button icx-button--quiet"
          onClick={onCopyAmount}
          aria-label={amountCopied ? "Montant copié" : "Copier le montant exact"}
        >
          {amountCopied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {amountCopied ? "Montant copié" : "Copier le montant"}
        </button>
      </div>
    </section>
  );
}
