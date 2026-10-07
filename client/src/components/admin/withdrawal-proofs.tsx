import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clock3, Download, ImageIcon, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { localeForLang, useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ReviewStatus = "pending" | "approved" | "rejected" | "all";
type AdminProof = {
  id: number;
  userId: number;
  message: string;
  imageCount: 1 | 2;
  status: string;
  shareBonusXof: number;
  displayAmountXof: number;
  createdAt: string;
  processedAt: string | null;
  processedBy: number | null;
  user: { id: number; fullName: string; phone: string; country: string };
};

const FILTERS: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "approved", label: "Approuvées" },
  { value: "rejected", label: "Rejetées" },
  { value: "all", label: "Toutes" },
];

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AdminWithdrawalProofs() {
  const { lang } = useI18n();
  const { toast } = useToast();
  const locale = localeForLang(lang);
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [bonusAmounts, setBonusAmounts] = useState<Record<number, string>>({});
  const [displayAmounts, setDisplayAmounts] = useState<Record<number, string>>({});
  const [openImage, setOpenImage] = useState<{ id: number; imageNumber: number } | null>(null);
  const [proofToDelete, setProofToDelete] = useState<AdminProof | null>(null);

  const proofs = useQuery<AdminProof[]>({
    queryKey: ["/api/admin/withdrawal-proofs", status],
    queryFn: async () => {
      const response = await fetch(`/api/admin/withdrawal-proofs?status=${status}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Impossible de charger les preuves.");
      }
      return response.json();
    },
  });

  const reviewProof = useMutation({
    mutationFn: async (payload: {
      id: number;
      action: "approve";
      shareBonusXof: number;
      displayAmountXof: number;
    } | { id: number; action: "reject" }) => {
      const { id, ...body } = payload;
      const response = await apiRequest("POST", `/api/admin/withdrawal-proofs/${id}/review`, body);
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-proofs"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-proofs"] });
      toast({ title: "Décision enregistrée", description: "La liste des preuves a été actualisée." });
    },
    onError: () => toast({
      title: "Action impossible",
      description: "La décision n’a pas été enregistrée. Actualisez la liste et réessayez.",
      variant: "destructive",
    }),
  });

  const deleteProof = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await apiRequest("DELETE", `/api/admin/withdrawal-proofs/${id}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Impossible de supprimer cette preuve.");
      }
    },
    onSuccess: () => {
      setProofToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawal-proofs"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-proofs"] });
      toast({
        title: "Preuve supprimée",
        description: "La preuve a été retirée. Le solde et l’historique financier restent inchangés.",
      });
    },
    onError: () => toast({
      title: "Action impossible",
      description: "La preuve n’a pas été supprimée. Actualisez la liste et réessayez.",
      variant: "destructive",
    }),
  });

  const approve = (proof: AdminProof) => {
    const rawAmount = bonusAmounts[proof.id] ?? String(proof.shareBonusXof ?? 0);
    const amount = Number(rawAmount);
    const rawDisplayAmount = displayAmounts[proof.id] ?? String(proof.displayAmountXof ?? 0);
    const displayAmount = Number(rawDisplayAmount);
    if (
      !Number.isSafeInteger(amount) || amount < 0 || amount > 2_147_483_647
      || !Number.isSafeInteger(displayAmount) || displayAmount < 0 || displayAmount > 2_147_483_647
    ) {
      toast({
        title: "Montant invalide",
        description: "Saisissez un montant entier compris entre 0 et 2 147 483 647 XOF.",
        variant: "destructive",
      });
      return;
    }
    reviewProof.mutate({
      id: proof.id,
      action: "approve",
      shareBonusXof: amount,
      displayAmountXof: displayAmount,
    });
  };

  return (
    <section className="admin-proof-review" data-testid="admin-withdrawal-proofs">
      <div className="admin-proof-review__intro">
        <div className="admin-proof-review__intro-icon"><ShieldCheck size={19} /></div>
        <div>
          <h2>Preuves de retrait</h2>
          <p>Vérifiez chaque capture avant publication dans le fil des membres.</p>
        </div>
      </div>
      <aside className="admin-proof-review__note">
        <strong>Montants de la preuve</strong>
        <span>La prime réelle est créditée au membre. Le montant indicatif est séparé, affiché comme non crédité et ne modifie pas son solde.</span>
      </aside>

      <div className="admin-proof-review__filters" role="group" aria-label="Filtrer les preuves">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
            aria-pressed={status === filter.value}
            data-testid={`button-filter-withdrawal-proofs-${filter.value}`}
          >
            {filter.label}
          </button>
        ))}
        <button
          type="button"
          className="admin-proof-review__refresh"
          onClick={() => void proofs.refetch()}
          aria-label="Actualiser la liste"
          data-testid="button-refresh-withdrawal-proofs"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {proofs.isLoading ? (
        <div className="admin-proof-review__skeletons" role="status" aria-label="Chargement des preuves">
          {[0, 1].map((item) => <div className="admin-proof-review__skeleton" key={item} />)}
        </div>
      ) : proofs.isError ? (
        <div className="admin-proof-review__state admin-proof-review__state--error">
          <p>Impossible de charger les preuves.</p>
          <Button variant="outline" onClick={() => void proofs.refetch()}>Réessayer</Button>
        </div>
      ) : !proofs.data?.length ? (
        <div className="admin-proof-review__state">
          <ShieldCheck size={25} />
          <strong>Aucune preuve dans cette sélection</strong>
          <span>Les nouvelles soumissions apparaîtront ici pour examen.</span>
        </div>
      ) : (
        <div className="admin-proof-review__list">
          {proofs.data.map((proof) => (
            <article className="admin-proof-card" key={proof.id} data-testid={`admin-withdrawal-proof-${proof.id}`}>
              <div className="admin-proof-card__header">
                <div>
                  <strong data-no-static-translation>{proof.user.fullName}</strong>
                  <span data-no-static-translation>{proof.user.phone} · {proof.user.country}</span>
                </div>
                <span className={`admin-proof-card__status admin-proof-card__status--${proof.status}`}>
                  {proof.status === "pending" ? "En attente" : proof.status === "approved" ? "Approuvée" : "Rejetée"}
                </span>
              </div>
              <div className="admin-proof-card__date">
                <Clock3 size={13} />
                <span>Envoyée le</span>
                <span data-no-static-translation>{formatDate(proof.createdAt, locale)}</span>
              </div>
              <p className="admin-proof-card__message" data-no-static-translation>{proof.message}</p>
              <div className={`admin-proof-card__images ${proof.imageCount > 1 ? "is-multiple" : ""}`}>
                {Array.from({ length: proof.imageCount }, (_, imageIndex) => {
                  const imageNumber = imageIndex + 1;
                  return (
                    <div className="admin-proof-card__image-item" key={imageNumber}>
                      <button
                        type="button"
                        className="admin-proof-card__image-button"
                        onClick={() => setOpenImage({ id: proof.id, imageNumber })}
                        data-testid={imageNumber === 1
                          ? `button-view-withdrawal-proof-${proof.id}`
                          : `button-view-withdrawal-proof-${proof.id}-2`}
                      >
                        <img
                          src={`/api/admin/withdrawal-proofs/${proof.id}/image?image=${imageNumber}`}
                          alt="Capture de preuve de retrait"
                          loading="lazy"
                        />
                        <span><ImageIcon size={15} /> Agrandir la capture</span>
                      </button>
                      <a
                        className="admin-proof-card__download"
                        href={`/api/admin/withdrawal-proofs/${proof.id}/image?image=${imageNumber}&download=1`}
                        download
                        aria-label="Télécharger la capture"
                        data-testid={`link-download-withdrawal-proof-${proof.id}-${imageNumber}`}
                      >
                        <Download size={14} />
                        <span>Télécharger</span>
                      </a>
                    </div>
                  );
                })}
              </div>
              {proof.status === "pending" ? (
                <div className="admin-proof-card__actions">
                  <label className="admin-proof-card__amount">
                    <span>Prime réellement créditée (XOF)</span>
                    <input
                      type="number"
                      min="0"
                      max="2147483647"
                      step="1"
                      inputMode="numeric"
                      value={bonusAmounts[proof.id] ?? String(proof.shareBonusXof ?? 0)}
                      onChange={(event) => setBonusAmounts((current) => ({ ...current, [proof.id]: event.target.value }))}
                      aria-label="Prime réellement créditée (XOF)"
                      data-testid={`input-withdrawal-proof-bonus-${proof.id}`}
                    />
                  </label>
                  <label className="admin-proof-card__amount">
                    <span>Montant indicatif public (XOF)</span>
                    <input
                      type="number"
                      min="0"
                      max="2147483647"
                      step="1"
                      inputMode="numeric"
                      value={displayAmounts[proof.id] ?? String(proof.displayAmountXof ?? 0)}
                      onChange={(event) => setDisplayAmounts((current) => ({ ...current, [proof.id]: event.target.value }))}
                      aria-label="Montant indicatif public (XOF)"
                      data-testid={`input-withdrawal-proof-display-amount-${proof.id}`}
                    />
                  </label>
                  <div className="admin-proof-card__buttons">
                    <Button
                      type="button"
                      onClick={() => approve(proof)}
                      disabled={reviewProof.isPending}
                      className="admin-proof-card__approve"
                      data-testid={`button-approve-withdrawal-proof-${proof.id}`}
                    >
                      <Check size={16} /> Approuver
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => reviewProof.mutate({ id: proof.id, action: "reject" })}
                      disabled={reviewProof.isPending}
                      data-testid={`button-reject-withdrawal-proof-${proof.id}`}
                    >
                      <X size={16} /> Rejeter
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="admin-proof-card__processed">
                  {proof.status === "approved" ? <Check size={14} /> : <X size={14} />}
                  <span>
                    {proof.status === "approved"
                      ? "Preuve approuvée"
                      : "Preuve rejetée"}
                  </span>
                  {proof.status === "approved" && Number(proof.shareBonusXof || 0) > 0 && (
                    <span>· Prime réellement créditée : <span data-no-static-translation>{Number(proof.shareBonusXof).toLocaleString(locale)} XOF</span></span>
                  )}
                  {proof.status === "approved" && Number(proof.displayAmountXof || 0) > 0 && (
                    <span>· Montant indicatif public : <span data-no-static-translation>{Number(proof.displayAmountXof).toLocaleString(locale)} XOF</span></span>
                  )}
                  {proof.processedAt && (
                    <small>
                      <span>Traitée le</span>
                      <span data-no-static-translation>{formatDate(proof.processedAt, locale)}</span>
                    </small>
                  )}
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                className="admin-proof-card__delete"
                onClick={() => setProofToDelete(proof)}
                disabled={deleteProof.isPending || reviewProof.isPending}
                data-testid={`button-delete-withdrawal-proof-${proof.id}`}
              >
                <Trash2 size={15} />
                Supprimer
              </Button>
            </article>
          ))}
        </div>
      )}

      {openImage !== null && (
        <div className="admin-proof-lightbox" role="dialog" aria-modal="true" aria-label="Capture de preuve">
          <button type="button" onClick={() => setOpenImage(null)} aria-label="Fermer la capture"><X size={20} /></button>
          <img
            src={`/api/admin/withdrawal-proofs/${openImage.id}/image?image=${openImage.imageNumber}`}
            alt="Capture de preuve de retrait"
          />
        </div>
      )}

      <AlertDialog
        open={proofToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteProof.isPending) setProofToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la preuve de retrait ?</AlertDialogTitle>
            <AlertDialogDescription>
              La preuve et ses captures seront supprimées définitivement. Une prime déjà créditée restera dans le solde du membre et dans son historique financier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProof.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProof.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (proofToDelete) deleteProof.mutate({ id: proofToDelete.id });
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}