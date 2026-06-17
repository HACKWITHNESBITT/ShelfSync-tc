import { Pool, type PoolClient } from "pg"

// Single plain-Postgres connection using DATABASE_URL.
// No AWS SDK, no IAM, no RDS Data API, no STS — just a standard connection string.
const globalForPool = globalThis as unknown as { _pgPool?: Pool }

function getPool(): Pool {
  if (!globalForPool._pgPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set.")
    }
    globalForPool._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
    })
  }
  return globalForPool._pgPool
}

export async function query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[] }> {
  const res = await getPool().query(text, params)
  return { rows: res.rows as T[] }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
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
