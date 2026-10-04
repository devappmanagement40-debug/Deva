import assert from "node:assert/strict";
import test from "node:test";
import { formatDepositGuidanceContent } from "./deposit-guidance";

test("updates legacy French minimum-deposit copy to the current admin amount", () => {
  assert.equal(
    formatDepositGuidanceContent(
      "Le dépôt minimum est de 18 XOF. Le crédit intervient après confirmation.",
      "5 000",
    ),
    "Le dépôt minimum est de 5 000 XOF. Le crédit intervient après confirmation.",
  );
});

test("updates English minimum-deposit copy and supports an admin placeholder", () => {
  assert.equal(
    formatDepositGuidanceContent("The minimum deposit is 18 XOF.", "7,000"),
    "The minimum deposit is 7,000 XOF.",
  );
  assert.equal(
    formatDepositGuidanceContent("Minimum recharge: {{minDeposit}} XOF.", "7,000"),
    "Minimum recharge: 7,000 XOF.",
  );
});

test("keeps active payment methods and USDT network names unchanged", () => {
  assert.equal(
    formatDepositGuidanceContent("Recharge par Mobile Money ou USDT BEP20.", "5 000"),
    "Recharge par Mobile Money ou USDT BEP20.",
  );
});