export const APP_CURRENCY = "USDT";

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

export type CountryOption = Pick<ApiCountry, "code" | "name" | "phonePrefix" | "isActive">;

export function getCountryFlagEmoji(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return Array.from(code, letter =>
    String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65),
  ).join("");
}

async function fetchCountries(path: string): Promise<ApiCountry[]> {
  const response = await fetch(path, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Impossible de charger les pays (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Le serveur n’a pas renvoyé la liste des pays.");
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("Le format de la liste des pays est invalide.");
  return data as ApiCountry[];
}

export function fetchPublicCountries(): Promise<ApiCountry[]> {
  return fetchCountries("/api/countries");
}

export async function fetchLoginCountries(): Promise<CountryOption[]> {
  const countries = await fetchCountries("/api/auth/countries");
  return countries.map(({ code, name, phonePrefix, isActive }) => ({
    code,
    name,
    phonePrefix,
    isActive,
  }));
}

export function parseOperators(operatorsJson: string): string[] {
  try {
    const parsed: unknown = JSON.parse(operatorsJson);
    return Array.isArray(parsed)
      ? parsed.filter((operator): operator is string => typeof operator === "string")
      : [];
  } catch {
    return [];
  }
}

export function getPaymentMethodsForCountry(code: string, apiCountries: ApiCountry[]): string[] {
  const country = apiCountries.find(entry => entry.code === code && entry.isActive);
  return country ? parseOperators(country.operators) : [];
}

export function formatCurrency(amount: number, countryCode: string, apiCountries?: ApiCountry[]): string {
  return `${amount.toLocaleString()} XOF`;
}
