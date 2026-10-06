import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateWithdrawalPayoutAmounts,
  parseWithdrawalFeePercent,
} from "./withdrawal-fees";

test("12% is withheld from the entered withdrawal amount", () => {
  assert.deepEqual(calculateWithdrawalPayoutAmounts(10_000, 12), {
    fees: 1_200,
    netAmount: 8_800,
  });
});

test("fees are rounded to the nearest whole XOF", () => {
  assert.deepEqual(calculateWithdrawalPayoutAmounts(1_001, 12), {
    fees: 120,
    netAmount: 881,
  });
});

test("valid fee settings allow zero through 99 percent with up to two decimals", () => {
  assert.equal(parseWithdrawalFeePercent("12"), 12);
  assert.equal(parseWithdrawalFeePercent("12.5"), 12.5);
  assert.equal(parseWithdrawalFeePercent("98.99"), 98.99);
  assert.equal(parseWithdrawalFeePercent("99"), 99);
  assert.equal(parseWithdrawalFeePercent("0"), 0);
});

test("invalid fee settings and amounts are rejected", () => {
  for (const value of ["", "-1", "99.99", "100", "12.345", "abc", Number.NaN]) {
    assert.equal(parseWithdrawalFeePercent(value), null);
  }
  assert.throws(() => calculateWithdrawalPayoutAmounts(0, 12), RangeError);
  assert.throws(() => calculateWithdrawalPayoutAmounts(10_000, 100), RangeError);
});
