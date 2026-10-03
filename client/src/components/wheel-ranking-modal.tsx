import WheelBoardModal from "@/components/wheel-board-modal";
import { Loader2 } from "lucide-react";

interface RankingEntry {
  phone: string;
  amount: string;
  description: string;
}

function medalStyle(rank: number): React.CSSProperties {
  const colors = [
    ["#fff0a3", "#e99c16", "#a8580a"],
    ["#f4f5f6", "#aeb8bf", "#69757d"],
    ["#ffd0ad", "#ce7651", "#8d3f2e"],
  ];
  const [light, main, dark] = colors[rank - 1] ?? ["#fff", "#f5d4cb", "#bd7261"];
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 25,
    height: 25,
    borderRadius: "50%",
    border: "1px solid rgba(126, 69, 39, .28)",
    background: `linear-gradient(145deg, ${light}, ${main} 62%, ${dark})`,
    boxShadow: "0 2px 3px rgba(96, 44, 26, .2), inset 0 1px 1px rgba(255,255,255,.75)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    textShadow: "0 1px 2px rgba(70,35,19,.6)",
  };
}

export default function WheelRankingModal({
  open,
  onClose,
  entries,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  entries: RankingEntry[];
  isLoading: boolean;
}) {
  const topEntries = [...entries]
    .filter((entry) => Number.parseFloat(entry.amount) > 0)
    .sort((a, b) => Number.parseFloat(b.amount) - Number.parseFloat(a.amount))
    .slice(0, 5);

  return (
    <WheelBoardModal
      open={open}
      onClose={onClose}
      closeLabel="Close"
      ariaLabel="Classement des gagnants"
      showTrophy
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "78px minmax(0, 1fr) 91px",
          alignItems: "center",
          gap: 7,
          padding: "0 3px 11px",
          color: "#713823",
          fontSize: "clamp(13px, 3.5vw, 16px)",
          fontWeight: 700,
          lineHeight: 1.25,
          borderBottom: "1px solid rgba(217, 133, 119, .12)",
        }}
      >
        <span style={{ textAlign: "center" }}>Classement</span>
        <span style={{ textAlign: "center" }}>Numéro de téléphone</span>
        <span style={{ textAlign: "center" }}>Tirer un bonus</span>
      </div>
      {isLoading && (
        <div className="flex justify-center pt-12" role="status" aria-label="Chargement du classement">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#df6a4d" }} />
        </div>
      )}
      {!isLoading && topEntries.length === 0 && (
        <p className="pt-10 text-center text-sm text-[#713823]" role="status">
          Aucun gain enregistré pour le moment.
        </p>
      )}
      {topEntries.map((entry, index) => (
        <div
          key={`${entry.phone}-${entry.amount}-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "78px minmax(0, 1fr) 91px",
            alignItems: "center",
            gap: 7,
            minHeight: 53,
            padding: "5px 3px",
            borderBottom: index === topEntries.length - 1 ? "none" : "1px solid rgba(217, 133, 119, .09)",
            color: "#201c1b",
            fontSize: "clamp(13px, 3.6vw, 15px)",
          }}
        >
          <span style={{ display: "flex", justifyContent: "center" }}>
            {index < 3 ? (
              <span style={medalStyle(index + 1)}>{index + 1}</span>
            ) : (
              <span style={{ fontWeight: 500 }}>{index + 1}</span>
            )}
          </span>
          <span
            style={{
              minWidth: 0,
              textAlign: "center",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {entry.phone}
          </span>
          <span style={{ textAlign: "center", fontWeight: 700 }}>
            {Number.parseFloat(entry.amount).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </WheelBoardModal>
  );
}