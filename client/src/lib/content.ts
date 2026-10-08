// Helper to read admin-editable text content from the /api/settings key-value map,
// falling back to the field's default when the setting is absent or empty.
import { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "@shared/withdrawal-fees";
import { DEFAULT_MIN_DEPOSIT_XOF, DEFAULT_MIN_WITHDRAWAL_XOF } from "@shared/financial-settings";

const PRESERVED_USDT_TERMS = /\bUSDT(?:\s+|-)(?:BEP20|TRC20|ERC20|BSC|MATIC)\b|\b(?:BEP20|TRC20|ERC20|POLYGON|ETH|MATIC|BSC)-USDT\b|\/USDT\b/gi;
const NON_MINING_ABOUT_TERMS = /(électri|electr|énerg|energy|mobilit|mobility|vélo|velo|scooter|cyclomoteur|recharg|charging)/i;
const ADMIN_CONFIGURED_VIP_COPY = "Chaque niveau VIP, de VIP 1 à VIP 7, est débloqué lorsque le total cumulé de vos achats personnels payants atteint le seuil configuré par l’administration. Sont comptés les achats Explore, Parcours et Offres dès leur confirmation, sans attendre la fin du cycle. Les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas. Certains produits Parcours exigent un niveau VIP minimum.";
const LEGACY_VIP_FAQ_COPY: Record<string, Record<string, string>> = {
  content_rulespage_parcoursAnswer: {
    "Après avoir acheté au moins un produit Explore actif, vous pouvez accéder à la gamme Parcours. Tous les produits Parcours ne sont pas automatiquement accessibles : chaque fiche peut comporter ses propres conditions, notamment un niveau VIP minimum. La progression VIP tient compte du total investi dans vos produits et des investissements de vos filleuls, selon les critères définis par l’administration.":
      "Après avoir acheté au moins un produit Explore actif, vous pouvez accéder à la gamme Parcours. Chaque produit Parcours peut avoir ses propres conditions, notamment un niveau VIP minimum. Le niveau VIP dépend du total cumulé de vos achats personnels payants dans Explore, Parcours et Offres; le seuil de chaque niveau, dès VIP 1, est configuré par l’administration. Les achats sont comptés dès leur confirmation; les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas.",
    "Après avoir acheté au moins un produit Explore actif, vous pouvez accéder à la gamme Parcours. Tous les produits Parcours ne sont pas automatiquement accessibles : chaque fiche peut comporter ses propres conditions, notamment un niveau VIP minimum. VIP 1 s’obtient après le premier achat personnel payant dans Parcours; les niveaux suivants dépendent du total de vos achats personnels payants, toutes catégories confondues. Les seuils sont définis par l’administration.":
      "Après avoir acheté au moins un produit Explore actif, vous pouvez accéder à la gamme Parcours. Chaque produit Parcours peut avoir ses propres conditions, notamment un niveau VIP minimum. Le niveau VIP dépend du total cumulé de vos achats personnels payants dans Explore, Parcours et Offres; le seuil de chaque niveau, dès VIP 1, est configuré par l’administration. Les achats sont comptés dès leur confirmation; les produits gratuits, attribués par l’administration et les achats de vos filleuls ne comptent pas.",
  },
  content_rulespage_vipProgressAnswer: {
    "La progression VIP prend en compte le total investi dans vos produits ainsi que les investissements de vos filleuls. Les seuils et conditions de chaque niveau sont définis par l’administration; certains produits Parcours nécessitent d’atteindre un niveau VIP précis.":
      ADMIN_CONFIGURED_VIP_COPY,
    "Le premier achat personnel payant dans Parcours donne au moins le rang VIP 1. Pour atteindre les niveaux suivants, le système additionne vos achats personnels payants dans toutes les catégories : Explore, Parcours et Offres. Les achats gratuits, les produits attribués par l’administration et les achats de vos filleuls ne comptent pas. Les seuils sont configurés par l’administration; certains produits Parcours exigent un niveau VIP minimum.":
      ADMIN_CONFIGURED_VIP_COPY,
    "Le premier achat personnel payant dans Parcours donne au moins le rang VIP 1. Pour atteindre les niveaux suivants, le système additionne vos achats personnels payants dans toutes les catégories : Explore, Parcours et Offres. Chaque achat est compté dès qu’il est confirmé, sans attendre la fin de son cycle. Les achats gratuits, les produits attribués par l’administration et les achats de vos filleuls ne comptent pas. Les seuils sont configurés par l’administration; certains produits Parcours exigent un niveau VIP minimum.":
      ADMIN_CONFIGURED_VIP_COPY,
  },
};

export function displayCurrencyText(value: string): string {
  const preservedTerms: string[] = [];
  const protectedValue = value.replace(PRESERVED_USDT_TERMS, (term) => {
    const index = preservedTerms.push(term) - 1;
    return `\uE000${index}\uE001`;
  });

  return protectedValue
    .replace(/\bUSDT\b/gi, "XOF")
    .replace(/\uE000(\d+)\uE001/g, (_match, index: string) => preservedTerms[Number(index)] ?? "");
}

export function rebrandText(value: string): string {
  return displayCurrencyText(value.replace(/\b(?:TGOOD|TGOOG|IELP)\b/gi, "DIAMANT"));
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
  return rebrandText(displayValue && !containsOutOfScopeAboutCopy ? displayValue : fallback);
}

const DEFAULT_SETTING_PLACEHOLDERS = {
  minDeposit: String(DEFAULT_MIN_DEPOSIT_XOF),
  minWithdrawal: String(DEFAULT_MIN_WITHDRAWAL_XOF),
  withdrawalFees: String(DEFAULT_WITHDRAWAL_FEE_PERCENT),
} as const;

export function formatSettingPlaceholders(
  value: string,
  settings: Record<string, string> | undefined,
): string {
  return value.replace(
    /\{\{\s*(minDeposit|minWithdrawal|withdrawalFees)\s*\}\}/g,
    (_match, key: keyof typeof DEFAULT_SETTING_PLACEHOLDERS) => {
      const rawValue = settings?.[key] ?? DEFAULT_SETTING_PLACEHOLDERS[key];
      if (key === "withdrawalFees") {
        const percent = Number(rawValue);
        return Number.isFinite(percent) && percent >= 0 && percent <= 99
          ? percent.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
          : DEFAULT_SETTING_PLACEHOLDERS.withdrawalFees;
      }
      const amount = Number.parseInt(rawValue, 10);
      return Number.isSafeInteger(amount) && amount >= 0
        ? amount.toLocaleString("fr-FR")
        : Number.parseInt(DEFAULT_SETTING_PLACEHOLDERS[key], 10).toLocaleString("fr-FR");
    },
  );
}
