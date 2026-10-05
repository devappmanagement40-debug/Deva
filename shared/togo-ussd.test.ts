import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidTogoUssdTemplate,
  renderTogoUssdTemplate,
} from "./togo-ussd";

test("renders configured Togo payment values into the USSD template", () => {
  assert.equal(
    renderTogoUssdTemplate("*145*5*{amount}*{number}#", {
      amount: 5000,
      number: "130 5150",
      phone: "93 25 63 28",
      currency: "XOF",
      operator: "Yas Togo",
    }),
    "*145*5*5000*1305150#",
  );
});

test("supports the payer phone aliases and case-insensitive tokens", () => {
  assert.equal(
    renderTogoUssdTemplate("*123*{PAYERPHONE}*{currency}*{Amount}#", {
      amount: 5000,
      number: "1305150",
      phone: "+228 93 25 63 28",
      currency: "XOF",
      operator: "Moov",
    }),
    "*123*93256328*XOF*5000#",
  );
});

test("rejects missing, malformed, and unsupported Togo templates", () => {
  assert.equal(isValidTogoUssdTemplate(""), false);
  assert.equal(isValidTogoUssdTemplate("*123*{mystery}#"), false);
  assert.equal(isValidTogoUssdTemplate("*123*{number}#"), false);
  assert.equal(isValidTogoUssdTemplate("*123*{amount"), false);
  assert.equal(isValidTogoUssdTemplate("*123*{amount}*{number}#"), true);
  assert.equal(
    renderTogoUssdTemplate("*123*{mystery}#", {
      amount: 5000,
      number: "1305150",
      phone: "93256328",
      currency: "XOF",
      operator: "Yas",
    }),
    null,
  );
});
