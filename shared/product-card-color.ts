export const DEFAULT_PRODUCT_CARD_COLOR = "#f5f7ff";

const PRODUCT_CARD_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function isValidProductCardColor(value: unknown): value is string {
  return typeof value === "string" && PRODUCT_CARD_COLOR_PATTERN.test(value);
}

export function normalizeProductCardColor(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (!isValidProductCardColor(value)) {
    throw new Error("La couleur doit être au format hexadécimal #RRGGBB");
  }
  return value.toLowerCase();
}
