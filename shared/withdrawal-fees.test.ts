import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateUsdtWithdrawalPayoutAmounts,
  calculateWithdrawalPayoutAmounts,
  convertXofWithdrawalLimitToUsdt,
  formatUsdtWithdrawalAmount,
  parseUsdtWithdrawalAmount,
  parseWithdrawalFeePercent,
} from "./withdrawal-fees";

test("12% is withheld from the entered withdrawal amount", () => {
  assert.deepEqual(calculateWithdrawalPayoutAmounts(10_000, 12), {
    fees: 1_200,
    netAmount: 8_800,
  });
});

test("a changed admin rate is used instead of a fixed 12% calculation", () => {
  assert.deepEqual(calculateWithdrawalPayoutAmounts(10_000, 5), {
    fees: 500,
    netAmount: 9_500,
  });
});

test("a minimum request of 1,200 XOF still applies the configured fee", () => {
  assert.deepEqual(calculateWithdrawalPayoutAmounts(1_200, 12), {
    fees: 144,
    netAmount: 1_056,
  });
});

test("fees are rounded to the nearest whole XOF", () => {
  assert.deepEqual(calculateWithdrawalPayoutAmounts(1_001, 12), {
    fees: 120,
    netAmount: 881,
  });
});

test("USDT withdrawals preserve six-decimal precision and withhold the configured fee", () => {
  assert.deepEqual(calculateUsdtWithdrawalPayoutAmounts("10.123456", 12), {
    fees: "1.214815",
    netAmount: "8.908641",
  });
  assert.equal(formatUsdtWithdrawalAmount(parseUsdtWithdrawalAmount("2.400000")!), "2.4");
});

test("converts the existing XOF withdrawal floor and ceiling to USDT", () => {
  assert.equal(convertXofWithdrawalLimitToUsdt(1_200, 500, true), "2.4");
  assert.equal(convertXofWithdrawalLimitToUsdt(1_000_000, 500, false), "2000");
  assert.equal(convertXofWithdrawalLimitToUsdt(1_201, 500, true), "2.402");
});

test("rejects USDT amounts with excessive precision or invalid values", () => {
  assert.equal(parseUsdtWithdrawalAmount("1.123456"), 1_123_456);
  assert.equal(parseUsdtWithdrawalAmount("1.1234567"), null);
  assert.equal(parseUsdtWithdrawalAmount("0"), null);
  assert.equal(parseUsdtWithdrawalAmount("-1"), null);
  assert.throws(() => calculateUsdtWithdrawalPayoutAmounts("0.000001", 99), RangeError);
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
