import assert from "node:assert/strict";
import test from "node:test";
import { calculateProductEarningsSettlement } from "./product-earnings";

test("Explore credits each completed 24-hour period without waiting for cycle end", () => {
  const result = calculateProductEarningsSettlement({
    productType: "stability",
    dailyEarnings: 1.25,
    cyclesToAccrue: 1,
    previousTotal: 0,
    previousPending: 0,
    cycleCompleted: false,
    collectAtEnd: false,
  });

  assert.deepEqual(result, {
    accrued: 1.25,
    totalEarned: 1.25,
    pendingEarnings: 0,
    payout: 1.25,
    isExplore: true,
  });
});

test("active Explore catches up unpaid 24-hour gains once, including old pending amounts", () => {
  const result = calculateProductEarningsSettlement({
    productType: "stability",
    dailyEarnings: 0.5,
    cyclesToAccrue: 2,
    previousTotal: 1.5,
    previousPending: 1.5,
    cycleCompleted: false,
    collectAtEnd: false,
  });

  assert.deepEqual(result, {
    accrued: 1,
    totalEarned: 2.5,
    pendingEarnings: 0,
    payout: 2.5,
    isExplore: true,
  });
});

test("active Explore releases previously accrued gains even before another 24 hours pass", () => {
  const result = calculateProductEarningsSettlement({
    productType: "stability",
    dailyEarnings: 0.5,
    cyclesToAccrue: 0,
    previousTotal: 2,
    previousPending: 2,
    cycleCompleted: false,
    collectAtEnd: false,
  });

  assert.equal(result.payout, 2);
  assert.equal(result.pendingEarnings, 0);
});

test("active Explore releases accrued total from legacy collect-at-end snapshots", () => {
  const result = calculateProductEarningsSettlement({
    productType: "stability",
    dailyEarnings: 0.75,
    cyclesToAccrue: 1,
    previousTotal: 3,
    previousPending: 0,
    cycleCompleted: false,
    collectAtEnd: true,
  });

  assert.equal(result.payout, 3.75);
  assert.equal(result.pendingEarnings, 0);
});

test("Explore pays its last daily gain at cycle completion, not a second final payout", () => {
  const result = calculateProductEarningsSettlement({
    productType: "stability",
    dailyEarnings: 2,
    cyclesToAccrue: 1,
    previousTotal: 8,
    previousPending: 0,
    cycleCompleted: true,
    collectAtEnd: false,
  });

  assert.equal(result.payout, 2);
  assert.equal(result.totalEarned, 10);
  assert.equal(result.pendingEarnings, 0);
});

test("Parcours and Offres keep cycle-end payouts", () => {
  const inProgress = calculateProductEarningsSettlement({
    productType: "wellness",
    dailyEarnings: 2,
    cyclesToAccrue: 2,
    previousTotal: 0,
    previousPending: 0,
    cycleCompleted: false,
    collectAtEnd: false,
  });
  const completed = calculateProductEarningsSettlement({
    productType: "activity",
    dailyEarnings: 2,
    cyclesToAccrue: 1,
    previousTotal: 4,
    previousPending: 4,
    cycleCompleted: true,
    collectAtEnd: false,
  });

  assert.equal(inProgress.payout, 0);
  assert.equal(inProgress.pendingEarnings, 4);
  assert.equal(completed.payout, 6);
  assert.equal(completed.pendingEarnings, 6);
});
