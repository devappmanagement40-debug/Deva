import { equal } from "node:assert/strict";
import { test } from "node:test";
import {
  getCustomerMarket,
  isCountryCode,
  isSupportedMarketCountryCode,
  SUPPORTED_MARKET_COUNTRY_CODES,
} from "./country-codes";
import { loginSchema, registerSchema } from "./schema";
import { AUTH_COUNTRY_CATALOG, DEFAULT_AUTH_COUNTRY_CODE } from "./auth-country-catalog";

test("country code validation accepts known uppercase phone regions", () => {
  equal(isCountryCode("CI"), true);
  equal(isCountryCode("TG"), true);
  equal(isCountryCode("US"), true);
  equal(isCountryCode("GH"), true);
  equal(isCountryCode("ci"), false);
  equal(isCountryCode("CIV"), false);
  equal(isCountryCode("1A"), false);
});

test("country metadata remains available while every country uses the global market", () => {
  equal(SUPPORTED_MARKET_COUNTRY_CODES.join(","), "CI,TG");
  equal(isSupportedMarketCountryCode("CI"), true);
  equal(isSupportedMarketCountryCode("TG"), true);
  equal(isSupportedMarketCountryCode("CD"), false);
  equal(isSupportedMarketCountryCode("GH"), false);
  equal(getCustomerMarket("CI"), "international");
  equal(getCustomerMarket("TG"), "international");
  equal(getCustomerMarket("CD"), "international");
  equal(getCustomerMarket("US"), "international");
});

test("registration and login accept phone countries worldwide and reject invalid codes", () => {
  const registration = {
    fullName: "Test Account",
    phone: "0123456789",
    password: "strongpass",
    captchaCode: "abc123",
  };
  const login = {
    phone: "0123456789",
    password: "strongpass",
  };

  equal(registerSchema.safeParse({ ...registration, country: "CI" }).success, true);
  equal(registerSchema.safeParse({ ...registration, country: "TG" }).success, true);
  equal(registerSchema.safeParse({ ...registration, country: "CD" }).success, true);
  equal(registerSchema.safeParse({ ...registration, country: "GH" }).success, true);
  equal(registerSchema.safeParse({ ...registration, country: "US" }).success, true);
  equal(registerSchema.safeParse({ ...registration, country: "CIV" }).success, false);
  equal(registerSchema.safeParse({ ...registration, country: "ZZ" }).success, false);
  equal(loginSchema.safeParse({ ...login, country: "CI" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "TG" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "CD" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "GH" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "US" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "CIV" }).success, false);
  equal(loginSchema.safeParse({ ...login, country: "ZZ" }).success, false);
});

test("authentication country catalog includes international names and calling prefixes", () => {
  equal(AUTH_COUNTRY_CATALOG.length >= 240, true);
  const plusOneCount = AUTH_COUNTRY_CATALOG.filter((country) => country.phonePrefix === "1").length;
  equal(plusOneCount > 0, true);
  equal(AUTH_COUNTRY_CATALOG.slice(0, plusOneCount).every((country) => country.phonePrefix === "1"), true);
  equal(AUTH_COUNTRY_CATALOG.slice(plusOneCount).some((country) => country.phonePrefix === "1"), false);
  equal(AUTH_COUNTRY_CATALOG.find((country) => country.code === "CI")?.phonePrefix, "225");
  equal(AUTH_COUNTRY_CATALOG.find((country) => country.code === "US")?.phonePrefix, "1");
  equal(AUTH_COUNTRY_CATALOG.find((country) => country.code === DEFAULT_AUTH_COUNTRY_CODE)?.phonePrefix, "1");
  equal(AUTH_COUNTRY_CATALOG.every((country) => country.name.length > 0 && /^\d+$/.test(country.phonePrefix)), true);
});