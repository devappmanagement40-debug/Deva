// Helper to read admin-editable text content from the /api/settings key-value map,
// falling back to the field's default when the setting is absent or empty.

const PRESERVED_USDT_TERMS = /\bUSDT(?:\s+|-)(?:BEP20|TRC20|ERC20|BSC|MATIC)\b|\b(?:BEP20|TRC20|ERC20|POLYGON|ETH|MATIC|BSC)-USDT\b|\/USDT\b/gi;

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
  return rebrandText(value !== undefined && value.trim() !== "" ? value : fallback);
}
