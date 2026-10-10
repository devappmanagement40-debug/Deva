import assert from "node:assert/strict";
import test from "node:test";
import { isUsdtCurrency, isUsdtProductPurchase, isUsdtRecord } from "./usdt-records";

test("only explicitly USDT-denominated records are eligible for current customer views", () => {
  assert.equal(isUsdtCurrency("USDT"), true);
  assert.equal(isUsdtCurrency(" usdt "), true);
  assert.equal(isUsdtCurrency("XOF"), false);
  assert.equal(isUsdtCurrency(null), false);
  assert.equal(isUsdtRecord({ currency: "USDT" }), true);
  assert.equal(isUsdtRecord({ currency: "XOF" }), false);
  assert.equal(isUsdtRecord({}), false);
});

test("purchase snapshots keep legacy products out of the new USDT view", () => {
  assert.equal(isUsdtProductPurchase({ productSnapshot: { currency: "USDT" }, product: { currency: "XOF" } }), true);
  assert.equal(isUsdtProductPurchase({ productSnapshot: { currency: "XOF" }, product: { currency: "USDT" } }), false);
  assert.equal(isUsdtProductPurchase({ product: { currency: "USDT" } }), true);
  assert.equal(isUsdtProductPurchase({ product: {} }), false);
});
