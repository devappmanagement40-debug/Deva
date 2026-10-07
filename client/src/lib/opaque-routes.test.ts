import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_OPAQUE_ROUTES,
  buildInvitationUrl,
  buildHashRouteUrl,
  getCanonicalInitialUrl,
  internalPathFromLocation,
  toInternalRoute,
} from "./opaque-routes";

test("previous opaque URLs continue to resolve to their readable routes", () => {
  for (const route of LEGACY_OPAQUE_ROUTES) {
    const examplePath = route.internal
      .replace(":id", "42")
      .replace(":level", "2");
    const oldOpaquePath = route.opaque
      .replace(":id", "42")
      .replace(":level", "2");
    assert.equal(toInternalRoute(oldOpaquePath), examplePath);
  }
});

test("readable routes remain readable and legacy paths map to their current pages", () => {
  assert.equal(toInternalRoute("/login"), "/login");
  assert.equal(toInternalRoute("/invitation"), "/register");
  assert.equal(toInternalRoute("/rejoindre"), "/register");
  assert.equal(toInternalRoute("/my-products"), "/orders");
});

test("readable dynamic routes preserve identifiers and query strings", () => {
  const route = "/admin/team/17?tab=members";
  assert.equal(toInternalRoute(route), route);
  assert.equal(
    buildHashRouteUrl("https://golddiamant.site", route),
    "https://golddiamant.site/#/admin/team/17?tab=members",
  );
});

test("root invitation links open registration and prefill invite", () => {
  const location = { pathname: "/", search: "?invite=ABCD", hash: "" };
  assert.equal(internalPathFromLocation(location), "/register");
  assert.equal(getCanonicalInitialUrl(location), null);
  assert.equal(buildInvitationUrl("https://golddiamant.site", "ABCD"), "https://golddiamant.site/?invite=ABCD");
  for (const legacyKey of ["invitation_code", "invite_code", "ref", "money", "reg"]) {
    assert.equal(
      internalPathFromLocation({ pathname: "/", search: `?${legacyKey}=OLD`, hash: "" }),
      "/register",
      `${legacyKey} should keep opening registration`,
    );
  }
});

test("direct legacy page URLs are normalized to readable hash routes", () => {
  assert.equal(
    getCanonicalInitialUrl({ pathname: "/login", search: "", hash: "" }),
    "/#/login",
  );
  assert.equal(getCanonicalInitialUrl({ pathname: "/", search: "", hash: "" }), null);
  assert.equal(
    getCanonicalInitialUrl({
      pathname: LEGACY_OPAQUE_ROUTES.find((route) => route.internal === "/login")!.opaque,
      search: "",
      hash: "",
    }),
    "/#/login",
  );
});
