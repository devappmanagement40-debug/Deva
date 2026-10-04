import { deepEqual, equal } from "node:assert/strict";
import { test } from "node:test";
import { AUTH_COUNTRIES, isAuthCountryCode } from "./auth-countries";
import { loginSchema, registerSchema } from "./schema";

test("auth country allowlist contains only Côte d’Ivoire and Togo", () => {
  deepEqual(AUTH_COUNTRIES.map(({ code }) => code), ["CI", "TG"]);
  equal(isAuthCountryCode("CI"), true);
  equal(isAuthCountryCode("TG"), true);
  equal(isAuthCountryCode("US"), false);
  equal(isAuthCountryCode("CD"), false);
});

test("registration and login reject countries outside the auth allowlist", () => {
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
  equal(registerSchema.safeParse({ ...registration, country: "US" }).success, false);
  equal(loginSchema.safeParse({ ...login, country: "CI" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "TG" }).success, true);
  equal(loginSchema.safeParse({ ...login, country: "US" }).success, false);
});