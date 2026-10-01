export const APP_CURRENCY = "USDT";

// Fallback country data (used if API not available)
export const COUNTRIES = [
  { code: "CD", name: "République démocratique du Congo", flag: "CD", currency: APP_CURRENCY, paymentMethods: ["Airtel Money RDC", "Orange Money RDC", "M-Pesa RDC"] },
];

export const FALLBACK_COUNTRIES = [
  { code: "CD", name: "République démocratique du Congo", currency: APP_CURRENCY, phonePrefix: "243", phoneLength: 9, operators: ["Airtel Money RDC", "Orange Money RDC", "M-Pesa RDC"] },
];

/** Retourne le nombre de chiffres attendu pour un numéro de téléphone selon le pays. */
export function getPhoneLength(countryCode: string): number {
  const c = FALLBACK_COUNTRIES.find(c => c.code === countryCode);
  return c?.phoneLength ?? 9;
}

// Legacy compatibility - kept for places still using ELIGIBLE_COUNTRIES directly
export const ELIGIBLE_COUNTRIES = FALLBACK_COUNTRIES.map(c => ({
  code: c.code,
  name: c.name,
  flag: c.code,
  currency: c.currency,
  phonePrefix: c.phonePrefix,
  paymentMethods: c.operators,
})) as readonly { code: string; name: string; flag: string; currency: string; phonePrefix: string; paymentMethods: readonly string[] }[];

export type ApiCountry = {
  id: number;
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  operators: string; // JSON string
  isActive: boolean;
  autoPaymentEnabled: boolean;
};

/**
 * The login and registration pages must remain usable while a new domain's
 * reverse proxy is being configured. A Plesk 404 page is HTML, not a country
 * response; treat that response as an unavailable optional API instead of
 * turning it into an unhandled query error.
 */
export async function fetchPublicCountries(): Promise<ApiCountry[]> {
  try {
    const response = await fetch("/api/countries", { credentials: "include" });
    if (!response.ok) return [];

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) return [];

    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as ApiCountry[]) : [];
  } catch {
    return [];
  }
}

export function parseOperators(operatorsJson: string): string[] {
  try {
    return JSON.parse(operatorsJson);
  } catch {
    return [];
  }
}

export function getCountryByCode(code: string, apiCountries?: ApiCountry[]) {
  if (apiCountries && apiCountries.length > 0) {
    // API data is loaded — only use it, never fall back to hardcoded data
    // This ensures disabled countries and updated operators are respected
    const c = apiCountries.find(c => c.code === code && c.isActive);
    if (!c) return undefined;
    return {
      code: c.code,
      name: c.name,
      currency: APP_CURRENCY,
      phonePrefix: c.phonePrefix,
      paymentMethods: parseOperators(c.operators),
    };
  }
  // API not yet loaded — use hardcoded fallback temporarily
  const fallback = FALLBACK_COUNTRIES.find(c => c.code === code);
  if (!fallback) return undefined;
  return {
    code: fallback.code,
    name: fallback.name,
    currency: APP_CURRENCY,
    phonePrefix: fallback.phonePrefix,
    paymentMethods: fallback.operators,
  };
}

export function getPaymentMethodsForCountry(code: string, apiCountries?: ApiCountry[]): string[] {
  const country = getCountryByCode(code, apiCountries);
  return country ? [...country.paymentMethods] : [];
}

export function formatCurrency(amount: number, countryCode: string, apiCountries?: ApiCountry[]): string {
  return `${amount.toLocaleString()} XOF`;
}
