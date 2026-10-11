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

/** Les rangs sont attribués par les produits Parcours, dans l’ordre du catalogue. */
export const DEFAULT_VIP_CONFIGS: VipLevelConfig[] = [
  {
    level: 0, label: "VIP 0",
    description: "Aucun achat Parcours n’a encore attribué de rang VIP.",
    advantages: "Les produits Explore restent disponibles selon leurs conditions.",
    minInvestment: null,
  },
  {
    level: 1, label: "VIP 1",
    description: "Rang attribué après l’achat du premier produit Parcours.",
    advantages: "Accès aux produits Parcours selon les conditions de chaque fiche.",
    minInvestment: null,
  },
  {
    level: 2, label: "VIP 2",
    description: "Rang attribué par le deuxième produit Parcours dans l’ordre du catalogue.",
    advantages: "Accès aux produits Parcours selon les conditions de chaque fiche.",
    minInvestment: null,
  },
  {
    level: 3, label: "VIP 3",
    description: "Rang attribué par le troisième produit Parcours dans l’ordre du catalogue.",
    advantages: "Accès aux produits Parcours selon les conditions de chaque fiche.",
    minInvestment: null,
  },
  {
    level: 4, label: "VIP 4",
    description: "Rang attribué par le quatrième produit Parcours dans l’ordre du catalogue.",
    advantages: "Accès aux produits Parcours selon les conditions de chaque fiche.",
    minInvestment: null,
  },
  {
    level: 5, label: "VIP 5",
    description: "Rang attribué par le cinquième produit Parcours dans l’ordre du catalogue.",
    advantages: "Accès aux produits Parcours selon les conditions de chaque fiche.",
    minInvestment: null,
  },
  {
    level: 6, label: "VIP 6",
    description: "Rang attribué par le sixième produit Parcours dans l’ordre du catalogue.",
    advantages: "Accès aux produits Parcours selon les conditions de chaque fiche.",
    minInvestment: null,
  },
  {
    level: 7, label: "VIP 7",
    description: "Rang maximal attribué par la progression des produits Parcours.",
    advantages: "Accès aux produits Parcours selon les conditions de chaque fiche.",
    minInvestment: null,
  },
];

const LEGACY_DESCRIPTION_TEXTS = new Set([
  "Membre dont l’investissement personnel cumulé n’a pas encore atteint le seuil configuré pour VIP 1.",
  "Seuil d’investissement personnel cumulé configuré pour VIP 1 atteint.",
  "Seuil d'investissement personnel cumulé sur l’ensemble des produits payants atteint.",
  "Seuil d'investissement personnel cumulé dans Parcours atteint.",
]);

const LEGACY_ADVANTAGE_TEXTS = new Set([
  "Rang d'entrée pour l'accès aux produits Parcours.",
  "Accès aux produits Parcours dont le niveau VIP requis est atteint.",
]);

/** Fusionne les libellés et les textes administrables sans relire les anciens seuils VIP. */
export function mergeAdminVipConfig(
  defaults: VipLevelConfig[],
  settings: Record<string, string>,
): VipLevelConfig[] {
  return defaults.map((cfg) => {
    const savedDescription = settings[`vip${cfg.level}Description`];
    const savedAdvantages = settings[`vip${cfg.level}Advantages`];
    return {
      ...cfg,
      label:         settings[`vip${cfg.level}Label`]       || cfg.label,
      description:   displayCurrencyText(
        savedDescription && !LEGACY_DESCRIPTION_TEXTS.has(savedDescription)
          ? savedDescription
          : cfg.description,
      ),
      advantages:    displayCurrencyText(
        savedAdvantages && !LEGACY_ADVANTAGE_TEXTS.has(savedAdvantages)
          ? savedAdvantages
          : cfg.advantages,
      ),
      minInvestment: null,
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
