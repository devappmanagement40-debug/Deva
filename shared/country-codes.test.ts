import { equal } from "node:assert/strict";
import { test } from "node:test";
import {
  isCountryCode,
  isSupportedMarketCountryCode,
  SUPPORTED_MARKET_COUNTRY_CODES,
} from "./country-codes";
import { loginSchema, registerSchema } from "./schema";

test("country code validation accepts any uppercase ISO alpha-2 code", () => {
  equal(isCountryCode("CI"), true);
  equal(isCountryCode("TG"), true);
  equal(isCountryCode("US"), true);
  equal(isCountryCode("GH"), true);
  equal(isCountryCode("ci"), false);
  equal(isCountryCode("CIV"), false);
  equal(isCountryCode("1A"), false);
});

test("only Côte d'Ivoire and Togo are supported customer markets", () => {
  equal(SUPPORTED_MARKET_COUNTRY_CODES.join(","), "CI,TG");
  equal(isSupportedMarketCountryCode("CI"), true);
  equal(isSupportedMarketCountryCode("TG"), true);
  equal(isSupportedMarketCountryCode("CD"), false);
  equal(isSupportedMarketCountryCode("GH"), false);
});

test("registration and login reject countries outside the supported markets", () => {
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
  equal(registerSchema.safeParse({ ...registration, country: "CD" }).success, false);
  equal(registerSchema.safeParse({ ...registration, country: "CIV" }).success, false);
  equal(loginSchema.safeParse({ ...login, country: "CI" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "TG" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "CD" }).success, false);
  equal(loginSchema.safeParse({ ...login, country: "CIV" }).success, false);
});