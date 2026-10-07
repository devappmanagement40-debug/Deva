export type CountryCode = string;

export const SUPPORTED_MARKET_COUNTRY_CODES = ["CI", "TG"] as const;
export type SupportedMarketCountryCode = (typeof SUPPORTED_MARKET_COUNTRY_CODES)[number];

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && /^[A-Z]{2}$/.test(value);
}

export function isSupportedMarketCountryCode(
  value: unknown,
): value is SupportedMarketCountryCode {
  return typeof value === "string" &&
    SUPPORTED_MARKET_COUNTRY_CODES.some((code) => code === value.toUpperCase());
}