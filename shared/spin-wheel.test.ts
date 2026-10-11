import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSpinWheelPurchaseReward,
  DEFAULT_SPIN_WHEEL_SEGMENTS,
  DEFAULT_SPIN_WHEEL_INVITE_TEXT,
  DEFAULT_SPIN_WHEEL_RULES_TEXT,
  formatSpinWheelRewardAmount,
  interpolateSpinWheelRewards,
  parseSpinWheelSegments,
} from "./spin-wheel";

test("credits one spin per paid product to the buyer and the direct sponsor", () => {
  assert.equal(calculateSpinWheelPurchaseReward(1, 1), 1);
  assert.equal(calculateSpinWheelPurchaseReward(1, 4), 4);
});

test("keeps configurable zero-spin rewards at zero", () => {
  assert.equal(calculateSpinWheelPurchaseReward(0, 3), 0);
});

test("rejects invalid spin rates and product quantities", () => {
  assert.throws(() => calculateSpinWheelPurchaseReward(-1, 1));
  assert.throws(() => calculateSpinWheelPurchaseReward(1, 0));
  assert.throws(() => calculateSpinWheelPurchaseReward(1, 1.5));
});

test("default invitation and rules copy both resolve to one spin per product", () => {
  for (const text of [DEFAULT_SPIN_WHEEL_INVITE_TEXT, DEFAULT_SPIN_WHEEL_RULES_TEXT]) {
    const resolved = interpolateSpinWheelRewards(text, "invalid", "invalid");
    assert.match(resolved, /1 tour/);
    assert.doesNotMatch(resolved, /\{\{(?:selfPurchaseReward|referralPurchaseReward)\}\}/);
  }
});

test("wheel prizes are displayed and stored as USDT without changing their amount", () => {
  const configured = DEFAULT_SPIN_WHEEL_SEGMENTS.map((segment) => ({
    ...segment,
    label: segment.id === 2 ? "200 XOF" : segment.label,
  }));
  const parsed = parseSpinWheelSegments(JSON.stringify(configured));

  assert.equal(parsed[1].amount, 200);
  assert.equal(parsed[1].label, "200 USDT");
  assert.equal(formatSpinWheelRewardAmount(200), "200 USDT");
  assert.equal(formatSpinWheelRewardAmount(0, "0 FCFA"), "0 USDT");
});
