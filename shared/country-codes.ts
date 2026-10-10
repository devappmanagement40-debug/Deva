import { getCountries } from "libphonenumber-js";

export type CountryCode = string;

export const SUPPORTED_MARKET_COUNTRY_CODES = ["CI", "TG"] as const;
export type SupportedMarketCountryCode = (typeof SUPPORTED_MARKET_COUNTRY_CODES)[number];

const phoneCountryCodes = new Set<string>(getCountries());

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && phoneCountryCodes.has(value);
}

export function isSupportedMarketCountryCode(
  value: unknown,
): value is SupportedMarketCountryCode {
  return typeof value === "string" &&
    SUPPORTED_MARKET_COUNTRY_CODES.some((code) => code === value.toUpperCase());
}