import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PRODUCT_CARD_COLOR,
  isValidProductCardColor,
  normalizeProductCardColor,
} from "./product-card-color";

describe("product card color", () => {
  it("keeps the original catalog appearance when no custom color is selected", () => {
    assert.equal(DEFAULT_PRODUCT_CARD_COLOR, "#f5f7ff");
    assert.equal(normalizeProductCardColor(undefined), null);
    assert.equal(normalizeProductCardColor(""), null);
    assert.equal(normalizeProductCardColor(null), null);
  });

  it("accepts and normalizes six-digit hex colors", () => {
    assert.equal(isValidProductCardColor("#C35A9A"), true);
    assert.equal(normalizeProductCardColor("#C35A9A"), "#c35a9a");
  });

  it("rejects malformed or non-hex colors", () => {
    assert.equal(isValidProductCardColor("purple"), false);
    assert.equal(isValidProductCardColor("#fff"), false);
    assert.throws(() => normalizeProductCardColor("red"));
  });
});
