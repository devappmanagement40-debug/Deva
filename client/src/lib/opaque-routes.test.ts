import assert from "node:assert/strict";
import test from "node:test";
import {
  OPAQUE_ROUTES,
  buildInvitationUrl,
  getCanonicalInitialUrl,
  internalPathFromLocation,
  toInternalRoute,
  toOpaqueRoute,
} from "./opaque-routes";

test("every app route has a unique opaque URL and round-trips", () => {
  const opaquePaths = OPAQUE_ROUTES.map(({ opaque }) => opaque);
  assert.equal(new Set(opaquePaths).size, OPAQUE_ROUTES.length);

  for (const route of OPAQUE_ROUTES) {
    const examplePath = route.internal
      .replace(":id", "42")
      .replace(":level", "2");
    const opaquePath = toOpaqueRoute(examplePath);
    assert.equal(toInternalRoute(opaquePath), examplePath);
  }
});

test("legacy paths remain aliases and map to their current pages", () => {
  assert.equal(toOpaqueRoute("/login"), OPAQUE_ROUTES.find((route) => route.internal === "/login")?.opaque);
  assert.equal(toInternalRoute("/invitation"), "/register");
  assert.equal(toInternalRoute("/rejoindre"), "/register");
  assert.equal(toInternalRoute("/my-products"), "/orders");
});

test("opaque dynamic routes preserve identifiers and query strings", () => {
  const external = toOpaqueRoute("/admin/team/17?tab=members");
  assert.equal(toInternalRoute(external), "/admin/team/17?tab=members");
});

test("root invitation links open registration and prefill invitation_code", () => {
  const location = { pathname: "/", search: "?invitation_code=ABCD", hash: "" };
  assert.equal(internalPathFromLocation(location), "/register");
  assert.equal(getCanonicalInitialUrl(location), null);
  assert.equal(buildInvitationUrl("https://golddiamant.site", "ABCD"), "https://golddiamant.site/?invitation_code=ABCD");
});

test("direct legacy page URLs are normalized to opaque routes", () => {
  assert.equal(
    getCanonicalInitialUrl({ pathname: "/login", search: "", hash: "" }),
    `/#${toOpaqueRoute("/login")}`,
  );
});
