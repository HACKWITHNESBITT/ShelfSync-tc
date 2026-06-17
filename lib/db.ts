import { Pool, type PoolClient } from "pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.")
}

// Reuse a single pool across hot reloads in dev.
const globalForPool = globalThis as unknown as { _pgPool?: Pool }

const pool =
  globalForPool._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 20,
  })

if (!globalForPool._pgPool) {
  globalForPool._pgPool = pool
}

export async function query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
  const res = await pool.query(text, params)
  return { rows: res.rows as T[] }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

export { pool }
