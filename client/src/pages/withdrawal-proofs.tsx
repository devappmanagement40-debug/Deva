import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, CheckCircle2, Clock3, Expand, ImagePlus, Plus, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { localeForLang, useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import "./withdrawal-proofs.css";

type ProofFeedItem = {
  id: number;
  message: string;
  imageCount: 1 | 2;
  displayAmountXof: number;
  createdAt: string;
  maskedPhone: string;
};

type SelectedProofImage = {
  dataUrl: string;
  name: string;
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

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

export default function WithdrawalProofsPage() {
  const [, navigate] = useLocation();
  const { lang } = useI18n();
  const { toast } = useToast();
  const locale = localeForLang(lang);
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const imageInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [proofImages, setProofImages] = useState<SelectedProofImage[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{ item: ProofFeedItem; imageNumber: number } | null>(null);
  const proofDialogRef = useRef<HTMLDialogElement>(null);

  const feed = useQuery<ProofFeedItem[]>({
    queryKey: ["/api/withdrawal-proofs"],
  });

  useEffect(() => {
    const dialog = proofDialogRef.current;
    if (!dialog) return;

    if (selectedProof && !dialog.open) dialog.showModal();
    if (!selectedProof && dialog.open) dialog.close();
  }, [selectedProof]);

  const submitProof = useMutation({
    mutationFn: async (payload: { message: string; proof: string; proof2?: string }) => {
      const response = await apiRequest("POST", "/api/withdrawal-proofs", payload);
      return response.json() as Promise<{ id: number; status: "pending" }>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-proofs"] });
      toast({
        title: "Preuve envoyée",
        description: "Elle sera visible par les autres membres après validation par l’administration.",
      });
      setMessage("");
      setProofImages([]);
      setFormOpen(false);
    },
    onError: () => toast({
      title: "Envoi impossible",
      description: "L’envoi a échoué. Vérifiez votre connexion puis réessayez.",
      variant: "destructive",
    }),
  });

  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (proofImages.length >= 2) {
      toast({
        title: "Maximum de captures atteint",
        description: "Maximum 2 captures par partage.",
        variant: "destructive",
      });
      return;
    }
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
      const dataUrl = await readImage(file);
      setProofImages((current) => current.length >= 2 ? current : [...current, { dataUrl, name: file.name }]);
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
    if (!trimmedMessage || proofImages.length === 0) {
      toast({
        title: "Informations manquantes",
        description: "Ajoutez un message et au moins une capture de votre retrait.",
        variant: "destructive",
      });
      return;
    }
    submitProof.mutate({
      message: trimmedMessage,
      proof: proofImages[0].dataUrl,
      proof2: proofImages[1]?.dataUrl,
    });
  };

  return (
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
                <div className="withdrawal-proof-form__images">
                  {proofImages.map((image, index) => (
                    <div className="withdrawal-proof-image-preview" key={`${image.name}-${index}`}>
                      <img src={image.dataUrl} alt="Aperçu de la preuve sélectionnée" />
                      <span>
                        <strong>{index === 0 ? "Capture 1" : "Capture 2"}</strong>
                        <small data-no-static-translation>{image.name}</small>
                      </span>
                      <CheckCircle2 size={20} strokeWidth={2.8} />
                      <button
                        type="button"
                        onClick={() => setProofImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                        aria-label="Supprimer cette capture"
                        disabled={submitProof.isPending}
                        data-testid={`button-remove-withdrawal-proof-image-${index + 1}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {proofImages.length < 2 && (
                    <button
                      type="button"
                      className="withdrawal-proof-upload"
                      onClick={() => imageInput.current?.click()}
                      disabled={submitProof.isPending}
                      data-testid="button-upload-withdrawal-proof"
                    >
                      <ImagePlus size={23} strokeWidth={2.8} />
                      <span>
                        <strong>{proofImages.length === 0 ? "Ajouter une capture" : "Ajouter une autre capture"}</strong>
                        <small>PNG, JPEG ou WebP · 5 Mo maximum</small>
                      </span>
                      <Camera size={20} strokeWidth={2.8} />
                    </button>
                  )}
                </div>
                <p className="withdrawal-proof-upload-limit">Maximum 2 captures par partage.</p>
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
                       <span className="withdrawal-proof-card__avatar" aria-hidden="true">
                         <img src="/diamant-mark.svg" alt="" />
                       </span>
                       <span><strong data-no-static-translation>{item.maskedPhone}</strong><small data-no-static-translation><Clock3 size={13} strokeWidth={2.6} /> {formatDate(item.createdAt, locale)}</small></span>
                    </div>
                    <span className="withdrawal-proof-card__verified"><ShieldCheck size={15} strokeWidth={2.8} /> Vérifié</span>
                  </div>
                  <div className={`withdrawal-proof-card__content ${item.imageCount > 1 ? "is-multiple" : ""}`}>
                    <p data-no-static-translation>{item.message}</p>
                      <div className={`withdrawal-proof-card__images ${item.imageCount > 1 ? "is-multiple" : ""}`}>
                        {Array.from({ length: item.imageCount }, (_, imageIndex) => {
                          const imageNumber = imageIndex + 1;
                          return (
                            <button
                              key={imageNumber}
                              type="button"
                              className="withdrawal-proof-card__image-button"
                              onClick={() => setSelectedProof({ item, imageNumber })}
                              aria-label="Agrandir la capture"
                              data-testid={imageNumber === 1
                                ? `button-view-withdrawal-proof-${item.id}`
                                : `button-view-withdrawal-proof-${item.id}-2`}
                            >
                              <img
                                src={`/api/withdrawal-proofs/${item.id}/image?image=${imageNumber}`}
                                alt="Capture de retrait partagée"
                                loading={index > 1 ? "lazy" : "eager"}
                              />
                              <span className="withdrawal-proof-card__image-action"><Expand size={13} strokeWidth={2.6} /> Agrandir</span>
                              <span className="withdrawal-proof-card__image-caption">{imageNumber === 1 ? "Capture 1" : "Capture 2"}</span>
                            </button>
                          );
                        })}
                      </div>
                  </div>
                  {Number(item.displayAmountXof) > 0 && (
                    <div className="withdrawal-proof-card__bonus">
                       <span>Montant indicatif (non crédité)</span>
                      <strong data-no-static-translation>{numberFormat.format(Number(item.displayAmountXof))} <small>XOF</small></strong>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
         <dialog
           ref={proofDialogRef}
           className="withdrawal-proof-lightbox"
           aria-labelledby="withdrawal-proof-lightbox-title"
           onCancel={(event) => {
             event.preventDefault();
             setSelectedProof(null);
           }}
           onClick={(event) => {
             if (event.target === proofDialogRef.current) setSelectedProof(null);
           }}
           data-testid="dialog-withdrawal-proof-image"
         >
           {selectedProof && (
             <>
               <div className="withdrawal-proof-lightbox__header">
                 <div>
                   <h2 id="withdrawal-proof-lightbox-title">Capture de retrait</h2>
                    <span data-no-static-translation>{selectedProof.item.maskedPhone}</span>
                 </div>
                 <button
                   type="button"
                   className="withdrawal-proof-lightbox__close"
                   onClick={() => setSelectedProof(null)}
                   aria-label="Fermer la capture"
                   autoFocus
                 >
                   <X size={20} strokeWidth={2.6} />
                 </button>
               </div>
                <img
                  src={`/api/withdrawal-proofs/${selectedProof.item.id}/image?image=${selectedProof.imageNumber}`}
                  alt="Capture de retrait partagée"
                />
               <p>Appuyez sur Échap ou sur le fond sombre pour fermer.</p>
             </>
           )}
         </dialog>
      </div>
    </main>
  );
}