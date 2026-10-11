// Production entry point for Plesk/Passenger.
// The build process generates the actual server at dist/index.cjs.
process.env.NODE_ENV = "production";
console.info(
  `[production-entry] index.cjs loaded; node=${process.version}; ` +
    `NODE_ENV=${process.env.NODE_ENV}; PORT=${process.env.PORT || "unset"}; ` +
    `databaseUrl=${process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL ? "present" : "missing"}; ` +
    `cwd=${process.cwd()}`,
);

try {
  require("./dist/index.cjs");
} catch (error) {
  console.error("Unable to start the production server:", error);
  process.exit(1);
}