// Helper to read admin-editable text content from the /api/settings key-value map,
// falling back to the field's default when the setting is absent or empty.
import { DEFAULT_WITHDRAWAL_FEE_PERCENT } from "@shared/withdrawal-fees";

const PRESERVED_USDT_TERMS = /\bUSDT(?:\s+|-)(?:BEP20|TRC20|ERC20|BSC|MATIC)\b|\b(?:BEP20|TRC20|ERC20|POLYGON|ETH|MATIC|BSC)-USDT\b|\/USDT\b/gi;
const NON_MINING_ABOUT_TERMS = /(électri|electr|énerg|energy|mobilit|mobility|vélo|velo|scooter|cyclomoteur|recharg|charging)/i;

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
  const containsOutOfScopeAboutCopy =
    key.startsWith("content_about_") &&
    configuredValue !== undefined &&
    NON_MINING_ABOUT_TERMS.test(configuredValue);
  return rebrandText(configuredValue && !containsOutOfScopeAboutCopy ? configuredValue : fallback);
}

const DEFAULT_SETTING_PLACEHOLDERS = {
  minDeposit: "2500",
  minWithdrawal: "1000",
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
