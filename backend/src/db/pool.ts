import { performance } from "node:perf_hooks";

import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.DATABASE_PUBLIC_URL;
}

function shouldUseSsl(databaseUrl: string): boolean | { rejectUnauthorized: false } {
  if (process.env.DATABASE_SSL === "true") {
    return { rejectUnauthorized: false };
  }

  if (process.env.DATABASE_SSL === "false") {
    return false;
  }

  return databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : false;
}

export function getDatabasePool(): pg.Pool | null {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return null;
  }

  pool ??= new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 4_000,
    max: 5,
    ssl: shouldUseSsl(databaseUrl)
  });

  return pool;
}

export async function pingDatabase(): Promise<{ configured: boolean; latencyMs?: number }> {
  const activePool = getDatabasePool();

  if (!activePool) {
    return { configured: false };
  }

  const startedAt = performance.now();
  await activePool.query("select 1");

  return {
    configured: true,
    latencyMs: Number((performance.now() - startedAt).toFixed(2))
  };
}

export async function closeDatabasePool(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}
