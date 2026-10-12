import assert from "node:assert/strict";
import test from "node:test";
import { buildRobotsTxt, buildSitemapXml } from "./static";

test("robots.txt is plain text, avoids API crawling, and uses only configured sitemap URL", () => {
  assert.equal(
    buildRobotsTxt("https://example.test/sitemap.xml"),
    "User-agent: *\nDisallow: /api/\nSitemap: https://example.test/sitemap.xml\n",
  );
  assert.equal(
    buildRobotsTxt(),
    "User-agent: *\nDisallow: /api/\n",
  );
});

test("sitemap only lists public login and registration pages on the configured host", () => {
  const xml = buildSitemapXml("https://example.test/old-path");
  assert.match(xml, /<loc>https:\/\/example\.test\/index\/login<\/loc>/);
  assert.match(xml, /<loc>https:\/\/example\.test\/index\/register<\/loc>/);
  assert.doesNotMatch(xml, /old-path|\/api\/|\/index\/admin/);
});

test("sitemap refuses non-HTTPS public URLs", () => {
  assert.throws(
    () => buildSitemapXml("http://example.test"),
    /must use HTTPS/,
  );
});
