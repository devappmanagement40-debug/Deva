// Helper to read admin-editable text content from the /api/settings key-value map,
// falling back to the field's default when the setting is absent or empty.

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

const DEFAULT_AMOUNT_SETTINGS = {
  minDeposit: "2500",
  minWithdrawal: "1000",
} as const;

export function formatSettingPlaceholders(
  value: string,
  settings: Record<string, string> | undefined,
): string {
  return value.replace(/\{\{\s*(minDeposit|minWithdrawal)\s*\}\}/g, (_match, key: keyof typeof DEFAULT_AMOUNT_SETTINGS) => {
    const amount = Number.parseInt(settings?.[key] ?? DEFAULT_AMOUNT_SETTINGS[key], 10);
    return Number.isSafeInteger(amount) && amount >= 0
      ? amount.toLocaleString("fr-FR")
      : Number.parseInt(DEFAULT_AMOUNT_SETTINGS[key], 10).toLocaleString("fr-FR");
  });
}
