export type CountryCode = string;

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && /^[A-Z]{2}$/.test(value);
}