import assert from "node:assert/strict";
import test from "node:test";
import { formatDepositGuidanceContent } from "./deposit-guidance";

test("updates legacy French minimum-deposit copy and replaces its old unit with USDT", () => {
  assert.equal(
    formatDepositGuidanceContent(
      "Le dépôt minimum est de 18 XOF. Le crédit intervient après confirmation.",
      "5 000",
    ),
    "Le dépôt minimum est de 5 000 USDT. Le crédit intervient après confirmation.",
  );
});

test("updates English minimum-deposit copy and supports an admin placeholder", () => {
  assert.equal(
    formatDepositGuidanceContent("The minimum deposit is 18 XOF.", "7,000"),
    "The minimum deposit is 7,000 USDT.",
  );
  assert.equal(
    formatDepositGuidanceContent("Minimum recharge: {{minDeposit}} XOF.", "7,000"),
    "Minimum recharge: 7,000 USDT.",
  );
});

test("removes obsolete payment instructions while keeping USDT network names", () => {
  assert.equal(
    formatDepositGuidanceContent("Recharge par Mobile Money. Réseau USDT BEP20.", "5 000"),
    "Réseau USDT BEP20.",
  );
  assert.equal(
    formatDepositGuidanceContent("Frais de 500 XOF. Dépôt confirmé en USDT.", "5 000"),
    "Dépôt confirmé en USDT.",
  );
});