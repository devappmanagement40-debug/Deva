export const AUTH_COUNTRY_CODES = ["CI", "TG"] as const;

export type AuthCountryCode = (typeof AUTH_COUNTRY_CODES)[number];

export const DEFAULT_AUTH_COUNTRY_CODE: AuthCountryCode = "CI";

export const AUTH_COUNTRIES = [
  { code: "CI", name: "Côte d’Ivoire", phonePrefix: "225" },
  { code: "TG", name: "Togo", phonePrefix: "228" },
] as const satisfies readonly {
  code: AuthCountryCode;
  name: string;
  phonePrefix: string;
}[];

export function isAuthCountryCode(value: unknown): value is AuthCountryCode {
  return typeof value === "string" &&
    (AUTH_COUNTRY_CODES as readonly string[]).includes(value);
}