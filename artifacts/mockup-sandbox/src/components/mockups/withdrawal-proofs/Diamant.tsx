import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check, CheckCircle2, Clock3, House, ImagePlus, Plus, ShieldCheck, Upload, UserRound, UsersRound, WalletCards, X } from "lucide-react";
import "./_group.css";
import "./Diamant.css";

type ProofFeedItem = {
  id: number;
  message: string;
  shareBonusXof: number;
  createdAt: string;
  maskedPhone: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PROOF_IMAGE = "/__mockup/images/withdrawal-proof-sample.png";
const DIAMANT_MARK = "/__mockup/images/diamant-mark.svg";

const MOCK_PROOFS: ProofFeedItem[] = [{
  id: 2,
  message: "Retrait reçu",
  shareBonusXof: 200,
  createdAt: "2026-10-03T07:17:34.505Z",
  maskedPhone: "05446••058",
}];

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire cette image."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Le fichier sélectionné n’est pas une image valide."));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function Diamant() {
  const locale = "fr-FR";
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const imageInput = useRef<HTMLInputElement>(null);
  const proofTrigger = useRef<HTMLButtonElement>(null);
  const viewerClose = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [formNotice, setFormNotice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [activeNav, setActiveNav] = useState("");

  useEffect(() => {
    if (!viewerOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    viewerClose.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [viewerOpen]);

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFormNotice("Format non pris en charge. Choisissez une image PNG, JPEG ou WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFormNotice("Image trop volumineuse. La preuve doit faire 5 Mo ou moins.");
      return;
    }
    try {
      setProof(await readImage(file));
      setProofName(file.name);
      setFormNotice("");
    } catch {
      setFormNotice("Impossible de lire cette image. Réessayez avec un autre fichier.");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim() || !proof) {
      setFormNotice("Ajoutez un message et une capture de votre retrait.");
      return;
    }
    setFormNotice("Aperçu uniquement : votre preuve n’a pas été envoyée.");
  };

  const handleNavigation = (label: string) => {
    setActiveNav(label);
    setAnnouncement(`Section ${label} sélectionnée dans cet aperçu.`);
  };

  return (
    <div className="diamant-preview">
      <main className="diamant-page" data-testid="page-withdrawal-proofs">
        <div className="diamant-shell">
          <header className="diamant-header">
            <button
              type="button"
              className="diamant-back"
              onClick={() => setAnnouncement("La navigation vers l’accueil n’est pas disponible dans cet aperçu.")}
              aria-label="Retour à l’accueil"
              data-testid="button-withdrawal-proofs-back"
            >
              <ArrowLeft size={20} strokeWidth={2.4} />
            </button>
            <div className="diamant-header__copy">
              <span className="diamant-eyebrow">DIAMANT <i /> COMMUNAUTÉ</span>
              <h1>Preuves de retrait</h1>
            </div>
            <span className="diamant-header__mark" aria-label="Vérification DIAMANT">
              <ShieldCheck size={20} strokeWidth={2.8} aria-hidden="true" />
            </span>
          </header>

          <section className="diamant-intro">
            <div className="diamant-intro__kicker"><span className="diamant-live-dot" /> DES MEMBRES, POUR LES MEMBRES</div>
            <div className="diamant-intro__seal"><ShieldCheck size={17} /><span>La confiance se construit ensemble</span></div>
          </section>

          <div className="diamant-feed">
            <section className={`diamant-submit ${formOpen ? "is-open" : ""}`}>
              {!formOpen ? (
                <button
                  ref={proofTrigger}
                  type="button"
                  className="diamant-submit__trigger"
                  onClick={() => { setFormOpen(true); setFormNotice(""); }}
                  data-testid="button-open-withdrawal-proof-form"
                >
                  <span className="diamant-submit__icon"><Upload size={21} strokeWidth={2.4} /></span>
                  <span className="diamant-submit__copy"><strong>Partager une preuve</strong><small>Montrez votre retrait à la communauté</small></span>
                  <span className="diamant-submit__plus" aria-hidden="true"><Plus size={20} strokeWidth={2.8} /></span>
                </button>
              ) : (
                <form className="diamant-form" onSubmit={handleSubmit}>
                  <div className="diamant-form__heading">
                    <div>
                      <span className="diamant-eyebrow">VOTRE CONTRIBUTION</span>
                      <h2>Ajouter une preuve</h2>
                    </div>
                    <button
                      type="button"
                      className="diamant-icon-button"
                      onClick={() => { setFormOpen(false); setFormNotice(""); proofTrigger.current?.focus(); }}
                      aria-label="Fermer le formulaire"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                  <label className="diamant-field">
                    <span>Votre message</span>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Racontez brièvement votre expérience de retrait…"
                      maxLength={500}
                      rows={3}
                      required
                      data-testid="input-withdrawal-proof-message"
                    />
                    <small>{message.length}/500</small>
                  </label>
                  <input
                    ref={imageInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="diamant-file-input"
                    onChange={chooseImage}
                    data-testid="input-withdrawal-proof-image"
                  />
                  <button
                    type="button"
                    className={`diamant-upload ${proof ? "has-image" : ""}`}
                    onClick={() => imageInput.current?.click()}
                    data-testid="button-upload-withdrawal-proof"
                  >
                    {proof ? (
                      <>
                        <img src={proof} alt="Aperçu de la preuve sélectionnée" />
                        <span><strong>Image prête</strong><small>{proofName}</small></span>
                        <CheckCircle2 size={20} />
                      </>
                    ) : (
                      <>
                        <ImagePlus size={21} />
                        <span><strong>Ajouter une capture</strong><small>PNG, JPEG ou WebP · 5 Mo maximum</small></span>
                        <Camera size={19} />
                      </>
                    )}
                  </button>
                  <p className="diamant-approval-note">
                    <ShieldCheck size={17} />
                    Votre preuve ne sera visible par les autres membres qu’après validation par l’administration.
                  </p>
                  {formNotice && <p className="diamant-form-notice" role="status">{formNotice}</p>}
                  <button type="submit" className="diamant-form-submit" data-testid="button-submit-withdrawal-proof">
                    Envoyer pour vérification
                  </button>
                </form>
              )}
            </section>

            <div className="diamant-list-heading">
              <div>
                <span className="diamant-eyebrow">RETOURS DE LA COMMUNAUTÉ</span>
                <h2>Retraits vérifiés</h2>
              </div>
              <span className="diamant-proof-count"><span />{String(MOCK_PROOFS.length).padStart(2, "0")}</span>
            </div>

            <div className="diamant-proof-list">
              {MOCK_PROOFS.map((item) => (
                <article className="diamant-proof-card" key={item.id} data-testid={`withdrawal-proof-${item.id}`}>
                  <div className="diamant-proof-card__top">
                    <div className="diamant-member">
                      <span className="diamant-member__mark"><img src={DIAMANT_MARK} alt="" /></span>
                      <span className="diamant-member__meta">
                        <strong>{item.maskedPhone}</strong>
                        <small><Clock3 size={12} strokeWidth={2.4} /> {formatDate(item.createdAt, locale)}</small>
                      </span>
                    </div>
                    <span className="diamant-verified"><Check size={14} strokeWidth={3.2} /> Vérifié</span>
                  </div>
                  <div className="diamant-proof-card__content">
                    <p>{item.message}</p>
                    <figure className="diamant-proof-image">
                      <button
                        type="button"
                        className="diamant-proof-image__open"
                        onClick={() => setViewerOpen(true)}
                        aria-label="Agrandir la capture de retrait"
                      >
                        <img src={PROOF_IMAGE} alt="Capture de retrait partagée" />
                         <span className="diamant-proof-image__hint">Toucher ou cliquer pour agrandir</span>
                      </button>
                      <figcaption>Capture de retrait <span>•</span> preuve validée</figcaption>
                    </figure>
                  </div>
                  {Number(item.shareBonusXof) > 0 && (
                    <div className="diamant-bonus">
                      <span className="diamant-bonus__label"><span className="diamant-bonus__icon"><Check size={12} strokeWidth={3} /></span><span><strong>Prime de partage créditée</strong><small>Merci de faire vivre la communauté</small></span></span>
                      <strong className="diamant-bonus__amount">{numberFormat.format(Number(item.shareBonusXof))} <small>XOF</small></strong>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <p className="diamant-feed-footnote"><ShieldCheck size={14} /> Chaque partage est contrôlé avant publication.</p>
          </div>
        </div>
      </main>

      <nav className="diamant-bottom-nav" aria-label="Navigation principale">
        <div>
          <button type="button" className={activeNav === "Accueil" ? "is-active" : ""} aria-current={activeNav === "Accueil" ? "page" : undefined} onClick={() => handleNavigation("Accueil")}><House size={25} strokeWidth={1.9} /><span>Accueil</span></button>
          <button type="button" className={activeNav === "Investir" ? "is-active" : ""} aria-current={activeNav === "Investir" ? "page" : undefined} onClick={() => handleNavigation("Investir")}><WalletCards size={25} strokeWidth={1.9} /><span>Investir</span></button>
          <button type="button" className={activeNav === "Équipe" ? "is-active" : ""} aria-current={activeNav === "Équipe" ? "page" : undefined} onClick={() => handleNavigation("Équipe")}><UsersRound size={25} strokeWidth={1.9} /><span>Équipe</span></button>
          <button type="button" className={activeNav === "Moi" ? "is-active" : ""} aria-current={activeNav === "Moi" ? "page" : undefined} onClick={() => handleNavigation("Moi")}><UserRound size={25} strokeWidth={1.9} /><span>Moi</span></button>
        </div>
      </nav>
      <div className="diamant-announcement" role="status" aria-live="polite">{announcement}</div>

      {viewerOpen && (
        <div
          className="diamant-viewer"
          role="presentation"
          onClick={() => setViewerOpen(false)}
        >
          <section
            className="diamant-viewer__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Capture de retrait en taille réelle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="diamant-viewer__top">
              <span><ShieldCheck size={16} /> Preuve vérifiée</span>
              <button ref={viewerClose} type="button" onClick={() => setViewerOpen(false)} aria-label="Fermer l’image agrandie">
                <X size={21} />
              </button>
            </div>
            <img src={PROOF_IMAGE} alt="Capture de retrait partagée, affichée en grand" />
            <p>Capture de retrait · {MOCK_PROOFS[0].maskedPhone}</p>
          </section>
        </div>
      )}
    </div>
  );
}