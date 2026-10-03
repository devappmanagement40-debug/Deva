import "./_group.css";
import { useState } from "react";

const inviteText =
  "Invitez vos amis à s'inscrire et vous aurez plus de chances de gagner des prix, jusqu'à 50 fois par jour.";
const rulesText =
  "Achetez un produit pour obtenir des tours gratuits. Chaque tour vous donne une chance de remporter un gain en XOF crédité directement sur votre solde.";

function InviteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const highlight = "50";
  const index = inviteText.indexOf(highlight);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden rounded-2xl shadow-2xl"
        style={{ maxWidth: 380, background: "#fff" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-7">
          <p className="text-[15px] leading-relaxed text-gray-800">
            {inviteText.slice(0, index)}
            <span className="font-extrabold" style={{ color: "#E63946" }}>
              {highlight}
            </span>
            {inviteText.slice(index + highlight.length)}
          </p>
        </div>
        <div style={{ height: 1, background: "#e5e7eb" }} />
        <button
          onClick={onClose}
          className="w-full py-4 text-center text-base font-semibold transition active:opacity-70"
          style={{ color: "#3B82F6" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

function RulesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden rounded-2xl shadow-2xl"
        style={{ maxWidth: 380, background: "#fff" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-7">
          <p className="text-[15px] leading-relaxed text-gray-800">{rulesText}</p>
        </div>
        <div style={{ height: 1, background: "#e5e7eb" }} />
        <button
          onClick={onClose}
          className="w-full py-4 text-center text-base font-semibold transition active:opacity-70"
          style={{ color: "#3B82F6" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function Current() {
  const [activeModal, setActiveModal] = useState<"invite" | "rules" | null>("invite");

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-end gap-3 p-6"
      style={{
        background:
          "radial-gradient(ellipse at 50% 15%, #81502f 0%, #3e281a 48%, #17100d 100%)",
        fontFamily: "Roboto, Arial, sans-serif",
      }}
    >
      <div className="flex w-full max-w-sm gap-3">
        <button
          type="button"
          onClick={() => setActiveModal("invite")}
          className="flex-1 rounded-xl bg-white/90 px-3 py-3 text-sm font-bold text-[#713823]"
        >
          Invitez vos amis
        </button>
        <button
          type="button"
          onClick={() => setActiveModal("rules")}
          className="flex-1 rounded-xl bg-white/90 px-3 py-3 text-sm font-bold text-[#713823]"
        >
          Règles du jeu
        </button>
      </div>
      <InviteModal
        open={activeModal === "invite"}
        onClose={() => setActiveModal(null)}
      />
      <RulesModal
        open={activeModal === "rules"}
        onClose={() => setActiveModal(null)}
      />
    </main>
  );
}