import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateVipProgress,
  getEffectiveRequiredVipLevel,
  getParcoursProductRanks,
  isVipLevelUnlocked,
  parseUsdtAmountCents,
} from "./vip-progress";

function catalogProduct(
  id: number,
  sortOrder: number,
  requiredInvestmentUsdt: string,
  requiredVipLevel = 0,
) {
  return {
    id,
    name: `Parcours ${id}`,
    productType: "wellness",
    currency: "USDT",
    isFree: false,
    isActive: true,
    isUnavailable: false,
    sortOrder,
    requiredInvestmentUsdt,
    requiredVipLevel,
  };
}

function personalPurchase(
  id: number,
  price: string,
  productType = "stability",
  overrides: Record<string, unknown> = {},
) {
  const snapshot = {
    id,
    productType,
    price,
    currency: "USDT",
    isFree: false,
  };
  return {
    id,
    productId: id,
    purchaseDate: new Date(`2026-01-${String(id).padStart(2, "0")}T00:00:00.000Z`),
    assignedByAdmin: false,
    productSnapshot: snapshot,
    product: snapshot,
    ...overrides,
  };
}

test("all personal paid USDT categories count toward Parcours requirements, but Explore does not award VIP", () => {
  const catalog = [catalogProduct(101, 10, "20.00")];
  const justBelow = calculateVipProgress(
    [personalPurchase(1, "19.50", "stability")],
    catalog,
  );

  assert.equal(justBelow.level, 0);
  assert.equal(justBelow.totalInvestmentUsdt, 19.5);
  assert.equal(justBelow.progressPercent, 97.5);
  assert.equal(justBelow.amountRemainingUsdt, 0.5);

  const reached = calculateVipProgress(
    [
      personalPurchase(1, "19.50", "stability"),
      personalPurchase(2, "0.50", "activity"),
    ],
    catalog,
  );
  assert.equal(reached.level, 0);
  assert.equal(reached.totalInvestmentUsdt, 20);
  assert.equal(reached.progressPercent, 100);
  assert.equal(reached.amountRemainingUsdt, 0);
});

test("only a personal paid Parcours purchase awards VIP, preserving its saved rank after catalog reorder", () => {
  const catalog = [
    // Product 101 would now be VIP 2 in the live catalog, but this purchase
    // was recorded as VIP 1 and must retain that historical award.
    catalogProduct(101, 20, "20.00"),
    catalogProduct(102, 10, "50.00"),
  ];
  const purchases = [
    personalPurchase(1, "40.00", "stability"),
    personalPurchase(2, "10.00", "activity"),
    personalPurchase(3, "20.00", "wellness", {
      productId: 101,
      vipLevelAwarded: 1,
      productSnapshot: {
        id: 101,
        productType: "wellness",
        price: "20.00",
        currency: "USDT",
        isFree: false,
      },
      product: {
        id: 101,
        productType: "wellness",
        price: "20.00",
        currency: "USDT",
        isFree: false,
      },
    }),
  ];

  const progress = calculateVipProgress(purchases, catalog);
  assert.equal(progress.level, 1);
  assert.equal(progress.totalInvestmentUsdt, 70);
  assert.equal(progress.nextLevel, 2);
  assert.equal(progress.nextThresholdUsdt, 20);
  assert.equal(progress.amountRemainingUsdt, 0);
});

test("Parcours rank order follows sort order and is capped at VIP 7", () => {
  const catalog = [
    catalogProduct(105, 50, "0"),
    catalogProduct(101, 10, "0"),
    catalogProduct(103, 30, "0"),
    catalogProduct(102, 20, "0"),
    catalogProduct(104, 40, "0"),
    catalogProduct(106, 60, "0"),
    catalogProduct(107, 70, "0"),
    catalogProduct(108, 80, "0"),
  ];
  const ranks = getParcoursProductRanks(catalog);

  assert.equal(ranks.get(101), 1);
  assert.equal(ranks.get(102), 2);
  assert.equal(ranks.get(108), 7);
});

test("first Parcours purchase has no prior VIP requirement; later products require the preceding rank", () => {
  assert.equal(getEffectiveRequiredVipLevel("wellness", 0, 1), 0);
  assert.equal(getEffectiveRequiredVipLevel("wellness", 0, 2), 1);
  assert.equal(getEffectiveRequiredVipLevel("wellness", 5, 2), 5);
  assert.equal(getEffectiveRequiredVipLevel("activity", 0, 1), 0);
  assert.equal(isVipLevelUnlocked(0, 0), true);
  assert.equal(isVipLevelUnlocked(0, 1), false);
  assert.equal(isVipLevelUnlocked(1, 1), true);
});

test("free, admin-assigned, and non-USDT purchase snapshots do not count", () => {
  const progress = calculateVipProgress(
    [
      personalPurchase(1, "100", "stability", {
        productSnapshot: {
          productType: "stability",
          price: "100",
          currency: "USDT",
          isFree: true,
        },
      }),
      personalPurchase(2, "100", "stability", { assignedByAdmin: true }),
      personalPurchase(3, "100", "stability", {
        productSnapshot: {
          productType: "stability",
          price: "100",
          currency: "XOF",
          isFree: false,
        },
      }),
    ],
    [catalogProduct(101, 10, "20.00")],
  );

  assert.equal(progress.level, 0);
  assert.equal(progress.totalInvestmentUsdt, 0);
  assert.equal(progress.amountRemainingUsdt, 20);
});

test("thresholds use cent precision and reject negative or over-precision values", () => {
  assert.equal(parseUsdtAmountCents("13.25"), 1325);
  assert.equal(parseUsdtAmountCents("0"), 0);
  assert.equal(parseUsdtAmountCents("-0.01"), null);
  assert.equal(parseUsdtAmountCents("1.001"), null);
});
