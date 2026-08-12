import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
const migrationName = "0001_kimia_init";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
await client.connect();
try {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const existing = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [migrationName]);
  if (existing.rowCount) { console.log("Neon migration already applied."); }
  else {
    const file = await readFile(resolve("db/neon-migrations/0001_kimia_init.sql"), "utf8");
    await client.query("BEGIN");
    try { await client.query(file); await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [migrationName]); await client.query("COMMIT"); console.log("Neon migration applied."); }
    catch (error) { await client.query("ROLLBACK"); throw error; }
  }
  const result = await client.query("SELECT current_database() AS database, count(*)::int AS products FROM products");
  console.log(`Neon connected: ${result.rows[0].products} catalogue products.`);
} finally { await client.end(); }
