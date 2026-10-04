import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DAILY_BONUS_COOLDOWN_MS,
  getDailyBonusHoursRemaining,
} from "./daily-bonus-policy";

test("allows a first check-in when no previous claim exists", () => {
  assert.equal(getDailyBonusHoursRemaining(null, new Date("2026-10-04T00:00:00.000Z")), 0);
});

test("keeps the check-in locked until the full 24 hours have elapsed", () => {
  const now = new Date("2026-10-04T00:00:00.000Z");
  const oneMillisecondEarly = new Date(now.getTime() - DAILY_BONUS_COOLDOWN_MS + 1);
  const exactlyTwentyFourHours = new Date(now.getTime() - DAILY_BONUS_COOLDOWN_MS);

  assert.equal(getDailyBonusHoursRemaining(oneMillisecondEarly, now), 1);
  assert.equal(getDailyBonusHoursRemaining(exactlyTwentyFourHours, now), 0);
});

test("fails closed when a stored claim date is invalid", () => {
  assert.equal(getDailyBonusHoursRemaining(new Date(Number.NaN), new Date()), 24);
});