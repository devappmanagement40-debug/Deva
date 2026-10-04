import { equal } from "node:assert/strict";
import { test } from "node:test";
import { isCountryCode } from "./country-codes";
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

test("registration and login schemas do not contain a country allowlist", () => {
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

  equal(registerSchema.safeParse({ ...registration, country: "GH" }).success, true);
  equal(registerSchema.safeParse({ ...registration, country: "CIV" }).success, false);
  equal(loginSchema.safeParse({ ...login, country: "GH" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "CIV" }).success, false);
});