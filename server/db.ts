import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getDatabaseConfig } from "./database-config";

const { Pool } = pg;
export const pool = new Pool({
  ...getDatabaseConfig(),
  // Never let a dead/stalled database connection block the whole Passenger
  // process indefinitely. Public pages should remain available even when
  // Supabase is temporarily slow.
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  query_timeout: 15_000,
  statement_timeout: 15_000,
  keepAlive: true,
});

pool.on("error", (error) => {
  console.error("[database] PostgreSQL pool error:", error.message);
});

export const db = drizzle(pool, { schema });
