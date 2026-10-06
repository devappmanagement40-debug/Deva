import assert from "node:assert/strict";
import test from "node:test";
import { getSafeWithdrawalErrorMessage } from "./withdrawal-errors";

test("shows the specific safe reason for a failed withdrawal", () => {
  assert.equal(
    getSafeWithdrawalErrorMessage(new Error("Solde insuffisant"), "request", "PIN incorrect"),
    "Solde de gains insuffisant.",
  );
});

test("does not expose internal error details or secrets in a withdrawal toast", () => {
  const internalError = new Error("Database password=private-value at /srv/private/route.ts");
  const message = getSafeWithdrawalErrorMessage(internalError, "request", "PIN incorrect");

  assert.equal(message, "Le retrait n’a pas pu être confirmé. Consultez l’historique avant de réessayer.");
  assert.equal(message.includes("private-value"), false);
  assert.equal(message.includes("/srv/private"), false);
});

test("uses the PIN-specific message when the API identifies an invalid PIN", () => {
  const error = Object.assign(new Error("raw server detail"), { code: "INVALID_TRANSACTION_PIN" });

  assert.equal(
    getSafeWithdrawalErrorMessage(error, "request", "Code PIN de retrait incorrect."),
    "Code PIN de retrait incorrect.",
  );
});

test("preserves safe amount-limit details without exposing arbitrary server text", () => {
  const message = getSafeWithdrawalErrorMessage(
    new Error("Montant minimum : 2 500 XOF"),
    "request",
    "PIN incorrect",
  );

  assert.match(message, /^Le montant minimum de retrait est 2\s?500 XOF\.$/);
});

test("warns users to check history after a lost withdrawal connection", () => {
  assert.equal(
    getSafeWithdrawalErrorMessage(new TypeError("Failed to fetch"), "request", "PIN incorrect"),
    "Connexion interrompue. Consultez l’historique avant de réessayer.",
  );
});
