import assert from "node:assert/strict";
import test from "node:test";
import { getContent, hasObsoletePaymentCopy } from "./content";

test("home announcement replaces stored legacy currency and payment-method copy", () => {
  const settings = {
    content_home_popupLine2: "Dépôts par Mobile Money et USDT BEP20.",
    content_home_popupLine3: "Minimum : 13 000 XOF.",
  };

  assert.equal(
    getContent(settings, "content_home_popupLine2", "Dépôts crypto en USDT uniquement."),
    "Dépôts crypto en USDT uniquement.",
  );
  assert.equal(
    getContent(settings, "content_home_popupLine3", "Minimum : {{minDeposit}} USDT."),
    "Minimum : {{minDeposit}} USDT.",
  );
});

test("financial CMS copy falls back when old payment methods are still saved", () => {
  assert.equal(
    getContent(
      { content_deposit_infoText: "Paiement via Wave ou Mobile Money." },
      "content_deposit_infoText",
      "Dépôts crypto USDT uniquement.",
    ),
    "Dépôts crypto USDT uniquement.",
  );
  assert.equal(
    getContent(
      { content_withdrawal_instruction5: "Choisissez un compte Mobile Money." },
      "content_withdrawal_instruction5",
      "Adresse USDT BEP20 uniquement.",
    ),
    "Adresse USDT BEP20 uniquement.",
  );
});

test("obsolete payment copy detection is case-insensitive and leaves USDT BEP20 copy alone", () => {
  assert.equal(hasObsoletePaymentCopy("Retrait FCFA"), true);
  assert.equal(hasObsoletePaymentCopy("Dépôt USDT BEP20"), false);
});
