import assert from "node:assert/strict";
import test from "node:test";
import { getParcoursVipFaqRows, getVipThresholdFaqRows } from "./rules-faq";

test("FAQ VIP thresholds reflect the current admin settings", () => {
  const before = getVipThresholdFaqRows({
    vip1MinInvestmentUsdt: "20",
    vip2MinInvestmentUsdt: "50",
  });
  assert.equal(before.length, 7);
  assert.deepEqual(before.slice(0, 3), [
    { level: 1, thresholdUsdt: 20 },
    { level: 2, thresholdUsdt: 50 },
    { level: 3, thresholdUsdt: null },
  ]);

  const after = getVipThresholdFaqRows({
    vip1MinInvestmentUsdt: "25",
    vip2MinInvestmentUsdt: "75",
  });
  assert.equal(after[0].thresholdUsdt, 25);
  assert.equal(after[1].thresholdUsdt, 75);
});

test("FAQ Parcours conditions follow each active USDT product and its current VIP requirement", () => {
  const products = [
    {
      id: 2, name: "Parcours B", productType: "wellness", currency: "USDT",
      isFree: false, isActive: true, isUnavailable: false, requiredVipLevel: 2, sortOrder: 2,
    },
    {
      id: 1, name: "Parcours A", productType: "wellness", currency: "USDT",
      isFree: false, isActive: true, isUnavailable: false, requiredVipLevel: 1, sortOrder: 1,
    },
    {
      id: 3, name: "Old XOF", productType: "wellness", currency: "XOF",
      isFree: false, isActive: true, isUnavailable: false, requiredVipLevel: 1, sortOrder: 0,
    },
    {
      id: 4, name: "Explore", productType: "stability", currency: "USDT",
      isFree: false, isActive: true, isUnavailable: false, requiredVipLevel: 0, sortOrder: 0,
    },
  ];
  const rows = getParcoursVipFaqRows(products, {
    vip1MinInvestmentUsdt: "20",
    vip2MinInvestmentUsdt: "50",
  });

  assert.deepEqual(rows, [
    { id: 1, name: "Parcours A", requiredVipLevel: 1, thresholdUsdt: 20, unavailable: false },
    { id: 2, name: "Parcours B", requiredVipLevel: 2, thresholdUsdt: 50, unavailable: false },
  ]);

  const changed = getParcoursVipFaqRows(
    [{ ...products[1], requiredVipLevel: 2 }],
    { vip2MinInvestmentUsdt: "75" },
  );
  assert.equal(changed[0].requiredVipLevel, 2);
  assert.equal(changed[0].thresholdUsdt, 75);
});
