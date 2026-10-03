import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, Clock3, House, ImagePlus, Plus, ShieldCheck, Upload, UserRound, UsersRound, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./_group.css";
import "./Current.css";

type ProofFeedItem = {
  id: number;
  message: string;
  shareBonusXof: number;
  createdAt: string;
  maskedPhone: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
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

export default function Current() {
  const navigate = (_path: string) => {};
  const toast = (_options: unknown) => {};
  const locale = "fr-FR";
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const imageInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const feed = { data: MOCK_PROOFS, isLoading: false, isError: false, refetch: () => {} };
  const submitProof = { isPending: false, mutate: (_payload: { message: string; proof: string }) => {} };

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Format non pris en charge",
        description: "Choisissez une image PNG, JPEG ou WebP.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "Image trop volumineuse",
        description: "La preuve doit faire 5 Mo ou moins.",
        variant: "destructive",
      });
      return;
    }
    try {
      setProof(await readImage(file));
      setProofName(file.name);
    } catch {
      toast({
        title: "Image illisible",
        description: "Impossible de lire cette image. Réessayez avec un autre fichier.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !proof) {
      toast({
        title: "Informations manquantes",
        description: "Ajoutez un message et une capture de votre retrait.",
        variant: "destructive",
      });
      return;
    }
    submitProof.mutate({ message: trimmedMessage, proof });
  };

  return (
    <div className="withdrawal-proofs-preview-shell">
    <main className="withdrawal-proofs-page" data-testid="page-withdrawal-proofs">
      <div className="withdrawal-proofs-shell">
        <header className="withdrawal-proofs-header">
          <button
            type="button"
            className="withdrawal-proofs-back"
            onClick={() => navigate("/")}
            aria-label="Retour à l’accueil"
            data-testid="button-withdrawal-proofs-back"
          >
            <ArrowLeft size={21} strokeWidth={2.8} />
          </button>
          <div className="withdrawal-proofs-header__copy">
            <span className="withdrawal-proofs-eyebrow">DIAMANT · COMMUNAUTÉ</span>
            <h1>Preuves de retrait</h1>
          </div>
          <span className="withdrawal-proofs-header__mark" aria-hidden="true"><ShieldCheck size={21} strokeWidth={2.8} /></span>
        </header>

        <div className="withdrawal-proofs-feed">
          <section className={`withdrawal-proof-submit ${formOpen ? "is-open" : ""}`}>
            {!formOpen ? (
              <button
                type="button"
                className="withdrawal-proof-submit__trigger"
                onClick={() => setFormOpen(true)}
                data-testid="button-open-withdrawal-proof-form"
              >
                <span className="withdrawal-proof-submit__icon"><Upload size={22} strokeWidth={2.8} /></span>
                <span><strong>Partager une preuve</strong><small>Montrez votre retrait à la communauté</small></span>
                <span className="withdrawal-proof-submit__plus" aria-hidden="true"><Plus size={22} strokeWidth={3} /></span>
              </button>
            ) : (
              <form className="withdrawal-proof-form" onSubmit={handleSubmit}>
                <div className="withdrawal-proof-form__heading">
                  <div>
                    <span className="withdrawal-proofs-eyebrow">VOTRE CONTRIBUTION</span>
                    <h2>Ajouter une preuve</h2>
                  </div>
                  <button
                    type="button"
                    className="withdrawal-proof-form__close"
                    onClick={() => setFormOpen(false)}
                    aria-label="Fermer le formulaire"
                  >
                    <X size={19} strokeWidth={2.8} />
                  </button>
                </div>
                <label className="withdrawal-proof-field">
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
                  className="sr-only"
                  onChange={chooseImage}
                  data-testid="input-withdrawal-proof-image"
                />
                <button
                  type="button"
                  className={`withdrawal-proof-upload ${proof ? "has-image" : ""}`}
                  onClick={() => imageInput.current?.click()}
                  data-testid="button-upload-withdrawal-proof"
                >
                  {proof ? (
                    <>
                      <img src={proof} alt="Aperçu de la preuve sélectionnée" />
                      <span><strong>Image prête</strong><small data-no-static-translation>{proofName}</small></span>
                      <CheckCircle2 size={22} strokeWidth={2.8} />
                    </>
                  ) : (
                    <>
                      <ImagePlus size={23} strokeWidth={2.8} />
                      <span><strong>Ajouter une capture</strong><small>PNG, JPEG ou WebP · 5 Mo maximum</small></span>
                      <Camera size={20} strokeWidth={2.8} />
                    </>
                  )}
                </button>
                <p className="withdrawal-proof-approval-note">
                  <ShieldCheck size={18} strokeWidth={2.7} />
                  Votre preuve ne sera visible par les autres membres qu’après validation par l’administration.
                </p>
                <Button
                  type="submit"
                  disabled={submitProof.isPending}
                  className="withdrawal-proof-submit__button"
                  data-testid="button-submit-withdrawal-proof"
                >
                  {submitProof.isPending ? "Envoi en cours…" : "Envoyer pour vérification"}
                </Button>
              </form>
            )}
          </section>

          <div className="withdrawal-proof-list-heading">
            <div><span className="withdrawal-proofs-eyebrow">RETOURS DE LA COMMUNAUTÉ</span><h2>Retraits vérifiés</h2></div>
              <span className="withdrawal-proof-list-heading__count" data-no-static-translation>
              {feed.data ? String(feed.data.length).padStart(2, "0") : "—"}
            </span>
          </div>

          {feed.isLoading ? (
            <div className="withdrawal-proof-skeleton-list" role="status" aria-label="Chargement des preuves">
              {[0, 1, 2].map((index) => (
                <div className="withdrawal-proof-skeleton" key={index}>
                  <div className="withdrawal-proof-skeleton__line" />
                  <div className="withdrawal-proof-skeleton__body" />
                </div>
              ))}
            </div>
          ) : feed.isError ? (
            <div className="withdrawal-proof-state withdrawal-proof-state--error">
              <ShieldCheck size={28} strokeWidth={2.8} />
              <h3>Le fil ne peut pas être chargé</h3>
              <p>Vérifiez votre connexion puis réessayez.</p>
              <Button variant="outline" onClick={() => void feed.refetch()}>Réessayer</Button>
            </div>
          ) : !feed.data?.length ? (
            <div className="withdrawal-proof-state">
              <div className="withdrawal-proof-state__icon"><ImagePlus size={27} strokeWidth={2.8} /></div>
              <h3>Les premières preuves arrivent bientôt</h3>
              <p>Vous pouvez aider la communauté en partageant votre expérience de retrait.</p>
              <button type="button" onClick={() => setFormOpen(true)}>Partager la première preuve</button>
            </div>
          ) : (
            <div className="withdrawal-proof-list">
              {feed.data.map((item, index) => (
                <article className="withdrawal-proof-card" key={item.id} data-testid={`withdrawal-proof-${item.id}`}>
                  <div className="withdrawal-proof-card__top">
                    <div className="withdrawal-proof-card__member">
                  <span className="withdrawal-proof-card__avatar" aria-hidden="true" data-no-static-translation>{item.maskedPhone.slice(-2)}</span>
                  <span><strong data-no-static-translation>{item.maskedPhone}</strong><small data-no-static-translation><Clock3 size={13} strokeWidth={2.6} /> {formatDate(item.createdAt, locale)}</small></span>
                    </div>
                    <span className="withdrawal-proof-card__verified"><ShieldCheck size={15} strokeWidth={2.8} /> Vérifié</span>
                  </div>
                  <div className="withdrawal-proof-card__content">
                    <p data-no-static-translation>{item.message}</p>
                    <figure className="withdrawal-proof-card__image">
                      <img
                         src="/__mockup/images/withdrawal-proof-sample.png"
                        alt="Capture de retrait partagée"
                        loading={index > 1 ? "lazy" : "eager"}
                      />
                      <figcaption>Capture de retrait</figcaption>
                    </figure>
                  </div>
                  {Number(item.shareBonusXof) > 0 && (
                    <div className="withdrawal-proof-card__bonus">
                      <span>Prime de partage affichée</span>
                      <strong data-no-static-translation>{numberFormat.format(Number(item.shareBonusXof))} <small>XOF</small></strong>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
    <nav className="withdrawal-proofs-preview-nav" aria-label="Navigation principale">
      <div>
        <button type="button"><House size={25} strokeWidth={1.9} /><span>Accueil</span></button>
        <button type="button"><WalletCards size={25} strokeWidth={1.9} /><span>Investir</span></button>
        <button type="button"><UsersRound size={25} strokeWidth={1.9} /><span>Équipe</span></button>
        <button type="button"><UserRound size={25} strokeWidth={1.9} /><span>Moi</span></button>
      </div>
    </nav>
    </div>
  );
}