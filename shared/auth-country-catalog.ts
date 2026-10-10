import { getCountries, getCountryCallingCode } from "libphonenumber-js";

export const DEFAULT_AUTH_COUNTRY_CODE = "US";

export type AuthCountryOption = {
  id: number;
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  operators: string;
  isActive: boolean;
  autoPaymentEnabled: boolean;
};

const regionNames = new Intl.DisplayNames(["fr"], { type: "region" });

export const AUTH_COUNTRY_CATALOG: AuthCountryOption[] = getCountries()
  .map((code, index) => ({
    id: index + 1,
    code,
    name: regionNames.of(code) || code,
    currency: "USDT",
    phonePrefix: getCountryCallingCode(code),
    operators: "[]",
    isActive: true,
    autoPaymentEnabled: false,
  }))
  .sort(
    (a, b) =>
      Number(b.phonePrefix === "1") - Number(a.phonePrefix === "1") ||
      a.name.localeCompare(b.name, "fr"),
  );
