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

test("all paid product categories count, but Explore or Offres alone do not activate VIP", () => {
  const progress = calculateVipProgress([
    personalPurchase(1, "5000.00", "stability"),
    personalPurchase(2, "5000.00", "activity"),
    parcoursPurchase(3, "5000.00", { product: { productType: "wellness", price: "5000.00", isFree: true } }),
    parcoursPurchase(4, "5000.00", { assignedByAdmin: true }),
  ], { vip2MinInvestment: "10000" });

  assert.equal(progress.level, 0);
  assert.equal(progress.totalInvestmentXof, 10000);
});

test("first paid Parcours purchase earns VIP1 and starts the next stage at zero", () => {
  const progress = calculateVipProgress(
    [parcoursPurchase(1, "2000.00", {
      isActive: true,
      daysRemaining: 149,
      totalEarned: "0",
    })],
    { vip2MinInvestment: "5000" },
  );

  assert.equal(progress.level, 1);
  assert.equal(progress.totalInvestmentXof, 2000);
  assert.equal(progress.progressPercent, 0);
  assert.equal(progress.amountRemainingXof, 3000);
});

test("a successful purchase counts while its product cycle is still active", () => {
  const progress = calculateVipProgress([
    personalPurchase(1, "3000.00", "stability", {
      isActive: true,
      daysRemaining: 149,
      totalEarned: "0",
    }),
    parcoursPurchase(2, "2000.00", {
      isActive: true,
      daysRemaining: 149,
      totalEarned: "0",
    }),
  ], { vip2MinInvestment: "5000" });

  assert.equal(progress.level, 2);
  assert.equal(progress.totalInvestmentXof, 5000);
});

test("cumulative personal paid purchases from all categories unlock ranks and reset stage progress", () => {
  const settings = { vip2MinInvestment: "5000", vip3MinInvestment: "10000" };
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

test("a purchase that crosses a threshold starts progress toward the next rank at zero", () => {
  const progress = calculateVipProgress(
    [
      personalPurchase(1, "5000.00", "stability"),
      parcoursPurchase(2, "1000.00"),
    ],
    { vip2MinInvestment: "5000", vip3MinInvestment: "10000" },
  );

  assert.equal(progress.level, 2);
  assert.equal(progress.progressPercent, 0);
  assert.equal(progress.amountRemainingXof, 4000);
});

test("personal purchases made before the first Parcours purchase count once Parcours activates VIP", () => {
  const settings = { vip2MinInvestment: "5000" };
  const purchases = [
    personalPurchase(1, "3000.00", "stability"),
    personalPurchase(2, "3000.00", "activity"),
  ];
  const beforeParcours = calculateVipProgress(purchases, settings);
  const afterParcours = calculateVipProgress([
    ...purchases,
    parcoursPurchase(3, "1000.00"),
  ], settings);

  assert.equal(beforeParcours.level, 0);
  assert.equal(beforeParcours.totalInvestmentXof, 6000);
  assert.equal(afterParcours.level, 2);
  assert.equal(afterParcours.totalInvestmentXof, 7000);
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
