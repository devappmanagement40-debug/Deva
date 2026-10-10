import { getCountries } from "libphonenumber-js";

export type CountryCode = string;

export const SUPPORTED_MARKET_COUNTRY_CODES = ["CI", "TG"] as const;
export type SupportedMarketCountryCode = (typeof SUPPORTED_MARKET_COUNTRY_CODES)[number];
export type CustomerMarket = "legacy" | "international";
export type MarketCurrency = "XOF" | "USDT";

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

export function getCustomerMarket(countryCode: unknown): CustomerMarket {
  // New account activity now uses one global USDT market. Country is still
  // retained for identity and historical records, but no longer selects XOF.
  void countryCode;
  return "international";
}

export function getMarketCurrency(market: CustomerMarket): MarketCurrency {
  return market === "international" ? "USDT" : "XOF";
}