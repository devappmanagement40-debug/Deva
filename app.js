// Passenger startup shim — Plesk/Passenger looks for app.js at the project root.
// Written as ESM because package.json has "type":"module".
// Errors are written to passenger-error.log next to this file for diagnosis.
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const logFile = path.join(__dirname, "passenger-error.log");

function logError(err) {
  const msg = `[${new Date().toISOString()}] STARTUP ERROR:\n${err && err.stack ? err.stack : String(err)}\n\n`;
  try { fs.appendFileSync(logFile, msg); } catch (_) {}
  console.error(msg);
}

process.on("uncaughtException", logError);
process.on("unhandledRejection", logError);

// Passenger launches this file directly and does not run package.json's start script.
// This entry point is production-only, so do not depend on Plesk setting NODE_ENV.
process.env.NODE_ENV = "production";
console.info(
  `[passenger] app.js loaded; NODE_ENV=${process.env.NODE_ENV}; ` +
    `PORT=${process.env.PORT || "unset"}; appRoot=${__dirname}`,
);

try {
  require("./dist/index.cjs");
} catch (err) {
  logError(err);
  process.exit(1);
}
