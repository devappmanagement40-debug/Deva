import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateVipProgress,
  isVipLevelUnlocked,
  validateVipInvestmentThresholds,
} from "./vip-progress";

function parcoursPurchase(
  id: number,
  price: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    purchaseDate: new Date(`2026-01-${String(id).padStart(2, "0")}T00:00:00.000Z`),
    assignedByAdmin: false,
    product: { productType: "wellness", price, isFree: false },
    ...overrides,
  };
}

test("Explore, Offres, free, and admin-assigned purchases do not count toward VIP", () => {
  const progress = calculateVipProgress([
    parcoursPurchase(1, "5000.00", { product: { productType: "stability", price: "5000.00", isFree: false } }),
    parcoursPurchase(2, "5000.00", { product: { productType: "activity", price: "5000.00", isFree: false } }),
    parcoursPurchase(3, "5000.00", { product: { productType: "wellness", price: "5000.00", isFree: true } }),
    parcoursPurchase(4, "5000.00", { assignedByAdmin: true }),
  ], { vip2MinInvestment: "10000" });

  assert.equal(progress.level, 0);
  assert.equal(progress.totalInvestmentXof, 0);
});

test("first paid Parcours purchase earns VIP1 and starts the next stage at zero", () => {
  const progress = calculateVipProgress(
    [parcoursPurchase(1, "2000.00")],
    { vip2MinInvestment: "5000" },
  );

  assert.equal(progress.level, 1);
  assert.equal(progress.totalInvestmentXof, 2000);
  assert.equal(progress.progressPercent, 0);
  assert.equal(progress.amountRemainingXof, 3000);
});

test("cumulative personal Parcours spend unlocks ranks and resets stage progress", () => {
  const settings = { vip2MinInvestment: "5000", vip3MinInvestment: "10000" };
  const purchases = [
    parcoursPurchase(1, "2000.00"),
    parcoursPurchase(2, "4000.00"),
    parcoursPurchase(3, "2000.00"),
  ];
  const progress = calculateVipProgress(purchases, settings);

  assert.equal(progress.level, 2);
  assert.equal(progress.totalInvestmentXof, 8000);
  assert.equal(progress.progressPercent, 50);
  assert.equal(progress.amountRemainingXof, 2000);
});

test("a purchase that crosses a threshold starts progress toward the next rank at zero", () => {
  const progress = calculateVipProgress(
    [parcoursPurchase(1, "6000.00")],
    { vip2MinInvestment: "5000", vip3MinInvestment: "10000" },
  );

  assert.equal(progress.level, 2);
  assert.equal(progress.progressPercent, 0);
  assert.equal(progress.amountRemainingXof, 4000);
});

test("product level requirement is a minimum and invalid requirements fail closed", () => {
  assert.equal(isVipLevelUnlocked(2, 1), true);
  assert.equal(isVipLevelUnlocked(2, 2), true);
  assert.equal(isVipLevelUnlocked(1, 2), false);
  assert.equal(isVipLevelUnlocked(7, 8), false);
});

test("VIP investment thresholds must be positive, contiguous, and increasing", () => {
  assert.equal(validateVipInvestmentThresholds({
    vip2MinInvestment: "5000",
    vip3MinInvestment: "10000",
  }), null);
  assert.match(
    validateVipInvestmentThresholds({ vip2MinInvestment: "5000", vip4MinInvestment: "20000" }) || "",
    /sans laisser de palier vide/,
  );
  assert.match(
    validateVipInvestmentThresholds({ vip2MinInvestment: "5000", vip3MinInvestment: "4000" }) || "",
    /supérieur/,
  );
  assert.match(
    validateVipInvestmentThresholds({ vip2MinInvestment: "0" }) || "",
    /entier positif/,
  );
});
