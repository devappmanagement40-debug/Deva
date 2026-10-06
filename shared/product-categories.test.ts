import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canPurchaseProductType,
  normalizeProductType,
  ownsActiveStabilityProduct,
} from "./product-categories";

describe("product category normalization", () => {
  it("maps legacy and missing categories to Stability", () => {
    assert.equal(normalizeProductType("all"), "stability");
    assert.equal(normalizeProductType(undefined), "stability");
    assert.equal(normalizeProductType("unexpected"), "stability");
  });

  it("keeps Wellness and Activity in their own categories", () => {
    assert.equal(normalizeProductType("wellness"), "wellness");
    assert.equal(normalizeProductType("activity"), "activity");
  });
});

describe("Stability purchase prerequisite", () => {
  it("allows Wellness and Activity only with an active Stability product", () => {
    const hasActiveStabilityProduct = ownsActiveStabilityProduct([
      { isActive: true, daysRemaining: 12, productType: "stability" },
    ]);

    assert.equal(canPurchaseProductType("wellness", hasActiveStabilityProduct), true);
    assert.equal(canPurchaseProductType("activity", hasActiveStabilityProduct), true);
  });

  it("does not count completed, revoked, or non-Stability products", () => {
    const holdings = [
      { isActive: false, daysRemaining: 20, productType: "stability" },
      { isActive: true, daysRemaining: 0, productType: "stability" },
      { isActive: true, daysRemaining: 20, productType: "wellness" },
      { isActive: true, daysRemaining: 20, productType: "activity" },
    ];

    assert.equal(ownsActiveStabilityProduct(holdings), false);
    assert.equal(canPurchaseProductType("wellness", false), false);
    assert.equal(canPurchaseProductType("activity", false), false);
    assert.equal(canPurchaseProductType("stability", false), true);
  });

  it("treats an active admin-assigned Stability product as owned", () => {
    assert.equal(
      ownsActiveStabilityProduct([
        { isActive: true, daysRemaining: 20, productType: "stability" },
      ]),
      true,
    );
  });

  it("treats an active legacy Stability snapshot as Stability", () => {
    assert.equal(
      ownsActiveStabilityProduct([
        { isActive: true, daysRemaining: 20, productType: "all" },
      ]),
      true,
    );
  });
});
