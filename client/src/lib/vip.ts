// ── Système VIP DIAMANT ─────────────────────────────────────────────────────
import { displayCurrencyText } from "@/lib/content";

export const VIP_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export interface VipLevelConfig {
  level: number;
  label: string;
  description: string;
  advantages: string;
  minInvestment: number | null;
}

/** Seuils d’investissement configurables depuis le panel administrateur. */
export const DEFAULT_VIP_CONFIGS: VipLevelConfig[] = [
  {
    level: 0, label: "VIP 0",
    description: "Membre n'ayant pas encore acheté de produit Parcours.",
    advantages: "Les produits Explore restent disponibles selon leurs conditions.",
    minInvestment: null,
  },
  {
    level: 1, label: "VIP 1",
    description: "Membre ayant réalisé son premier achat personnel payant dans Parcours.",
    advantages: "Rang d'entrée pour l'accès aux produits Parcours.",
    minInvestment: null,
  },
  {
    level: 2, label: "VIP 2",
    description: "Seuil d'investissement personnel cumulé dans Parcours atteint.",
    advantages: "Accès aux produits Parcours dont le niveau VIP requis est atteint.",
    minInvestment: null,
  },
  {
    level: 3, label: "VIP 3",
    description: "Seuil d'investissement personnel cumulé dans Parcours atteint.",
    advantages: "Accès aux produits Parcours dont le niveau VIP requis est atteint.",
    minInvestment: null,
  },
  {
    level: 4, label: "VIP 4",
    description: "Seuil d'investissement personnel cumulé dans Parcours atteint.",
    advantages: "Accès aux produits Parcours dont le niveau VIP requis est atteint.",
    minInvestment: null,
  },
  {
    level: 5, label: "VIP 5",
    description: "Seuil d'investissement personnel cumulé dans Parcours atteint.",
    advantages: "Accès aux produits Parcours dont le niveau VIP requis est atteint.",
    minInvestment: null,
  },
  {
    level: 6, label: "VIP 6",
    description: "Seuil d'investissement personnel cumulé dans Parcours atteint.",
    advantages: "Accès aux produits Parcours dont le niveau VIP requis est atteint.",
    minInvestment: null,
  },
  {
    level: 7, label: "VIP 7",
    description: "Seuil d'investissement personnel cumulé dans Parcours atteint.",
    advantages: "Accès aux produits Parcours dont le niveau VIP requis est atteint.",
    minInvestment: null,
  },
];

/** Fusionne les libellés et les seuils d’investissement administrables. */
export function mergeAdminVipConfig(
  defaults: VipLevelConfig[],
  settings: Record<string, string>,
): VipLevelConfig[] {
  return defaults.map((cfg) => {
    const rawThreshold = settings[`vip${cfg.level}MinInvestment`];
    const parsedThreshold = rawThreshold?.trim() ? Number(rawThreshold) : null;
    return {
      ...cfg,
      label:         settings[`vip${cfg.level}Label`]       || cfg.label,
      description:   displayCurrencyText(settings[`vip${cfg.level}Description`] || cfg.description),
      advantages:    displayCurrencyText(settings[`vip${cfg.level}Advantages`]  || cfg.advantages),
      minInvestment: Number.isSafeInteger(parsedThreshold) && Number(parsedThreshold) > 0
        ? Number(parsedThreshold)
        : null,
    };
  });
}

/** Couleur / style du badge selon le niveau */
export const VIP_BADGE_STYLE: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "rgba(255,255,255,0.15)", text: "#ffffff", border: "rgba(255,255,255,0.3)" },
  1: { bg: "linear-gradient(90deg,#333333,#000000)",  text: "#fff", border: "transparent" },
  2: { bg: "linear-gradient(90deg,#b8860b,#8b6508)",  text: "#fff", border: "transparent" },
  3: { bg: "linear-gradient(90deg,#cd7f32,#a0522d)",  text: "#fff", border: "transparent" },
  4: { bg: "linear-gradient(90deg,#c0c0c0,#808080)",  text: "#fff", border: "transparent" },
  5: { bg: "linear-gradient(90deg,#ffd700,#ffa500)",  text: "#fff", border: "transparent" },
  6: { bg: "linear-gradient(90deg,#00bcd4,#0097a7)",  text: "#fff", border: "transparent" },
  7: { bg: "linear-gradient(90deg,#e91e63,#9c27b0)",  text: "#fff", border: "transparent" },
};
