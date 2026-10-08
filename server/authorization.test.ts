import assert from "node:assert/strict";
import test from "node:test";
import { hasSupportInboxAccess } from "./authorization";

test("support inbox is denied to ordinary members", () => {
  assert.equal(hasSupportInboxAccess({ isAdmin: false, isSupportAgent: false }), false);
  assert.equal(hasSupportInboxAccess(null), false);
});

test("support agents can access the support inbox without being admins", () => {
  assert.equal(hasSupportInboxAccess({ isAdmin: false, isSupportAgent: true }), true);
});

test("administrators retain access to the support inbox", () => {
  assert.equal(hasSupportInboxAccess({ isAdmin: true, isSupportAgent: false }), true);
});
