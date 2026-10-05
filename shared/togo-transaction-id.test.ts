import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TOGO_TRANSACTION_ID_MAX_LENGTH,
  validateTogoTransactionId,
} from "./togo-transaction-id";

test("requires a non-empty Togo transaction ID", () => {
  assert.deepEqual(validateTogoTransactionId("  "), {
    ok: false,
    reason: "required",
  });
  assert.deepEqual(validateTogoTransactionId(undefined), {
    ok: false,
    reason: "required",
  });
});

test("trims and accepts a Togo transaction ID up to the shared limit", () => {
  assert.deepEqual(validateTogoTransactionId("  TM-90218  "), {
    ok: true,
    value: "TM-90218",
  });
  assert.equal(
    validateTogoTransactionId("A".repeat(TOGO_TRANSACTION_ID_MAX_LENGTH)).ok,
    true,
  );
});

test("rejects a Togo transaction ID longer than the shared limit", () => {
  assert.deepEqual(
    validateTogoTransactionId("A".repeat(TOGO_TRANSACTION_ID_MAX_LENGTH + 1)),
    { ok: false, reason: "too_long" },
  );
});
