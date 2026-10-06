import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

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
