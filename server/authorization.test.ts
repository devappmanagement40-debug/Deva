import assert from "node:assert/strict";
import test from "node:test";
import { hasAdminPanelAccess, hasSupportInboxAccess } from "./authorization";

test("support inbox is denied to ordinary members", () => {
  assert.equal(hasSupportInboxAccess({ isAdmin: false, isSupportAgent: false }), false);
  assert.equal(hasSupportInboxAccess(null), false);
});

test("support agents can access the support inbox without being admins", () => {
  const supportAgent = { isAdmin: false, isSupportAgent: true };
  assert.equal(hasSupportInboxAccess(supportAgent), true);
  assert.equal(hasAdminPanelAccess(supportAgent), false);
});

test("administrators retain access to the support inbox", () => {
  const admin = { isAdmin: true, isSupportAgent: false };
  assert.equal(hasSupportInboxAccess(admin), true);
  assert.equal(hasAdminPanelAccess(admin), true);
});
