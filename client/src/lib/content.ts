// Helper to read admin-editable text content from the /api/settings key-value map,
// falling back to the field's default when the setting is absent or empty.
import { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "@shared/withdrawal-fees";
import { DEFAULT_MIN_DEPOSIT_USDT, DEFAULT_MIN_WITHDRAWAL_USDT } from "@shared/financial-settings";

const NON_MINING_ABOUT_TERMS = /(électri|electr|énerg|energy|mobilit|mobility|vélo|velo|scooter|cyclomoteur|recharg|charging)/i;
const OBSOLETE_PAYMENT_COPY = /\b(?:XOF|FCFA)\b|mobile[\s-]?money|\b(?:wave|westpay)\b|orange\s+money|moov\s+money|tmoney/i;
const FINANCIAL_INSTRUCTION_KEYS = new Set([
  "content_rules_section1Body",
  "content_rules_section2Body",
  "content_withdrawal_instruction1",
  "content_withdrawal_instruction5",
  "content_home_popupTitle",
  "content_home_popupLine1",
  "content_home_popupLine2",
  "content_home_popupLine3",
  "content_home_popupLine4",
  "content_home_popupLine5",
  "content_home_popupLine6",
  "content_home_popupLine7",
  "content_home_popupLine8",
  "content_rulespage_depositAnswer",
  "content_rulespage_withdrawalAnswer",
]);
const PARCOURS_FAQ_COPY = "Un produit Explore actif reste obligatoire, mais ne suffit pas. Chaque fiche Parcours peut exiger un montant cumulatif d’investissement personnel avant l’achat. Tous vos achats personnels payants confirmés en USDT dans Explore, Parcours et Offres comptent pour ce montant; les produits gratuits, attribués par l’administration et les achats de filleuls ne comptent pas. Le premier produit Parcours n’exige pas de VIP préalable et attribue VIP 1 après l’achat.";
const VIP_PROGRESS_FAQ_COPY = "Les rangs VIP sont attribués uniquement lors de l’achat d’un produit Parcours, selon l’ordre du catalogue : le premier attribue VIP 1, puis chaque produit suivant attribue le rang correspondant à sa position. Explore et Offres augmentent le total d’investissement personnel requis, mais ne donnent pas de rang VIP. Les achats personnels payants sont comptés dès leur confirmation; les produits gratuits, attribués par l’administration et les achats de filleuls sont exclus.";
const LEGACY_VIP_FAQ_COPY: Record<string, Record<string, string>> = {
  content_rulespage_parcoursAnswer: {
    "Après avoir acheté au moins un produit Explore actif, vous pouvez accéder à la gamme Parcours. Tous les produits Parcours ne sont pas automatiquement accessibles : chaque fiche peut comporter ses propres conditions, notamment un niveau VIP minimum. La progression VIP tient compte du total investi dans vos produits et des investissements de vos filleuls, selon les critères définis par l’administration.":
      PARCOURS_FAQ_COPY,
    "Après avoir acheté au moins un produit Explore actif, vous pouvez accéder à la gamme Parcours. Tous les produits Parcours ne sont pas automatiquement accessibles : chaque fiche peut comporter ses propres conditions, notamment un niveau VIP minimum. VIP 1 s’obtient après le premier achat personnel payant dans Parcours; les niveaux suivants dépendent du total de vos achats personnels payants, toutes catégories confondues. Les seuils sont définis par l’administration.":
      PARCOURS_FAQ_COPY,
    "L’achat d’un produit Explore actif reste nécessaire, mais ne suffit pas à débloquer Parcours. Le premier produit Parcours exige aussi le niveau VIP 1; les produits suivants peuvent exiger un niveau supérieur selon leur fiche. Le niveau VIP dépend du total cumulé de vos achats personnels payants dans Explore, Parcours et Offres, selon les seuils USDT configurés par l’administration. Les achats sont comptés dès leur confirmation; les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas.":
      PARCOURS_FAQ_COPY,
  },
  content_rulespage_productAccessAnswer: {
    "Oui. Il faut posséder au moins un produit Explore actif pour acheter Parcours ou Offres. Pour Parcours, il faut aussi atteindre le niveau VIP minimum du produit; le premier exige au moins VIP 1. Un produit terminé, révoqué ou inactif ne satisfait pas la condition Explore.":
      "Oui. Il faut posséder au moins un produit Explore actif pour acheter Parcours ou Offres. Chaque produit Parcours applique aussi son montant minimum configuré; le premier produit Parcours ne demande pas de VIP préalable. Un produit terminé, révoqué ou inactif ne satisfait pas la condition Explore.",
  },
  content_rulespage_vipProgressAnswer: {
    "La progression VIP prend en compte le total investi dans vos produits ainsi que les investissements de vos filleuls. Les seuils et conditions de chaque niveau sont définis par l’administration; certains produits Parcours nécessitent d’atteindre un niveau VIP précis.":
      VIP_PROGRESS_FAQ_COPY,
    "Le premier achat personnel payant dans Parcours donne au moins le rang VIP 1. Pour atteindre les niveaux suivants, le système additionne vos achats personnels payants dans toutes les catégories : Explore, Parcours et Offres. Les achats gratuits, les produits attribués par l’administration et les achats de vos filleuls ne comptent pas. Les seuils sont configurés par l’administration; certains produits Parcours exigent un niveau VIP minimum.":
      VIP_PROGRESS_FAQ_COPY,
    "Le premier achat personnel payant dans Parcours donne au moins le rang VIP 1. Pour atteindre les niveaux suivants, le système additionne vos achats personnels payants dans toutes les catégories : Explore, Parcours et Offres. Chaque achat est compté dès qu’il est confirmé, sans attendre la fin de son cycle. Les achats gratuits, les produits attribués par l’administration et les achats de vos filleuls ne comptent pas. Les seuils sont configurés par l’administration; certains produits Parcours exigent un niveau VIP minimum.":
      VIP_PROGRESS_FAQ_COPY,
    "Chaque niveau VIP, de VIP 1 à VIP 7, est débloqué lorsque le total cumulé de vos achats personnels payants atteint le seuil configuré par l’administration. Sont comptés les achats Explore, Parcours et Offres dès leur confirmation, sans attendre la fin du cycle. Les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas. Certains produits Parcours exigent un niveau VIP minimum.":
      VIP_PROGRESS_FAQ_COPY,
  },
  content_rulespage_vipThresholdsTitle: {
    "Seuils actuels des niveaux VIP": "Montants requis par produit Parcours",
  },
  content_rulespage_vipThresholdsAnswer: {
    "Les montants ci-dessous sont les seuils cumulatifs configurés dans l’administration. Les achats personnels payants en USDT sont additionnés dès leur confirmation.":
      "L’administration configure le montant cumulatif minimum sur chaque fiche Parcours. Le total comprend les achats personnels payants confirmés en Explore, Parcours et Offres; l’achat du produit Parcours attribue ensuite le rang indiqué par l’ordre du catalogue.",
  },
  content_rulespage_parcoursRequirementsQuestion: {
    "Quel niveau VIP est requis pour chaque produit Parcours ?": "Quel montant et quel rang chaque produit Parcours applique-t-il ?",
  },
  content_rulespage_parcoursRequirementsAnswer: {
    "Le premier produit Parcours exige au minimum VIP 1; les niveaux minimums des autres fiches restent configurables. Le seuil USDT associé à chaque niveau est actualisé automatiquement. Il faut aussi posséder un produit Explore actif.":
      "Chaque produit affiche son montant minimum d’investissement personnel cumulé, le niveau VIP minimum d’accès et le rang qu’il attribue après achat. Le premier produit attribue VIP 1 sans exiger de VIP préalable; les suivants exigent automatiquement le rang précédent. Il faut aussi posséder un produit Explore actif.",
  },
};

export function displayCurrencyText(value: string): string {
  return value;
}

export function rebrandText(value: string): string {
  return displayCurrencyText(value.replace(/\b(?:TGOOD|TGOOG|IELP)\b/gi, "DIAMANT"));
}

export function hasObsoletePaymentCopy(value: string): boolean {
  return OBSOLETE_PAYMENT_COPY.test(value);
}

export function getContent(
  settings: Record<string, string> | undefined,
  key: string,
  fallback: string
): string {
  const value = settings?.[key];
  const configuredValue = value !== undefined && value.trim() !== "" ? value : undefined;
  const updatedKnownDefault = configuredValue
    ? LEGACY_VIP_FAQ_COPY[key]?.[configuredValue]
    : undefined;
  const displayValue = updatedKnownDefault ?? configuredValue;
  const containsOutOfScopeAboutCopy =
    key.startsWith("content_about_") &&
    displayValue !== undefined &&
    NON_MINING_ABOUT_TERMS.test(displayValue);
  const isFinancialInstructionKey =
    FINANCIAL_INSTRUCTION_KEYS.has(key) ||
    key.startsWith("content_deposit_") ||
    key.startsWith("content_withdrawal_instruction") ||
    key.startsWith("content_rules_section");
  const containsObsoleteFinancialCopy =
    isFinancialInstructionKey &&
    displayValue !== undefined &&
    hasObsoletePaymentCopy(displayValue);
  return rebrandText(displayValue && !containsOutOfScopeAboutCopy && !containsObsoleteFinancialCopy ? displayValue : fallback);
}

const DEFAULT_SETTING_PLACEHOLDERS = {
  minDeposit: DEFAULT_MIN_DEPOSIT_USDT,
  minWithdrawal: DEFAULT_MIN_WITHDRAWAL_USDT,
  withdrawalFees: String(DEFAULT_WITHDRAWAL_FEE_PERCENT),
} as const;

export function formatSettingPlaceholders(
  value: string,
  settings: Record<string, string> | undefined,
): string {
  return value.replace(
    /\{\{\s*(minDeposit|minWithdrawal|withdrawalFees)\s*\}\}/g,
    (_match, key: keyof typeof DEFAULT_SETTING_PLACEHOLDERS) => {
      const settingKey = key === "minDeposit" ? "minDepositUsdt" : key === "minWithdrawal" ? "minWithdrawalUsdt" : key;
      const rawValue = settings?.[settingKey] ?? DEFAULT_SETTING_PLACEHOLDERS[key];
      if (key === "withdrawalFees") {
        const percent = Number(rawValue);
        return Number.isFinite(percent) && percent >= 0 && percent <= 99
          ? percent.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
          : DEFAULT_SETTING_PLACEHOLDERS.withdrawalFees;
      }
      const normalizedValue = String(rawValue).trim();
      const amount = /^\d{1,15}(?:\.\d{1,6})?$/.test(normalizedValue)
        ? Number(normalizedValue)
        : Number.NaN;
      const displayAmount = Number.isFinite(amount) && amount >= 0
        ? amount
        : Number(DEFAULT_SETTING_PLACEHOLDERS[key]);
      return displayAmount.toLocaleString("fr-FR", {
        minimumFractionDigits: key === "minWithdrawal" ? 2 : 0,
        maximumFractionDigits: 6,
      });
    },
  );
}
