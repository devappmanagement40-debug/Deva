import test from "node:test";
import assert from "node:assert/strict";
import {
  amountToXofCents,
  calculatePurchaseDebitAllocation,
  getMaxAffordableProductQuantity,
  MAX_PRODUCT_UNITS_PER_PURCHASE,
  parseProductPurchaseQuantity,
} from "./product-purchase-policy";

test("purchase quantity defaults to one for existing clients", () => {
  assert.equal(parseProductPurchaseQuantity(undefined), 1);
  assert.equal(parseProductPurchaseQuantity(null), 1);
});

test("purchase quantity accepts only safe positive integers within the per-request cap", () => {
  assert.equal(parseProductPurchaseQuantity(3), 3);
  assert.equal(parseProductPurchaseQuantity("4"), 4);
  for (const value of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER, 101, ""]) {
    assert.throws(() => parseProductPurchaseQuantity(value));
  }
  assert.equal(parseProductPurchaseQuantity(MAX_PRODUCT_UNITS_PER_PURCHASE), 100);
});

test("XOF values are converted to exact cents", () => {
  assert.equal(amountToXofCents("1250.25"), 125025);
  assert.throws(() => amountToXofCents("-1"));
  assert.throws(() => amountToXofCents("not-money"));
});

test("selectable quantity respects both balance and remaining user limit", () => {
  assert.equal(getMaxAffordableProductQuantity({
    unitPriceCents: 250000,
    availableBalanceCents: 750000,
    remainingProductLimit: 5,
  }), 3);
  assert.equal(getMaxAffordableProductQuantity({
    unitPriceCents: 250000,
    availableBalanceCents: 2_000_000,
    remainingProductLimit: 2,
  }), 2);
  assert.equal(getMaxAffordableProductQuantity({
    unitPriceCents: 0,
    availableBalanceCents: 0,
    remainingProductLimit: null,
  }), MAX_PRODUCT_UNITS_PER_PURCHASE);
  assert.equal(getMaxAffordableProductQuantity({
    unitPriceCents: 100,
    availableBalanceCents: 10_000,
    remainingProductLimit: 0,
  }), 0);
});

test("multi-unit payment debits deposits before earnings", () => {
  assert.deepEqual(calculatePurchaseDebitAllocation({
    unitPriceCents: 250000,
    quantity: 3,
    depositBalanceCents: 500000,
    earningsBalanceCents: 400000,
  }), {
    totalPriceCents: 750000,
    depositDebitCents: 500000,
    earningsDebitCents: 250000,
    shortfallCents: 0,
  });
});

test("insufficient balance is reported without allocating unavailable earnings", () => {
  assert.deepEqual(calculatePurchaseDebitAllocation({
    unitPriceCents: 250000,
    quantity: 2,
    depositBalanceCents: 100000,
    earningsBalanceCents: 150000,
  }), {
    totalPriceCents: 500000,
    depositDebitCents: 100000,
    earningsDebitCents: 150000,
    shortfallCents: 250000,
  });
});
