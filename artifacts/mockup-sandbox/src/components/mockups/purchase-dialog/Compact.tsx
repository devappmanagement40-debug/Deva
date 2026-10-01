import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import "./_group.css";
import "./Current.css";
import "./Compact.css";

function PreviewBackground() {
  return (
    <div className="purchase-dialog-preview-app" aria-hidden="true">
      <header className="purchase-dialog-preview-header">
        <strong>DIAMANT</strong>
        <span>Français　⌄</span>
      </header>
      <main className="purchase-dialog-preview-content">
        <span>Nos produits</span>
        <div className="purchase-dialog-preview-card" />
        <div className="purchase-dialog-preview-card" />
      </main>
      <nav className="purchase-dialog-preview-nav">
        <span>Accueil</span>
        <span>Investir</span>
        <span>Équipe</span>
        <span>Profil</span>
      </nav>
    </div>
  );
}

export function Compact() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <PreviewBackground />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="diamant-purchase-dialog diamant-purchase-dialog--compact">
          <DialogTitle className="sr-only">Confirmer l’achat de VIP 2</DialogTitle>
          <div className="diamant-purchase-dialog__visual">
            <img src="/__mockup/images/diamant-scooter.jpg" alt="Scooter électrique DIAMANT" />
          </div>
          <div className="diamant-purchase-dialog__body">
            <div className="diamant-purchase-dialog__heading">
              <div><span>DIAMANT / XOF</span><h2>VIP 2</h2></div>
              <strong>28 000<small> XOF</small></strong>
            </div>
            <p className="diamant-purchase-dialog__hint">Confirmez l’achat de ce produit. Le montant sera débité immédiatement.</p>
            <p className="diamant-purchase-dialog__hint diamant-purchase-dialog__hint--subtle">Le solde de gains peut compléter le solde de dépôt.</p>
            <div className="diamant-purchase-alert">
              <AlertTriangle size={17} aria-hidden="true" />
              <p>Solde insuffisant : il manque 26 000 XOF pour confirmer cet achat.</p>
            </div>
            <div className="diamant-payment-breakdown">
              <p>Répartition du paiement</p>
              <div><span>Solde de dépôt</span><strong>−2 000 XOF</strong></div>
              <div><span>Solde de gains</span><strong>−26 000 XOF</strong></div>
            </div>
            <div className="diamant-purchase-stats">
              <div><strong>360 jours</strong><span>Durée</span></div>
              <div><strong>800 XOF</strong><span>Revenu quotidien</span></div>
              <div><strong>288 000 XOF</strong><span>Revenu total</span></div>
            </div>
          </div>
          <div className="diamant-purchase-actions">
            <button type="button" onClick={() => setOpen(false)}>Annuler</button>
            <button type="button" disabled>Confirmer</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}