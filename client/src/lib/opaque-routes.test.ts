import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_OPAQUE_ROUTES,
  buildInvitationUrl,
  buildIndexRouteUrl,
  getCanonicalInitialUrl,
  internalPathFromLocation,
  toIndexPath,
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

test("index URLs preserve readable dynamic routes, identifiers, and query strings", () => {
  const route = "/admin/team/17?tab=members";
  assert.equal(toInternalRoute(route), route);
  assert.equal(toInternalRoute(`/index${route}`), route);
  assert.equal(toIndexPath(route), `/index${route}`);
  assert.equal(
    buildIndexRouteUrl("https://golddiamant.site", route),
    "https://golddiamant.site/index/admin/team/17?tab=members",
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

test("direct and hash-based legacy page URLs are normalized to /index routes", () => {
  assert.equal(
    getCanonicalInitialUrl({ pathname: "/login", search: "", hash: "" }),
    "/index/login",
  );
  assert.equal(getCanonicalInitialUrl({ pathname: "/", search: "", hash: "" }), null);
  assert.equal(
    getCanonicalInitialUrl({
      pathname: LEGACY_OPAQUE_ROUTES.find((route) => route.internal === "/login")!.opaque,
      search: "",
      hash: "",
    }),
    "/index/login",
  );
  assert.equal(
    getCanonicalInitialUrl({ pathname: "/", search: "", hash: "#/register" }),
    "/index/register",
  );
  assert.equal(
    getCanonicalInitialUrl({ pathname: "/index/register", search: "?invite=ABCD", hash: "" }),
    "/index/register?invite=ABCD",
  );
});
