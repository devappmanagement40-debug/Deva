import pg from "pg";
import { getDatabaseConfig } from "./database-config";

const { Pool } = pg;

// Ordered so referenced records are copied before their dependents. Global
// platform settings, raw webhook payloads, company content, and login sessions
// are deliberately excluded from this account-data migration.
const MIGRATION_TABLES = [
  "countries",
  "deposit_channels",
  "payment_channels",
  "payment_numbers",
  "product_series",
  "tasks",
  "staking_products",
  "users",
  "products",
  "gift_codes",
  "referral_code_aliases",
  "deposits",
  "withdrawals",
  "withdrawal_wallets",
  "transactions",
  "user_products",
  "user_tasks",
  "referral_commissions",
  "share_reports",
  "withdrawal_proofs",
  "user_stakings",
  "gift_code_claims",
  "spin_wheel_requests",
  "support_chat_messages",
  "admin_audit_log",
] as const;

type ColumnInfo = {
  column_name: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
  is_identity: "YES" | "NO";
};

type TablePlan = {
  table: (typeof MIGRATION_TABLES)[number];
  columns: string[];
  sourceRows: number;
  targetRows: number;
};

const sourceUrl = process.env.DATABASE_URL;
const targetConfig = getDatabaseConfig();
const applyChanges = process.argv.includes("--apply");

if (!sourceUrl || !process.env.SUPABASE_DATABASE_URL) {
  console.error("Set DATABASE_URL (source) and SUPABASE_DATABASE_URL (target).");
  process.exit(1);
}

if (sourceUrl === targetConfig.connectionString) {
  console.error("Source and target must be different databases.");
  process.exit(1);
}

const sourcePool = new Pool({
  connectionString: sourceUrl,
  max: 1,
  connectionTimeoutMillis: 10_000,
});
const targetPool = new Pool({
  ...targetConfig,
  max: 1,
  connectionTimeoutMillis: 10_000,
});

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function tableIdentifier(table: string): string {
  return `${quoteIdentifier("public")}.${quoteIdentifier(table)}`;
}

async function getColumns(
  client: pg.PoolClient,
  table: string,
): Promise<ColumnInfo[]> {
  const result = await client.query<ColumnInfo>(
    `SELECT column_name, is_nullable, column_default, is_identity
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    ["public", table],
  );
  return result.rows;
}

async function verifyPrimaryKey(client: pg.PoolClient, table: string) {
  const result = await client.query<{ column_name: string }>(
    `SELECT kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
       AND tc.constraint_schema = kcu.constraint_schema
     WHERE tc.constraint_type = $1
       AND tc.table_schema = $2
       AND tc.table_name = $3
     ORDER BY kcu.ordinal_position`,
    ["PRIMARY KEY", "public", table],
  );
  if (result.rows.length !== 1 || result.rows[0].column_name !== "id") {
    throw new Error(`Expected a single id primary key on ${table}.`);
  }
}

async function getCount(client: pg.PoolClient, table: string): Promise<number> {
  const result = await client.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${tableIdentifier(table)}`,
  );
  return Number(result.rows[0].count);
}

async function backfillProductSnapshots(client: pg.PoolClient) {
  // The source predates purchase-time product snapshots. Preserve the source
  // catalog terms as the best available baseline for each migrated purchase.
  await client.query(`
    UPDATE "public"."user_products" AS up
    SET "product_snapshot" = jsonb_build_object(
      'id', p."id",
      'name', p."name",
      'productType', p."product_type",
      'price', p."price"::text,
      'dailyEarnings', p."daily_earnings"::text,
      'cycleDays', p."cycle_days",
      'totalReturn', p."total_return"::text,
      'imageUrl', p."image_url",
      'isFree', p."is_free",
      'isActive', p."is_active",
      'sortOrder', p."sort_order",
      'seriesId', p."series_id",
      'minInviteCount', p."min_invite_count",
      'maxOwned', p."max_owned",
      'collectAtEnd', p."collect_at_end",
      'stockPercentage', p."stock_percentage",
      'isUnavailable', p."is_unavailable"
    )
    FROM "public"."products" AS p
    WHERE up."product_id" = p."id"
      AND up."product_snapshot" IS NULL
  `);
}

async function resetSequence(client: pg.PoolClient, table: string) {
  const sequenceResult = await client.query<{ sequence_name: string | null }>(
    "SELECT pg_get_serial_sequence($1, $2) AS sequence_name",
    [`public.${table}`, "id"],
  );
  const sequenceName = sequenceResult.rows[0]?.sequence_name;
  if (!sequenceName) return;

  const maxResult = await client.query<{ max_id: string }>(
    `SELECT COALESCE(MAX("id"), 0)::text AS max_id FROM ${tableIdentifier(table)}`,
  );
  const maxId = Number(maxResult.rows[0].max_id);
  if (!Number.isSafeInteger(maxId)) {
    throw new Error(`Invalid sequence value in ${table}.`);
  }
  if (maxId > 0) {
    await client.query("SELECT setval($1::regclass, $2::bigint, true)", [
      sequenceName,
      maxId,
    ]);
  }
}

async function main() {
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  let sourceTransaction = false;
  let targetTransaction = false;
  let activeTable = "preflight";

  try {
    await sourceClient.query(
      "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );
    sourceTransaction = true;
    await targetClient.query(
      applyChanges
        ? "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ"
        : "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );
    targetTransaction = true;

    const [sourceIdentity, targetIdentity] = await Promise.all([
      sourceClient.query<{ database_name: string; server_address: string | null }>(
        "SELECT current_database() AS database_name, inet_server_addr()::text AS server_address",
      ),
      targetClient.query<{ database_name: string; server_address: string | null }>(
        "SELECT current_database() AS database_name, inet_server_addr()::text AS server_address",
      ),
    ]);
    const sourceDb = sourceIdentity.rows[0];
    const targetDb = targetIdentity.rows[0];
    if (
      sourceDb.database_name === targetDb.database_name &&
      sourceDb.server_address === targetDb.server_address
    ) {
      throw new Error("Source and target resolve to the same database.");
    }

    const plans: TablePlan[] = [];
    const sourceRowsByTable = new Map<
      (typeof MIGRATION_TABLES)[number],
      Array<Record<string, unknown>>
    >();

    for (const table of MIGRATION_TABLES) {
      activeTable = table;
      const sourceColumns = await getColumns(sourceClient, table);
      const targetColumns = await getColumns(targetClient, table);
      if (!sourceColumns.length || !targetColumns.length) {
        throw new Error(`Required source or target table is missing: ${table}.`);
      }

      await verifyPrimaryKey(sourceClient, table);
      await verifyPrimaryKey(targetClient, table);

      const targetColumnNames = new Set(
        targetColumns.map((column) => column.column_name),
      );
      const sourceOnlyColumns = sourceColumns
        .map((column) => column.column_name)
        .filter((column) => !targetColumnNames.has(column));
      if (sourceOnlyColumns.length) {
        throw new Error(`Target is missing columns required by ${table}.`);
      }

      const sourceColumnNames = new Set(
        sourceColumns.map((column) => column.column_name),
      );
      const unfillableTargetColumns = targetColumns.filter(
        (column) =>
          !sourceColumnNames.has(column.column_name) &&
          column.is_nullable === "NO" &&
          column.column_default === null &&
          column.is_identity === "NO",
      );
      if (unfillableTargetColumns.length) {
        throw new Error(`Target has required unmapped columns in ${table}.`);
      }

      const [sourceRows, targetRows] = await Promise.all([
        getCount(sourceClient, table),
        getCount(targetClient, table),
      ]);
      plans.push({
        table,
        columns: sourceColumns.map((column) => column.column_name),
        sourceRows,
        targetRows,
      });

      if (applyChanges && sourceRows > 0) {
        const result = await sourceClient.query<Record<string, unknown>>(
          `SELECT * FROM ${tableIdentifier(table)} ORDER BY "id"`,
        );
        if (result.rows.length !== sourceRows) {
          throw new Error(`Source row count changed during preflight for ${table}.`);
        }
        sourceRowsByTable.set(table, result.rows);
      }
    }

    console.log(
      JSON.stringify({
        mode: applyChanges ? "apply" : "dry-run",
        source: "Replit DATABASE_URL",
        target: "Supabase SUPABASE_DATABASE_URL",
        tables: plans.map(({ table, sourceRows, targetRows }) => ({
          table,
          sourceRows,
          targetRows,
        })),
      }),
    );

    if (!applyChanges) {
      await targetClient.query("ROLLBACK");
      targetTransaction = false;
      await sourceClient.query("ROLLBACK");
      sourceTransaction = false;
      console.log("Dry run only; no data was changed. Use --apply to migrate.");
      return;
    }

    for (const plan of plans) {
      activeTable = plan.table;
      const rows = sourceRowsByTable.get(plan.table) ?? [];
      if (!rows.length) continue;

      const columnsSql = plan.columns.map(quoteIdentifier).join(", ");
      const placeholders = plan.columns
        .map((_, index) => `$${index + 1}`)
        .join(", ");
      const updates = plan.columns
        .filter((column) => column !== "id")
        .map(
          (column) =>
            `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`,
        );
      const conflictClause = updates.length
        ? `DO UPDATE SET ${updates.join(", ")}`
        : "DO NOTHING";
      const insertSql = `
        INSERT INTO ${tableIdentifier(plan.table)} (${columnsSql})
        VALUES (${placeholders})
        ON CONFLICT ("id") ${conflictClause}
      `;

      for (const row of rows) {
        await targetClient.query(
          insertSql,
          plan.columns.map((column) => row[column]),
        );
      }

      const ids = rows.map((row) => Number(row.id));
      const verified = await targetClient.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM ${tableIdentifier(plan.table)}
         WHERE "id" = ANY($1::integer[])`,
        [ids],
      );
      if (Number(verified.rows[0].count) !== rows.length) {
        throw new Error(`Destination verification failed for ${plan.table}.`);
      }
    }

    await backfillProductSnapshots(targetClient);
    const missingSnapshots = await targetClient.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM "public"."user_products"
       WHERE "product_snapshot" IS NULL`,
    );
    if (Number(missingSnapshots.rows[0].count) > 0) {
      throw new Error("Some migrated purchases could not receive product snapshots.");
    }

    for (const table of MIGRATION_TABLES) {
      activeTable = table;
      await resetSequence(targetClient, table);
    }

    await targetClient.query("COMMIT");
    targetTransaction = false;
    await sourceClient.query("ROLLBACK");
    sourceTransaction = false;

    console.log(
      JSON.stringify({
        migration: "completed",
        sourceRowsCopied: plans.reduce((sum, plan) => sum + plan.sourceRows, 0),
        tablesProcessed: plans.length,
        productSnapshotsBackfilled: true,
        sourceChanged: false,
      }),
    );
  } catch (error) {
    if (targetTransaction) {
      await targetClient.query("ROLLBACK").catch(() => undefined);
      targetTransaction = false;
    }
    if (sourceTransaction) {
      await sourceClient.query("ROLLBACK").catch(() => undefined);
      sourceTransaction = false;
    }

    const typedError = error as { code?: string; constructor?: { name?: string } };
    console.error("Migration stopped; destination changes were rolled back.", {
      table: activeTable,
      code: typedError.code ?? null,
      type: typedError.constructor?.name ?? "Error",
    });
    process.exitCode = 1;
  } finally {
    sourceClient.release();
    targetClient.release();
    await Promise.all([sourcePool.end(), targetPool.end()]);
  }
}

void main();
