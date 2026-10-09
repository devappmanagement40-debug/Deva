import { drizzle, type NodePgClient } from "drizzle-orm/node-postgres";
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
  // Remote PostgreSQL may need several seconds to resume after being idle.
  // A 5s limit turned these cold starts into intermittent failed API calls.
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
  query_timeout: 15_000,
  statement_timeout: 15_000,
  keepAlive: true,
});

pool.on("error", (error) => {
  console.error("[database] PostgreSQL pool error:", error.message);
});

export const db = drizzle(pool as unknown as NodePgClient, { schema });
