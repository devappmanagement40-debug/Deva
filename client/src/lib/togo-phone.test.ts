import assert from "node:assert/strict";
import { test } from "node:test";
import { getTogoPhoneDigits } from "./togo-phone";

test("keeps each partially entered Togo phone number visible", () => {
  assert.equal(getTogoPhoneDigits(""), "");
  assert.equal(getTogoPhoneDigits("9"), "9");
  assert.equal(getTogoPhoneDigits("90123"), "90123");
  assert.equal(getTogoPhoneDigits("90123456"), "90123456");
});

test("removes the Togo country prefix from a complete phone number", () => {
  assert.equal(getTogoPhoneDigits("+228 90 12 34 56"), "90123456");
});
