import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { getConfiguredAppUrlInfo } from "./nowpayments";

const PUBLIC_SITEMAP_ROUTES = ["/index/login", "/index/register"] as const;

export function buildRobotsTxt(sitemapUrl?: string): string {
  return [
    "User-agent: *",
    "Disallow: /api/",
    ...(sitemapUrl ? [`Sitemap: ${sitemapUrl}`] : []),
    "",
  ].join("\n");
}

export function buildSitemapXml(publicAppUrl: string): string {
  const parsed = new URL(publicAppUrl);
  if (parsed.protocol !== "https:") {
    throw new Error("The public sitemap URL must use HTTPS");
  }

  const locations = PUBLIC_SITEMAP_ROUTES.map(
    (route) => new URL(route, parsed.origin).href,
  );
  const entries = locations
    .map((location) => `  <url><loc>${location}</loc></url>`)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ].join("\n");
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.get("/robots.txt", (_req, res) => {
    const appUrlInfo = getConfiguredAppUrlInfo();
    const sitemapUrl = appUrlInfo
      ? new URL("/sitemap.xml", appUrlInfo.url).href
      : undefined;
    res
      .status(200)
      .type("text/plain")
      .set("Cache-Control", "public, max-age=300")
      .send(buildRobotsTxt(sitemapUrl));
  });

  app.get("/sitemap.xml", (_req, res) => {
    const appUrlInfo = getConfiguredAppUrlInfo();
    if (!appUrlInfo) {
      return res
        .status(503)
        .type("text/plain")
        .set("Cache-Control", "no-store")
        .send("Set APP_URL or PUBLIC_URL to the public HTTPS domain.");
    }

    return res
      .status(200)
      .type("application/xml")
      .set("Cache-Control", "public, max-age=300")
      .send(buildSitemapXml(appUrlInfo.url));
  });

  // Product images uploaded from the admin panel must survive a rebuild,
  // which recreates dist/public on every production build.
  const uploadsPath = path.resolve(process.cwd(), "client", "public", "uploads");
  app.use("/uploads", express.static(uploadsPath));
  app.use(express.static(distPath));

  // Keep unknown API requests as JSON. If a reverse proxy forwards an API
  // request to this Node process, it must not receive the SPA HTML document.
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Route API introuvable" });
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
