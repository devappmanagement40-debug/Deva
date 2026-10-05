import { useEffect, useState } from "react";
import QRCode from "qrcode";
import ciFlagAsset from "@/assets/cote-divoire-flag.svg";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  ImagePlus,
  Phone,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export type CiMobileMoneyCheckoutProps = {
  amountXof: number;
  currency: string;
  operatorName: string;
  operatorPhone: string;
  operatorOwnerName: string;
  operatorLogoUrl?: string | null;
  paymentUrl?: string | null;
  paymentQrDataUrl?: string | null;
  payerPhoneDigits: string;
  onPayerPhoneDigitsChange(value: string): void;
  transactionId: string;
  onTransactionIdChange(value: string): void;
  proofName: string;
  onPickProof(): void;
  isSubmitting: boolean;
  onBack(): void;
  onContinueToPayment(): void;
  onSubmitForReview(): void;
  language: string;
};

type PaymentTab = "app" | "qr";

const COPY = {
  fr: {
    deposit: "Dépôt Mobile Money",
    stageOne: "Vos coordonnées de paiement",
    intro: "Indiquez le numéro depuis lequel vous effectuerez le transfert.",
    amount: "Montant du paiement",
    operator: "Opérateur sélectionné",
    phoneLabel: "Numéro de téléphone utilisé pour payer",
    phonePlaceholder: "10 chiffres",
    phoneHint: "Saisissez les 10 chiffres de votre numéro ivoirien.",
    continue: "Continuer vers le paiement",
    secure: "Vérification par l’administration",
    reviewNote: "Votre paiement sera examiné par l’administration.",
    stageTwo: "Effectuez votre transfert",
    stageCount: "ÉTAPE 2 SUR 2",
    appTab: "Ouvrir l’application",
    qrTab: "Scanner le code QR",
    exactAmount: "Montant à transférer",
    recipient: "Compte destinataire",
    owner: "Titulaire du compte",
    copy: "Copier",
    copied: "Copié",
    appHeading: "Payer avec",
    appInstructions: "Ouvrez l’application Mobile Money et effectuez le transfert vers le compte affiché ci-dessous.",
    launch: "Ouvrir l’application pour payer",
    launchUnavailable: "Lien de paiement non configuré",
    qrHeading: "Scannez pour payer",
    scanInstructions: "Scannez ce code avec votre application Mobile Money.",
    qrUnavailable: "Code QR non configuré",
    configureLink: "L’administration doit configurer le lien de paiement pour proposer cette option.",
    configureQr: "L’administration doit configurer le code QR pour proposer cette option.",
    manualTransfer: "Vous pouvez toujours effectuer un transfert manuel vers le numéro destinataire affiché ci-dessus.",
    reference: "Numéro de transaction",
    referenceHint: "Saisissez la référence indiquée sur le reçu de votre transfert.",
    referencePlaceholder: "Ex. : référence du reçu",
    required: "Obligatoire",
    proof: "Justificatif (facultatif)",
    chooseProof: "Ajouter une capture d’écran",
    replaceProof: "Remplacer le justificatif",
    noProof: "Aucun fichier ajouté",
    submit: "Transmettre à l’administration",
    submitting: "Envoi en cours…",
    submitHint: "Cette demande sera examinée par l’administration. Le dépôt n’est pas crédité automatiquement.",
    back: "Retour",
    missingOwner: "Non renseigné",
    disabledLaunch: "Le lien de paiement n’est pas disponible.",
    copyFailed: "Impossible de copier le numéro.",
    openNew: "S’ouvre dans un nouvel onglet",
  },
  en: {
    deposit: "Mobile Money deposit",
    stageOne: "Your payment details",
    intro: "Enter the number you will use to make the transfer.",
    amount: "Payment amount",
    operator: "Selected operator",
    phoneLabel: "Phone number used to pay",
    phonePlaceholder: "10 digits",
    phoneHint: "Enter the 10 digits of your Côte d’Ivoire phone number.",
    continue: "Continue to payment",
    secure: "Administrative review",
    reviewNote: "Your payment will be reviewed by the administration.",
    stageTwo: "Make your transfer",
    stageCount: "STEP 2 OF 2",
    appTab: "Open payment app",
    qrTab: "Scan QR code",
    exactAmount: "Transfer amount",
    recipient: "Recipient account",
    owner: "Account holder",
    copy: "Copy",
    copied: "Copied",
    appHeading: "Pay with",
    appInstructions: "Open your Mobile Money app and transfer to the recipient account shown below.",
    launch: "Open payment app",
    launchUnavailable: "Payment link not configured",
    qrHeading: "Scan to pay",
    scanInstructions: "Scan this code with your Mobile Money app.",
    qrUnavailable: "QR code not configured",
    configureLink: "The administration must configure a payment link to offer this option.",
    configureQr: "The administration must configure a QR code to offer this option.",
    manualTransfer: "You can still transfer manually to the recipient number shown above.",
    reference: "Transaction number",
    referenceHint: "Enter the reference shown on your transfer receipt.",
    referencePlaceholder: "e.g. receipt reference",
    required: "Required",
    proof: "Proof of payment (optional)",
    chooseProof: "Add a screenshot",
    replaceProof: "Replace proof",
    noProof: "No file added",
    submit: "Send for admin review",
    submitting: "Sending…",
    submitHint: "Your request will be reviewed by the administration. Your deposit is not credited automatically.",
    back: "Back",
    missingOwner: "Not provided",
    disabledLaunch: "The payment link is unavailable.",
    copyFailed: "Could not copy the number.",
    openNew: "Opens in a new tab",
  },
} as const;

function isSafePaymentUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ["https:", "wave:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function CiMobileMoneyCheckout({
  amountXof,
  currency,
  operatorName,
  operatorPhone,
  operatorOwnerName,
  operatorLogoUrl,
  paymentUrl,
  paymentQrDataUrl,
  payerPhoneDigits,
  onPayerPhoneDigitsChange,
  transactionId,
  onTransactionIdChange,
  proofName,
  onPickProof,
  isSubmitting,
  onBack,
  onContinueToPayment,
  onSubmitForReview,
  language,
}: CiMobileMoneyCheckoutProps) {
  const [stage, setStage] = useState<1 | 2>(1);
  const [tab, setTab] = useState<PaymentTab>("app");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [generatedQr, setGeneratedQr] = useState("");

  const isEnglish = language.toLowerCase().startsWith("en");
  const isFrench = !isEnglish;
  const copy = isFrench ? COPY.fr : COPY.en;
  const safeUrl = paymentUrl?.trim() && isSafePaymentUrl(paymentUrl.trim())
    ? paymentUrl.trim()
    : "";
  const qrSource = paymentQrDataUrl?.startsWith("data:image/") ? paymentQrDataUrl : "";
  useEffect(() => {
    let cancelled = false;
    if (!safeUrl || qrSource) {
      setGeneratedQr("");
      return () => {
        cancelled = true;
      };
    }
    void QRCode.toDataURL(safeUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
    }).then((dataUrl) => {
      if (!cancelled) setGeneratedQr(dataUrl);
    }).catch(() => {
      if (!cancelled) setGeneratedQr("");
    });
    return () => {
      cancelled = true;
    };
  }, [safeUrl, qrSource]);
  const displayedQr = qrSource || generatedQr;
  const formattedAmount = Number.isFinite(amountXof)
    ? new Intl.NumberFormat(isFrench ? "fr-FR" : "en-US", {
        maximumFractionDigits: 0,
      }).format(amountXof)
    : String(amountXof);

  const continueToInstructions = () => {
    onContinueToPayment();
    setStage(2);
  };

  const copyRecipient = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(operatorPhone);
      } else {
        const field = document.createElement("textarea");
        field.value = operatorPhone;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const success = document.execCommand("copy");
        field.remove();
        if (!success) throw new Error("Clipboard unavailable");
      }
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
      setCopied(false);
    }
  };

  const goBack = () => {
    if (stage === 2) {
      setStage(1);
      return;
    }
    onBack();
  };

  return (
    <main className="ci-checkout">
      <style>{`
        .ci-checkout {
          --ci-orange: #ed9a55;
          --ci-orange-deep: #df8240;
          --ci-ink: #28313a;
          --ci-muted: #727a82;
          --ci-line: #e8e9eb;
          --ci-blue: #168db2;
          min-height: 100dvh;
          padding: 18px 16px 34px;
          color: var(--ci-ink);
          background-color: #e88e48;
          background-image:
            linear-gradient(155deg, rgba(232,142,72,.72) 0%, rgba(240,162,96,.75) 55%, rgba(229,141,75,.72) 100%),
            url("${ciFlagAsset}");
          background-position: center, center top;
          background-size: cover, min(100vw, 560px) auto;
          background-repeat: no-repeat, no-repeat;
          font-family: inherit;
        }
        .ci-checkout * { box-sizing: border-box; }
        .ci-shell { width: min(100%, 500px); margin: 0 auto; }
        .ci-topbar {
          display: flex; align-items: center; gap: 12px; min-height: 48px;
          margin: 0 auto 14px; color: #fff;
        }
        .ci-back {
          display: inline-flex; align-items: center; justify-content: center;
          width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.42);
          border-radius: 14px; color: #fff; background: rgba(115,57,23,.12);
          cursor: pointer; transition: transform .18s ease, background .18s ease;
        }
        .ci-back:hover { background: rgba(115,57,23,.24); }
        .ci-back:active, .ci-primary:active, .ci-launch:active { transform: translateY(1px); }
        .ci-brand { min-width: 0; flex: 1; }
        .ci-brand-mark {
          font-size: 11px; line-height: 1.2; font-weight: 800;
          letter-spacing: .19em; text-transform: uppercase; opacity: .84;
        }
        .ci-brand-title { margin-top: 3px; font-size: 17px; font-weight: 720; letter-spacing: -.02em; }
        .ci-step {
          color: #fff; border: 1px solid rgba(255,255,255,.36); border-radius: 999px;
          padding: 7px 10px; font-size: 10px; font-weight: 750; letter-spacing: .08em;
        }
        .ci-card {
          overflow: hidden; border: 1px solid rgba(255,255,255,.6); border-radius: 23px;
          background: #fff; box-shadow: 0 17px 42px rgba(102,52,22,.17);
          animation: ci-arrive .34s ease both;
        }
        @keyframes ci-arrive { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ci-card-head { padding: 22px 21px 18px; border-bottom: 1px solid #f0f0f0; }
        .ci-eyebrow { margin: 0; color: #9a6b4d; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .ci-title { margin: 7px 0 0; font-size: clamp(22px, 5.6vw, 28px); line-height: 1.13; letter-spacing: -.04em; font-weight: 780; }
        .ci-description { margin: 8px 0 0; color: var(--ci-muted); font-size: 14px; line-height: 1.5; }
        .ci-body { padding: 18px 21px 22px; }
        .ci-amount {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          padding: 16px; border: 1px solid #f0e9e4; border-radius: 15px;
          background: #fffaf6;
        }
        .ci-amount-label { color: #74787d; font-size: 12px; font-weight: 650; }
        .ci-amount-value { color: var(--ci-orange-deep); text-align: right; font-size: clamp(20px, 5vw, 25px); font-weight: 800; letter-spacing: -.04em; white-space: nowrap; }
        .ci-amount-currency { font-size: 13px; letter-spacing: 0; }
        .ci-operator {
          display: flex; align-items: center; gap: 13px; margin-top: 15px; padding: 13px 14px;
          border: 1px solid var(--ci-line); border-radius: 15px; background: #fff;
        }
        .ci-operator-icon {
          display: grid; flex: 0 0 48px; width: 48px; height: 48px; place-items: center;
          overflow: hidden; border-radius: 14px; color: #fff; background: #23b6d4;
        }
        .ci-operator-icon img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
        .ci-operator-copy { min-width: 0; flex: 1; }
        .ci-operator-label { color: var(--ci-muted); font-size: 11px; font-weight: 650; }
        .ci-operator-name { margin-top: 3px; font-size: 16px; font-weight: 760; }
        .ci-field { display: block; margin-top: 21px; }
        .ci-label-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .ci-label { color: #41474e; font-size: 14px; font-weight: 720; }
        .ci-required { color: #c96d3d; font-size: 10px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
        .ci-phone-control {
          display: flex; align-items: center; min-height: 58px; overflow: hidden;
          border: 1px solid #e8c6ab; border-radius: 12px; background: #fff;
          transition: border-color .16s ease, box-shadow .16s ease;
        }
        .ci-phone-control:focus-within { border-color: #dc8d51; box-shadow: 0 0 0 3px rgba(220,141,81,.17); }
        .ci-prefix { align-self: stretch; display: grid; place-items: center; padding: 0 14px; color: #5e6368; background: #f5f5f5; border-right: 1px solid #ececec; font-size: 15px; font-weight: 750; }
        .ci-input {
          min-width: 0; width: 100%; border: 0; outline: 0; color: var(--ci-ink); background: transparent;
          padding: 14px 13px; font: inherit; font-size: 17px; letter-spacing: .04em;
        }
        .ci-input::placeholder { color: #b3a49a; font-size: 14px; letter-spacing: 0; }
        .ci-hint { margin: 8px 0 0; color: var(--ci-muted); font-size: 12px; line-height: 1.5; }
        .ci-primary {
          display: flex; width: 100%; min-height: 54px; align-items: center; justify-content: center; gap: 9px;
          margin-top: 23px; padding: 13px 16px; border: 0; border-radius: 10px;
          color: #fff; background: var(--ci-orange); box-shadow: 0 5px 13px rgba(204,112,50,.24);
          font: inherit; font-size: 15px; font-weight: 760; cursor: pointer;
          transition: transform .18s ease, background .18s ease, opacity .18s ease;
        }
        .ci-primary:hover:not(:disabled) { background: var(--ci-orange-deep); }
        .ci-primary:disabled { cursor: not-allowed; opacity: .54; box-shadow: none; }
        .ci-secure {
          display: flex; gap: 11px; align-items: flex-start; margin-top: 17px;
          padding: 13px 14px; border-radius: 12px; color: #17577a;
          background: #eaf5fb; font-size: 12px; line-height: 1.45;
        }
        .ci-secure-icon { flex: 0 0 auto; margin-top: 1px; color: #168db2; }
        .ci-secure strong { display: block; margin-bottom: 2px; color: #17577a; font-size: 12px; }
        .ci-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; padding: 5px; border-radius: 12px; background: #f2f2f3; }
        .ci-tab {
          display: flex; min-height: 48px; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 8px; border: 0; border-radius: 9px; color: #697078; background: transparent;
          font: inherit; font-size: 12px; font-weight: 720; cursor: pointer;
          transition: color .16s ease, background .16s ease, transform .16s ease;
        }
        .ci-tab[aria-selected="true"] { color: #fff; background: var(--ci-orange); box-shadow: 0 3px 8px rgba(170,95,45,.18); }
        .ci-tab:hover { color: var(--ci-ink); }
        .ci-tab[aria-selected="true"]:hover { color: #fff; }
        .ci-instructions { margin-top: 16px; }
        .ci-notice {
          display: flex; gap: 10px; align-items: flex-start; margin-top: 15px;
          padding: 12px 13px; border: 1px solid #d8e9f3; border-left: 4px solid #e99a5e;
          border-radius: 12px; color: #246485; background: #edf7fc; font-size: 12px; line-height: 1.5;
        }
        .ci-notice svg { flex: 0 0 auto; margin-top: 1px; color: #df884b; }
        .ci-transfer-panel {
          margin-top: 15px; padding: 18px 15px; border: 1px solid #e7b080; border-radius: 15px;
          color: #fff; background: #ee9b58; text-align: center;
        }
        .ci-transfer-icon {
          display: grid; width: 42px; height: 42px; margin: 0 auto 8px; place-items: center;
          border-radius: 13px; color: #168db2; background: #fff;
        }
        .ci-transfer-panel h3 { margin: 0; font-size: 18px; font-weight: 800; }
        .ci-transfer-panel p { margin: 7px 0 0; font-size: 13px; line-height: 1.55; font-weight: 600; }
        .ci-recipient {
          margin-top: 15px; padding: 14px; border: 1px solid #ece7e3; border-radius: 14px; background: #fff;
        }
        .ci-recipient-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .ci-recipient-title { color: #757a80; font-size: 11px; font-weight: 730; }
        .ci-copy {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          min-height: 34px; padding: 6px 9px; border: 1px solid #eed5c1; border-radius: 8px;
          color: #b36534; background: #fffaf6; font: inherit; font-size: 11px; font-weight: 720; cursor: pointer;
        }
        .ci-number { margin-top: 6px; color: #282e34; font-size: 21px; font-weight: 800; letter-spacing: .02em; overflow-wrap: anywhere; }
        .ci-owner { margin-top: 3px; color: var(--ci-muted); font-size: 12px; }
        .ci-launch {
          display: flex; width: 100%; min-height: 51px; align-items: center; justify-content: center; gap: 9px;
          margin-top: 14px; padding: 12px; border: 0; border-radius: 4px; color: #fff; background: var(--ci-blue);
          box-shadow: 0 5px 13px rgba(20,117,149,.2); text-decoration: none; font-size: 14px; font-weight: 760;
          transition: transform .18s ease, background .18s ease;
        }
        .ci-launch:hover { background: #107b9c; }
        .ci-launch[aria-disabled="true"] { color: #717980; background: #e9e9e9; box-shadow: none; cursor: not-allowed; }
        .ci-launch[aria-disabled="true"]:hover { background: #e9e9e9; }
        .ci-qr-wrap { display: grid; place-items: center; margin-top: 15px; padding: 15px; border: 1px solid #e6e9eb; border-radius: 15px; background: #fdfdfd; }
        .ci-qr { display: block; width: min(100%, 248px); aspect-ratio: 1; object-fit: contain; }
        .ci-qr-placeholder {
          display: grid; width: min(100%, 248px); aspect-ratio: 1; place-items: center; padding: 18px;
          border: 1px dashed #e3c7b4; border-radius: 11px; color: #6f747a; background: #fffaf6; text-align: center;
        }
        .ci-qr-placeholder svg { color: #d78b54; }
        .ci-qr-placeholder strong { display: block; margin-top: 9px; color: #474d53; font-size: 14px; }
        .ci-qr-placeholder span { display: block; margin-top: 5px; font-size: 12px; line-height: 1.5; }
        .ci-reference { margin-top: 19px; padding-top: 17px; border-top: 1px solid #eee; }
        .ci-reference-input {
          width: 100%; min-height: 50px; padding: 12px 13px; border: 1px solid #dedfe1; border-radius: 9px;
          outline: none; color: var(--ci-ink); background: #fff; font: inherit; font-size: 14px;
          transition: border-color .16s ease, box-shadow .16s ease;
        }
        .ci-reference-input:focus { border-color: #dd8f55; box-shadow: 0 0 0 3px rgba(220,141,81,.16); }
        .ci-proof {
          display: flex; width: 100%; align-items: center; gap: 10px; margin-top: 13px; padding: 12px;
          border: 1px dashed #d9c9bd; border-radius: 10px; color: #8c5d3f; background: #fffaf6;
          text-align: left; font: inherit; cursor: pointer;
        }
        .ci-proof-copy { min-width: 0; flex: 1; }
        .ci-proof-copy strong { display: block; color: #5d5149; font-size: 12px; }
        .ci-proof-copy span { display: block; margin-top: 3px; overflow: hidden; color: #84878a; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
        .ci-review-note { display: flex; gap: 8px; margin-top: 13px; color: #71777d; font-size: 11px; line-height: 1.5; }
        .ci-review-note svg { flex: 0 0 auto; margin-top: 1px; color: #168db2; }
        .ci-copy-error { margin-top: 7px; color: #b64e43; font-size: 11px; }
        .ci-checkout button:focus-visible, .ci-checkout a:focus-visible, .ci-checkout input:focus-visible {
          outline: 3px solid rgba(20,141,178,.55); outline-offset: 2px;
        }
        @media (min-width: 700px) {
          .ci-checkout { display: flex; flex-direction: column; justify-content: center; padding-top: 30px; padding-bottom: 45px; }
          .ci-topbar { width: min(100%, 500px); margin-bottom: 17px; }
          .ci-card-head { padding: 25px 25px 20px; }
          .ci-body { padding: 20px 25px 25px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ci-checkout *, .ci-checkout *::before, .ci-checkout *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>

      <div className="ci-shell">
        <header className="ci-topbar">
          <button
            className="ci-back"
            type="button"
            onClick={goBack}
            aria-label={copy.back}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className="ci-brand">
            <div className="ci-brand-mark">DIAMANT · {copy.deposit}</div>
            <div className="ci-brand-title">{stage === 1 ? copy.stageOne : copy.stageTwo}</div>
          </div>
          {stage === 2 && <span className="ci-step">{copy.stageCount}</span>}
        </header>

        {stage === 1 ? (
          <section className="ci-card" aria-labelledby="ci-stage-one-title">
            <div className="ci-card-head">
              <p className="ci-eyebrow">{copy.deposit}</p>
              <h1 className="ci-title" id="ci-stage-one-title">{copy.stageOne}</h1>
              <p className="ci-description">{copy.intro}</p>
            </div>
            <div className="ci-body">
              <div className="ci-amount" aria-label={`${copy.amount}: ${formattedAmount} ${currency}`}>
                <span className="ci-amount-label">{copy.amount}</span>
                <span className="ci-amount-value">
                  {formattedAmount} <span className="ci-amount-currency">{currency}</span>
                </span>
              </div>

              <div className="ci-operator">
                <div className="ci-operator-icon" aria-hidden="true">
                  {operatorLogoUrl && !logoFailed ? (
                    <img src={operatorLogoUrl} alt="" onError={() => setLogoFailed(true)} />
                  ) : (
                    <Phone size={23} strokeWidth={2.2} />
                  )}
                </div>
                <div className="ci-operator-copy">
                  <div className="ci-operator-label">{copy.operator}</div>
                  <div className="ci-operator-name">{operatorName}</div>
                </div>
                <Check size={19} color="#df874a" aria-hidden="true" />
              </div>

              <label className="ci-field">
                <span className="ci-label-row">
                  <span className="ci-label">{copy.phoneLabel}</span>
                  <span className="ci-required">{copy.required}</span>
                </span>
                <span className="ci-phone-control">
                  <span className="ci-prefix" aria-hidden="true">+225</span>
                  <input
                    className="ci-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    aria-label={`${copy.phoneLabel}, indicatif +225`}
                    value={payerPhoneDigits}
                    onChange={(event) => onPayerPhoneDigitsChange(event.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder={copy.phonePlaceholder}
                    maxLength={10}
                  />
                </span>
                <span className="ci-hint">{copy.phoneHint}</span>
              </label>

              <button
                className="ci-primary"
                type="button"
                onClick={continueToInstructions}
                disabled={payerPhoneDigits.length !== 10}
              >
                {copy.continue}
                <ArrowUpRight size={18} aria-hidden="true" />
              </button>

              <div className="ci-secure">
                <ShieldCheck className="ci-secure-icon" size={20} aria-hidden="true" />
                <div>
                  <strong>{copy.secure}</strong>
                  {copy.reviewNote}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="ci-card" aria-labelledby="ci-stage-two-title">
            <div className="ci-card-head">
              <p className="ci-eyebrow">{copy.stageCount}</p>
              <h1 className="ci-title" id="ci-stage-two-title">{copy.stageTwo}</h1>
            </div>
            <div className="ci-body">
              <div className="ci-amount" aria-label={`${copy.exactAmount}: ${formattedAmount} ${currency}`}>
                <span className="ci-amount-label">{copy.exactAmount}</span>
                <span className="ci-amount-value">
                  {formattedAmount} <span className="ci-amount-currency">{currency}</span>
                </span>
              </div>

              <div className="ci-recipient">
                <div className="ci-recipient-head">
                  <span className="ci-recipient-title">{copy.recipient} · {operatorName}</span>
                  <button className="ci-copy" type="button" onClick={() => void copyRecipient()}>
                    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copied ? copy.copied : copy.copy}
                  </button>
                </div>
                <div className="ci-number">{operatorPhone}</div>
                <div className="ci-owner">{copy.owner}: {operatorOwnerName || copy.missingOwner}</div>
                {copyError && <div role="status" className="ci-copy-error">{copy.copyFailed}</div>}
              </div>

              <div className="ci-instructions">
                <div className="ci-tabs" role="tablist" aria-label={copy.stageTwo}>
                  <button
                    type="button"
                    role="tab"
                    id="ci-app-tab"
                    aria-controls="ci-app-panel"
                    aria-selected={tab === "app"}
                    className="ci-tab"
                    onClick={() => setTab("app")}
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    {copy.appTab}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="ci-qr-tab"
                    aria-controls="ci-qr-panel"
                    aria-selected={tab === "qr"}
                    className="ci-tab"
                    onClick={() => setTab("qr")}
                  >
                    <Smartphone size={16} aria-hidden="true" />
                    {copy.qrTab}
                  </button>
                </div>

                {tab === "app" ? (
                  <div className="ci-instructions" role="tabpanel" id="ci-app-panel" aria-labelledby="ci-app-tab">
                    <div className="ci-transfer-panel">
                      <div className="ci-transfer-icon" aria-hidden="true">
                        {operatorLogoUrl && !logoFailed
                          ? <img src={operatorLogoUrl} alt="" onError={() => setLogoFailed(true)} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          : <Phone size={22} />}
                      </div>
                      <h3>{copy.appHeading} {operatorName}</h3>
                      <p>{copy.appInstructions}</p>
                    </div>
                    {safeUrl ? (
                      <a
                        className="ci-launch"
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${copy.launch}. ${copy.openNew}`}
                      >
                        <ExternalLink size={17} aria-hidden="true" />
                        {copy.launch}
                      </a>
                    ) : (
                      <>
                        <button className="ci-launch" type="button" disabled aria-disabled="true" title={copy.disabledLaunch}>
                          <ExternalLink size={17} aria-hidden="true" />
                          {copy.launchUnavailable}
                        </button>
                        <div className="ci-notice" role="status">
                          <CircleAlert size={17} aria-hidden="true" />
                          <span>{copy.configureLink} {copy.manualTransfer}</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="ci-instructions" role="tabpanel" id="ci-qr-panel" aria-labelledby="ci-qr-tab">
                    <div className="ci-notice">
                      <CircleAlert size={17} aria-hidden="true" />
                      <span>{copy.scanInstructions}</span>
                    </div>
                    <div className="ci-qr-wrap">
                      {displayedQr ? (
                        <img className="ci-qr" src={displayedQr} alt={`${copy.qrHeading} · ${operatorName}`} />
                      ) : (
                        <div className="ci-qr-placeholder" role="status">
                          <ImagePlus size={28} aria-hidden="true" />
                          <div>
                            <strong>{copy.qrUnavailable}</strong>
                            <span>{copy.configureQr}</span>
                            <span>{copy.manualTransfer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="ci-reference">
                <label htmlFor="ci-transaction-id">
                  <span className="ci-label-row">
                    <span className="ci-label">{copy.reference}</span>
                    <span className="ci-required">{copy.required}</span>
                  </span>
                  <span className="ci-hint" style={{ display: "block", marginBottom: 9 }}>{copy.referenceHint}</span>
                </label>
                <input
                  className="ci-reference-input"
                  type="text"
                  id="ci-transaction-id"
                  autoComplete="off"
                  value={transactionId}
                  maxLength={180}
                  onChange={(event) => onTransactionIdChange(event.currentTarget.value.slice(0, 180))}
                  placeholder={copy.referencePlaceholder}
                  required
                />

                <button className="ci-proof" type="button" onClick={onPickProof}>
                  <ImagePlus size={19} aria-hidden="true" />
                  <span className="ci-proof-copy">
                    <strong>{proofName ? copy.replaceProof : copy.chooseProof}</strong>
                    <span>{proofName || copy.noProof}</span>
                  </span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>

                <div className="ci-review-note">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>{copy.submitHint}</span>
                </div>

                <button
                  className="ci-primary"
                  type="button"
                  onClick={onSubmitForReview}
                  disabled={!transactionId.trim() || isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? copy.submitting : copy.submit}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default CiMobileMoneyCheckout;
