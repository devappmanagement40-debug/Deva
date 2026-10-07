import assert from "node:assert/strict";
import test from "node:test";
import {
  hashAdminAccessPin,
  isValidAdminAccessPin,
  verifyAdminAccessPin,
} from "./admin-pin-security";

test("accepts only six-to-eight digit admin access PINs for new settings", () => {
  assert.equal(isValidAdminAccessPin("839174"), true);
  assert.equal(isValidAdminAccessPin("83917426"), true);
  assert.equal(isValidAdminAccessPin("8391"), false);
  assert.equal(isValidAdminAccessPin("839174261"), false);
  assert.equal(isValidAdminAccessPin("83917x"), false);
  assert.equal(isValidAdminAccessPin(null), false);
});

test("hashes new admin PINs and verifies them without exposing the plain value", async () => {
  const pin = "83917426";
  const storedHash = await hashAdminAccessPin(pin);

  assert.notEqual(storedHash, pin);
  assert.equal((await verifyAdminAccessPin(pin, storedHash)).valid, true);
  assert.equal((await verifyAdminAccessPin("11111111", storedHash)).valid, false);
});

test("upgrades a legacy plain admin PIN to a hash after a successful check", async () => {
  const legacyPin = "Legacy-pin-81";
  const result = await verifyAdminAccessPin(legacyPin, legacyPin);

  assert.equal(result.valid, true);
  assert.ok(result.upgradedHash);
  assert.notEqual(result.upgradedHash, legacyPin);
  assert.equal((await verifyAdminAccessPin(legacyPin, result.upgradedHash!)).valid, true);
});

test("does not produce an upgrade hash for an incorrect legacy PIN", async () => {
  const result = await verifyAdminAccessPin("incorrect", "Legacy-pin-81");

  assert.equal(result.valid, false);
  assert.equal(result.upgradedHash, undefined);
});
