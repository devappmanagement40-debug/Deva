import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import WheelBoardModal from "@/components/wheel-board-modal";
import type { Transaction } from "@shared/schema";

function formatDate(dateStr: string | Date) {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) +
    " " +
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function WheelHistoryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: history, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/spin-wheel/history"],
    enabled: open,
  });

  return (
    <WheelBoardModal
      open={open}
      onClose={onClose}
      closeLabel="Fermer"
      ariaLabel="Historique des tirages"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12,
          padding: "0 5px 11px",
          borderBottom: "1px solid rgba(217, 133, 119, .12)",
          color: "#713823",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        <span>Temps</span>
        <span style={{ textAlign: "right" }}>Tirer un bonus</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center pt-12" role="status" aria-label="Chargement de l’historique">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#df6a4d" }} />
        </div>
      ) : history?.length ? (
        history?.map((transaction) => {
          const amount = Number.parseFloat(transaction.amount);
          return (
            <div
              key={transaction.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: 12,
                alignItems: "center",
                minHeight: 48,
                padding: "7px 5px",
                borderBottom: "1px solid rgba(217, 133, 119, .09)",
                color: "#241d1a",
                fontSize: 14,
              }}
            >
              <span>{formatDate(transaction.createdAt)}</span>
              <span style={{ textAlign: "right", fontWeight: 700 }}>
                {amount > 0
                  ? amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })
                  : "—"}
              </span>
            </div>
          );
        })
      ) : (
        <p className="pt-10 text-center text-sm text-[#713823]" role="status">
          Aucun tirage enregistré pour le moment.
        </p>
      )}
    </WheelBoardModal>
  );
}