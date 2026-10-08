import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateVipProgress,
  isVipLevelUnlocked,
  validateVipInvestmentThresholds,
} from "./vip-progress";

function personalPurchase(
  id: number,
  price: string,
  productType = "wellness",
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    purchaseDate: new Date(`2026-01-${String(id).padStart(2, "0")}T00:00:00.000Z`),
    assignedByAdmin: false,
    product: { productType, price, isFree: false },
    ...overrides,
  };
}

const parcoursPurchase = (id: number, price: string, overrides: Record<string, unknown> = {}) =>
  personalPurchase(id, price, "wellness", overrides);

test("all personal paid product categories count toward admin-configured VIP thresholds", () => {
  const progress = calculateVipProgress([
    personalPurchase(1, "5000.00", "stability"),
    personalPurchase(2, "5000.00", "activity"),
    parcoursPurchase(3, "5000.00", { product: { productType: "wellness", price: "5000.00", isFree: true } }),
    parcoursPurchase(4, "5000.00", { assignedByAdmin: true }),
  ], { vip1MinInvestment: "5000", vip2MinInvestment: "10000" });

  assert.equal(progress.level, 2);
  assert.equal(progress.totalInvestmentXof, 10000);
});

test("an account with no purchases still sees the configured amount needed for VIP1", () => {
  const progress = calculateVipProgress(
    [],
    { vip1MinInvestment: "3000", vip2MinInvestment: "5000" },
  );

  assert.equal(progress.level, 0);
  assert.equal(progress.totalInvestmentXof, 0);
  assert.equal(progress.nextLevel, 1);
  assert.equal(progress.progressPercent, 0);
  assert.equal(progress.nextThresholdXof, 3000);
  assert.equal(progress.amountRemainingXof, 3000);
});

test("a personal Explore purchase can reach VIP1 as soon as it is recorded", () => {
  const progress = calculateVipProgress([
    personalPurchase(1, "3000.00", "stability", {
      isActive: true,
      daysRemaining: 149,
      totalEarned: "0",
    }),
  ], { vip1MinInvestment: "3000", vip2MinInvestment: "5000" });

  assert.equal(progress.level, 1);
  assert.equal(progress.totalInvestmentXof, 3000);
  assert.equal(progress.nextLevel, 2);
  assert.equal(progress.amountRemainingXof, 2000);
});

test("paid purchase snapshots count at their purchase-time price even if the catalog later changes", () => {
  const progress = calculateVipProgress(
    [{
      id: 1,
      purchaseDate: new Date("2026-01-01T00:00:00.000Z"),
      assignedByAdmin: false,
      productSnapshot: { productType: "stability", price: "3000.00", isFree: false },
      product: { productType: "stability", price: "9000.00", isFree: true },
    }],
    { vip1MinInvestment: "3000" },
  );

  assert.equal(progress.level, 1);
  assert.equal(progress.totalInvestmentXof, 3000);
});

test("cumulative purchases from all categories count immediately and reset progress at a reached rank", () => {
  const settings = {
    vip1MinInvestment: "3000",
    vip2MinInvestment: "5000",
    vip3MinInvestment: "10000",
  };
  const purchases = [
    personalPurchase(1, "2000.00", "stability"),
    parcoursPurchase(2, "2000.00"),
    personalPurchase(3, "2000.00", "activity"),
    personalPurchase(4, "2000.00", "stability"),
  ];
  const progress = calculateVipProgress(purchases, settings);

  assert.equal(progress.level, 2);
  assert.equal(progress.totalInvestmentXof, 8000);
  assert.equal(progress.progressPercent, 50);
  assert.equal(progress.amountRemainingXof, 2000);
});

test("a purchase that crosses a configured rank starts progress toward the next rank at zero", () => {
  const progress = calculateVipProgress(
    [personalPurchase(1, "5000.00", "stability")],
    { vip1MinInvestment: "3000", vip2MinInvestment: "5000", vip3MinInvestment: "10000" },
  );

  assert.equal(progress.level, 2);
  assert.equal(progress.totalInvestmentXof, 5000);
  assert.equal(progress.progressPercent, 0);
  assert.equal(progress.amountRemainingXof, 5000);
});

test("one purchase can skip multiple ranks when its amount reaches higher configured thresholds", () => {
  const progress = calculateVipProgress(
    [personalPurchase(1, "12000.00", "stability")],
    {
      vip1MinInvestment: "3000",
      vip2MinInvestment: "5000",
      vip3MinInvestment: "10000",
    },
  );

  assert.equal(progress.level, 3);
  assert.equal(progress.totalInvestmentXof, 12000);
  assert.equal(progress.nextLevel, 4);
  assert.equal(progress.amountRemainingXof, null);
});

test("a missing VIP1 threshold prevents higher unconfigured-rank access", () => {
  const progress = calculateVipProgress(
    [personalPurchase(1, "12000.00", "stability")],
    { vip2MinInvestment: "5000" },
  );

  assert.equal(progress.level, 0);
  assert.equal(progress.nextLevel, 1);
  assert.equal(progress.nextThresholdXof, null);
  assert.equal(progress.amountRemainingXof, null);
});

test("product level requirement is a minimum and invalid requirements fail closed", () => {
  assert.equal(isVipLevelUnlocked(2, 1), true);
  assert.equal(isVipLevelUnlocked(2, 2), true);
  assert.equal(isVipLevelUnlocked(1, 2), false);
  assert.equal(isVipLevelUnlocked(7, 8), false);
});

test("VIP investment thresholds from VIP1 must be positive, contiguous, and increasing", () => {
  assert.equal(validateVipInvestmentThresholds({
    vip1MinInvestment: "3000",
    vip2MinInvestment: "5000",
    vip3MinInvestment: "10000",
  }), null);
  assert.match(
    validateVipInvestmentThresholds({ vip2MinInvestment: "5000" }) || "",
    /sans laisser de palier vide/,
  );
  assert.match(
    validateVipInvestmentThresholds({
      vip1MinInvestment: "3000",
      vip2MinInvestment: "5000",
      vip4MinInvestment: "20000",
    }) || "",
    /sans laisser de palier vide/,
  );
  assert.match(
    validateVipInvestmentThresholds({
      vip1MinInvestment: "5000",
      vip2MinInvestment: "4000",
    }) || "",
    /supérieur/,
  );
  assert.match(
    validateVipInvestmentThresholds({ vip1MinInvestment: "0" }) || "",
    /entier positif/,
  );
});
