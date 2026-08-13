import { neon } from "@neondatabase/serverless";

export function getNeonSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for the Kimea database.");
  return neon(connectionString);
}
