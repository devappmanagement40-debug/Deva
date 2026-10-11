import test from "node:test";
import assert from "node:assert/strict";
import { getParcoursVipFaqRows } from "./rules-faq";

const parcours = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Parcours 1",
  productType: "wellness",
  currency: "USDT",
  isFree: false,
  isActive: true,
  isUnavailable: false,
  requiredVipLevel: 0,
  requiredInvestmentUsdt: "20.00",
  sortOrder: 10,
  ...overrides,
});

test("FAQ lists per-product investment amounts, access levels, and awarded ranks in catalog order", () => {
  const rows = getParcoursVipFaqRows([
    parcours({
      id: 2,
      name: "Parcours 2",
      sortOrder: 20,
      requiredInvestmentUsdt: "50.00",
      requiredVipLevel: 0,
    }),
    parcours(),
  ]);

  assert.deepEqual(rows, [
    {
      id: 1,
      name: "Parcours 1",
      requiredVipLevel: 0,
      requiredInvestmentUsdt: 20,
      awardedVipLevel: 1,
      unavailable: false,
    },
    {
      id: 2,
      name: "Parcours 2",
      requiredVipLevel: 1,
      requiredInvestmentUsdt: 50,
      awardedVipLevel: 2,
      unavailable: false,
    },
  ]);
});

test("FAQ excludes inactive, free, non-USDT, and non-Parcours products", () => {
  const rows = getParcoursVipFaqRows([
    parcours({ id: 2, isActive: false }),
    parcours({ id: 3, isFree: true }),
    parcours({ id: 4, currency: "XOF" }),
    parcours({ id: 5, productType: "stability" }),
  ]);

  assert.deepEqual(rows, []);
});
