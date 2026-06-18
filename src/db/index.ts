import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL_POOL || process.env.DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("WARNING: Database connection string (DATABASE_URL_POOL/DATABASE_URL) is not set in environment.");
  }
}

const pool =
  globalForDb.conn ??
  new Pool({
    connectionString,
    max: 10, // Moderate connection pool for serverless functions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.conn = pool;

export const db = drizzle(pool, { schema });
