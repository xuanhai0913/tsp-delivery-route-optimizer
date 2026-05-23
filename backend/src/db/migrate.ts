import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { closeDatabasePool, getDatabasePool } from "./pool.js";

async function getMigrationFiles(): Promise<string[]> {
  const migrationsDirectory = path.resolve(process.cwd(), "db/migrations");
  const files = await readdir(migrationsDirectory);

  return files
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort()
    .map((fileName) => path.join(migrationsDirectory, fileName));
}

async function runMigrations(): Promise<void> {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("DATABASE_URL or DATABASE_PUBLIC_URL is required to run migrations.");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  for (const filePath of await getMigrationFiles()) {
    const version = path.basename(filePath);
    const existing = await pool.query("SELECT 1 FROM schema_migrations WHERE version = $1", [version]);

    if (existing.rowCount) {
      console.log(`skip ${version}`);
      continue;
    }

    const sql = await readFile(filePath, "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
      await client.query("COMMIT");
      console.log(`applied ${version}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
