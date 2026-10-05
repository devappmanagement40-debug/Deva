import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adminTaskCreateSchema,
  adminTaskUpdateSchema,
} from "../shared/task-validation";
import {
  canClaimTask,
  countEligibleDirectReferrals,
  formatTaskRewardAmount,
} from "./task-rewards-policy";

const validTask = {
  name: "Bonus palier 1",
  description: "3 filleuls actifs",
  requiredInvites: 3,
  reward: 1000,
  sortOrder: 1,
};

test("a reward becomes claimable at the exact invite threshold", () => {
  assert.equal(canClaimTask(2, 3, false), false);
  assert.equal(canClaimTask(3, 3, false), true);
  assert.equal(canClaimTask(4, 3, false), true);
  assert.equal(canClaimTask(3, 3, true), false);
});

test("invalid invite counts cannot make a reward claimable", () => {
  assert.equal(canClaimTask(-1, 3, false), false);
  assert.equal(canClaimTask(3, 0, false), false);
  assert.equal(canClaimTask(2.5, 3, false), false);
});

test("eligibility counts unique, non-banned direct referrals with active paid products", () => {
  assert.equal(
    countEligibleDirectReferrals(
      [
        { id: 10, isBanned: false },
        { id: 11, isBanned: true },
        { id: 12, isBanned: false },
      ],
      [10, 10, 11, 99],
    ),
    1,
  );
});

test("admin task validation accepts decimal rewards with two places", () => {
  assert.equal(adminTaskCreateSchema.safeParse({ ...validTask, reward: "12.35" }).success, true);
  assert.equal(adminTaskCreateSchema.safeParse({ ...validTask, reward: "0.10" }).success, true);
});

test("admin task validation rejects fractional invite counts and invalid money precision", () => {
  assert.equal(adminTaskCreateSchema.safeParse({ ...validTask, requiredInvites: "2.5" }).success, false);
  assert.equal(adminTaskCreateSchema.safeParse({ ...validTask, requiredInvites: 0 }).success, false);
  assert.equal(adminTaskCreateSchema.safeParse({ ...validTask, reward: "1.234" }).success, false);
  assert.equal(adminTaskCreateSchema.safeParse({ ...validTask, reward: "NaN" }).success, false);
});

test("updates require at least one supported field", () => {
  assert.equal(adminTaskUpdateSchema.safeParse({}).success, false);
  assert.equal(adminTaskUpdateSchema.safeParse({ id: 99 }).success, false);
  assert.equal(adminTaskUpdateSchema.safeParse({ isActive: false }).success, true);
});

test("reward ledger amounts are formatted to exact cents", () => {
  assert.equal(formatTaskRewardAmount(1000), "1000.00");
  assert.equal(formatTaskRewardAmount(0.1), "0.10");
  assert.equal(formatTaskRewardAmount(12.35), "12.35");
  assert.throws(() => formatTaskRewardAmount(1.234));
});
