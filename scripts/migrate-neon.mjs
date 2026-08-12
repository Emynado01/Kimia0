import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } });
await client.connect();
try {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const migrationDirectory = resolve("db/neon-migrations");
  const migrationFiles = (await readdir(migrationDirectory)).filter((file) => file.endsWith(".sql")).sort();
  for (const migrationFile of migrationFiles) {
    const migrationName = migrationFile.slice(0, -4);
    const existing = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [migrationName]);
    if (existing.rowCount) continue;
    const file = await readFile(resolve(migrationDirectory, migrationFile), "utf8");
    await client.query("BEGIN");
    try { await client.query(file); await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [migrationName]); await client.query("COMMIT"); console.log(`Neon migration applied: ${migrationName}.`); }
    catch (error) { await client.query("ROLLBACK"); throw error; }
  }
  const result = await client.query("SELECT current_database() AS database, count(*)::int AS products FROM products");
  console.log(`Neon connected: ${result.rows[0].products} catalogue products.`);
} finally { await client.end(); }
