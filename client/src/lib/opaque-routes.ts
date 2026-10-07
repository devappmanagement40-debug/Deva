type RouteMapping = {
  internal: string;
  opaque: string;
};

type BrowserRouteLocation = {
  pathname: string;
  search: string;
  hash: string;
};

// Keep these mappings only to redirect links shared before the URL change.
// New links and navigation use the readable route names again.
export const LEGACY_OPAQUE_ROUTES: readonly RouteMapping[] = [
  { internal: "/", opaque: "/c1b13097434d4a869044e4f1865d10ff" },
  { internal: "/login", opaque: "/01321e66d5f74918aea0dbcbca46ba07" },
  { internal: "/register", opaque: "/d2cb9cc633c645ebb46515f328cb60a4" },
  { internal: "/tasks", opaque: "/4852b62a993143e3a84682ea9687589d" },
  { internal: "/checkin", opaque: "/2c4f9775be114f39b4e67a7a241057f5" },
  { internal: "/invest", opaque: "/a0f276b0090c4e1492f1e87346b9dd5e" },
  { internal: "/orders", opaque: "/a0bb9ffba1b949059b8131df7fc087ab" },
  { internal: "/team", opaque: "/4ed8166b02044e6cbcfdbc5c3491956c" },
  { internal: "/share-information", opaque: "/d1f8785e91b242eca7e8761fde5997aa" },
  { internal: "/withdrawal-proofs", opaque: "/ecb19980d85d49959aa0cfe4b40c0e03" },
  { internal: "/earnings", opaque: "/add3a4de35054428ac38e1c02126cbd9" },
  { internal: "/account", opaque: "/d059945635e743228ef6123f87543b17" },
  { internal: "/deposit", opaque: "/c3b1e06d176b42188410a50e36cffdcf" },
  { internal: "/deposit-issue", opaque: "/85937dd387a44638bf966ba3af75845d" },
  { internal: "/withdrawal", opaque: "/8797f8e518ca4a4c996d7f068496c746" },
  { internal: "/deposit-history", opaque: "/a9af63a31ccf4f32afe87fcba93502ba" },
  { internal: "/deposits-history", opaque: "/db69056663b94235ab7e4ee449839c3a" },
  { internal: "/history", opaque: "/2451f79f170a44bda4e323be668a1d68" },
  { internal: "/withdrawal-history", opaque: "/eb0c51cccbb747d4980674606f1d3a22" },
  { internal: "/deposit-orders", opaque: "/9a25b9f724a449c89a7848012b9a3e4c" },
  { internal: "/deposit-callback/:id", opaque: "/5bcf85ba399f43499428d128345c5582/:id" },
  { internal: "/service", opaque: "/683abebe2f4b4afc9d694496c192e004" },
  { internal: "/support-chat", opaque: "/2403c268b8f249a19f86ab785e9edf1d" },
  { internal: "/wallet", opaque: "/8941624762d141e89b686c7f2aef4926" },
  { internal: "/change-password", opaque: "/90bf7fb8ec0a4779adebc37ed7b1911f" },
  { internal: "/change-withdrawal-pin", opaque: "/49f300362936402e91c51246e7bf48f2" },
  { internal: "/change-admin-pin", opaque: "/8eaf521ed36747889985dc78cb08ba2e" },
  { internal: "/about", opaque: "/d5994ef0d2cf41ce96f30cd656adf248" },
  { internal: "/rules", opaque: "/b5b3db0dc3784824be04328f925ce936" },
  { internal: "/gift-code", opaque: "/db9b384e5f184ac090c25a0e0d8010a2" },
  { internal: "/team-details/:level", opaque: "/48b3bdf036d7421484631b3768f4b032/:level" },
  { internal: "/team-details", opaque: "/9a853e59056b41db89bd4414540bfde1" },
  { internal: "/members", opaque: "/b316c1cdaba14004a9bee9c3356dc126" },
  { internal: "/salary-bonus", opaque: "/63494ac162e646c38f16943b6d272c54" },
  { internal: "/spin-wheel", opaque: "/d4ecee5ecea74bed9550da52b3933f8b" },
  { internal: "/news/:id", opaque: "/a4c49aa16bb44904ad44e6872e095c68/:id" },
  { internal: "/admin", opaque: "/f11436ff7dab4169a6396d9ed6cd8c67" },
  { internal: "/admin/team/:id", opaque: "/0967ad7d34bc464db1a8466956491a37/:id" },
  { internal: "/banker", opaque: "/d2a1f4b49f7c4e6cbd56449892539081" },
];

const LEGACY_ROUTE_ALIASES: Record<string, string> = {
  "/invitation": "/register",
  "/rejoindre": "/register",
  "/my-products": "/orders",
};

const INVITATION_QUERY_KEYS = ["invite", "invitation_code", "invite_code", "ref", "money", "reg"];
const INDEX_ROUTE_PREFIX = "/index";

function normalizePath(path: string): string {
  const leadingSlash = path.startsWith("/") ? path : `/${path}`;
  const trimmed = leadingSlash.replace(/\/+$/, "");
  return trimmed || "/";
}

function splitRouteAndSuffix(value: string): { path: string; suffix: string } {
  const suffixIndex = value.search(/[?#]/);
  if (suffixIndex < 0) return { path: normalizePath(value), suffix: "" };
  return {
    path: normalizePath(value.slice(0, suffixIndex)),
    suffix: value.slice(suffixIndex),
  };
}

function matchTemplate(template: string, candidate: string): string[] | null {
  const templateParts = normalizePath(template).split("/").filter(Boolean);
  const candidateParts = normalizePath(candidate).split("/").filter(Boolean);
  if (templateParts.length !== candidateParts.length) return null;

  const values: string[] = [];
  for (let index = 0; index < templateParts.length; index += 1) {
    const templatePart = templateParts[index];
    const candidatePart = candidateParts[index];
    if (templatePart.startsWith(":")) {
      values.push(candidatePart);
    } else if (templatePart !== candidatePart) {
      return null;
    }
  }
  return values;
}

function fillTemplate(template: string, values: string[]): string {
  let valueIndex = 0;
  const parts = normalizePath(template).split("/").filter(Boolean);
  const filled = parts.map((part) => {
    if (!part.startsWith(":")) return part;
    const value = values[valueIndex] ?? "";
    valueIndex += 1;
    return value;
  });
  return filled.length ? `/${filled.join("/")}` : "/";
}

function stripIndexPrefix(path: string): string {
  if (path === INDEX_ROUTE_PREFIX) return "/";
  if (path.startsWith(`${INDEX_ROUTE_PREFIX}/`)) {
    return normalizePath(path.slice(INDEX_ROUTE_PREFIX.length));
  }
  return path;
}

export function toInternalRoute(value: string): string {
  const { path: rawPath, suffix } = splitRouteAndSuffix(value);
  const path = stripIndexPrefix(rawPath);

  for (const route of LEGACY_OPAQUE_ROUTES) {
    const values = matchTemplate(route.opaque, path);
    if (values) return `${fillTemplate(route.internal, values)}${suffix}`;
  }

  return `${LEGACY_ROUTE_ALIASES[path] ?? path}${suffix}`;
}

export function toIndexPath(value: string): string {
  const { path, suffix } = splitRouteAndSuffix(toInternalRoute(value));
  if (path === "/") return `${INDEX_ROUTE_PREFIX}${suffix}`;
  return `${INDEX_ROUTE_PREFIX}${path}${suffix}`;
}

function hasInvitationCode(search: string): boolean {
  const params = new URLSearchParams(search);
  return INVITATION_QUERY_KEYS.some((key) => Boolean(params.get(key)?.trim()));
}

export function internalPathFromLocation(location: BrowserRouteLocation): string {
  const routeSource = location.hash ? location.hash.slice(1) : location.pathname;
  const { path } = splitRouteAndSuffix(toInternalRoute(routeSource));
  const routeSearch = getSearchFromLocation(location) || location.search;

  if (path === "/" && hasInvitationCode(routeSearch)) return "/register";
  return path;
}

export function getSearchFromLocation(location: BrowserRouteLocation): string {
  if (location.hash) {
    const { suffix } = splitRouteAndSuffix(location.hash.slice(1));
    if (suffix.startsWith("?")) return suffix;
  }
  return location.search;
}

export function getCanonicalInitialUrl(location: BrowserRouteLocation): string {
  const routeSource = location.hash
    ? location.hash.slice(1)
    : `${location.pathname}${location.search}`;
  return toIndexPath(routeSource);
}

export function buildIndexRouteUrl(origin: string, route: string): string {
  return `${origin.replace(/\/+$/, "")}${toIndexPath(route)}`;
}

export function buildInvitationUrl(origin: string, invitationCode: string): string {
  return `${origin.replace(/\/+$/, "")}${INDEX_ROUTE_PREFIX}?invite=${encodeURIComponent(invitationCode.trim())}`;
}
