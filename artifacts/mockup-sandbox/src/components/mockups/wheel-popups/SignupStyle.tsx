import "./_group.css";
import { useState } from "react";

const inviteText =
  "Invitez vos amis à s'inscrire et vous aurez plus de chances de gagner des prix, jusqu'à 50 fois par jour.";
const rulesText =
  "Achetez un produit pour obtenir des tours gratuits. Chaque tour vous donne une chance de remporter un gain en XOF crédité directement sur votre solde.";

const authModalStyles = {
  backdrop: {
    background: "rgba(2, 7, 29, .76)",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    fontFamily: "Roboto, Arial, sans-serif",
  },
  card: {
    maxWidth: 380,
    color: "#fff",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 22,
    backgroundColor: "#02071d",
    backgroundImage:
      "linear-gradient(180deg, rgba(5, 15, 46, .72), rgba(2, 7, 29, .96)), url('/__mockup/images/auth-night-sky.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow:
      "0 22px 48px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.12)",
  },
  body: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: "Roboto, Arial, sans-serif",
  },
  highlight: {
    color: "#c5baff",
    fontWeight: 800,
  },
  button: {
    height: 63,
    border: "2px solid #a693ff",
    borderBottom: "5px solid #3e22b4",
    borderRadius: 14,
    color: "#fff",
    background: "#653de9",
    boxShadow: "0 5px 0 #351c9b, 0 10px 18px rgba(14, 17, 63, .3)",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1,
    fontFamily: "Roboto, Arial, sans-serif",
    textTransform: "uppercase" as const,
  },
};

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
      style={authModalStyles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full overflow-hidden"
        style={authModalStyles.card}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Invitez vos amis"
      >
        <div className="px-6 py-7">
          <p style={authModalStyles.body}>
            {inviteText.slice(0, index)}
            <span style={authModalStyles.highlight}>{highlight}</span>
            {inviteText.slice(index + highlight.length)}
          </p>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,.16)" }} />
        <button
          type="button"
          onClick={onClose}
          className="transition active:translate-y-[3px]"
          style={{
            ...authModalStyles.button,
            width: "calc(100% - 40px)",
            margin: "16px 20px 20px",
          }}
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
      style={authModalStyles.backdrop}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full overflow-hidden"
        style={authModalStyles.card}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Règles du jeu"
      >
        <div className="px-6 py-7">
          <p style={authModalStyles.body}>{rulesText}</p>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,.16)" }} />
        <button
          type="button"
          onClick={onClose}
          className="transition active:translate-y-[3px]"
          style={{
            ...authModalStyles.button,
            width: "calc(100% - 40px)",
            margin: "16px 20px 20px",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function SignupStyle() {
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