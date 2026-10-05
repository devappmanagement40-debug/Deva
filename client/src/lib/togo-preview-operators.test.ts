import assert from "node:assert/strict";
import { test } from "node:test";
import type { PaymentNumber } from "@shared/schema";
import { getTogoDevelopmentPreviewOperators } from "./togo-preview-operators";

test("creates development-only Togo entries with non-routable display numbers", () => {
  const previews = getTogoDevelopmentPreviewOperators([]);

  assert.deepEqual(
    previews.map(({ id, operatorName, phone }) => ({ id, operatorName, phone })),
    [
      { id: -228001, operatorName: "TMoney", phone: "+228 00 00 00 00" },
      { id: -228002, operatorName: "Moov Money", phone: "+228 11 11 11 11" },
    ],
  );
  assert.ok(previews.every((operator) => operator.ussdTemplate === null));
});

test("uses only administrator-configured USSD templates in preview", () => {
  const configured = [
    {
      operatorName: "Moov Money",
      ussdTemplate: "*000*{amount}*{number}#",
    },
  ] as PaymentNumber[];
  const previews = getTogoDevelopmentPreviewOperators(configured);

  assert.equal(previews[0].ussdTemplate, null);
  assert.equal(previews[1].ussdTemplate, configured[0].ussdTemplate);
  assert.equal(previews[1].phone, "+228 11 11 11 11");
});
