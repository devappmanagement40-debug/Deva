import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getTogoOperatorLogoUrl,
  resolveTogoOperatorLogoUrl,
} from "./togo-operator-logo";

test("uses the local TMoney logo for TMoney and Togocom aliases", () => {
  assert.equal(getTogoOperatorLogoUrl("T-Money"), "/images/operators/tmoney.svg");
  assert.equal(getTogoOperatorLogoUrl("Yas Togo"), "/images/operators/tmoney.svg");
});

test("uses the local Moov Money logo", () => {
  assert.equal(getTogoOperatorLogoUrl("Moov Money"), "/images/operators/moov.webp");
});

test("keeps an administrator-configured logo ahead of local defaults", () => {
  assert.equal(
    resolveTogoOperatorLogoUrl("Moov Money", "https://example.com/moov.png"),
    "https://example.com/moov.png",
  );
  assert.equal(resolveTogoOperatorLogoUrl("Unknown operator"), null);
});
