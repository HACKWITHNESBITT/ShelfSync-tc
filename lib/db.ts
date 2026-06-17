import { Pool, type PoolClient } from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { attachDatabasePool } from "@vercel/functions"

function createPool(): Pool {
  // Prefer a plain DATABASE_URL if provided (e.g. local dev or non-IAM Aurora).
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
    })
  }

  // Fall back to Aurora IAM authentication via OIDC (Vercel integration).
  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION },
    }),
    region: process.env.AWS_REGION,
    hostname: process.env.PGHOST!,
    username: process.env.PGUSER || "postgres",
    port: 5432,
  })

  return new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || "postgres",
    port: 5432,
    user: process.env.PGUSER || "postgres",
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    max: 20,
  })
}

// Pool is created lazily on first use so that process.env.DATABASE_URL is
// read at query time rather than at module-import time. This prevents the
// pool being created before the env file is loaded.
const globalForPool = globalThis as unknown as { _pgPool?: Pool }

function getPool(): Pool {
  if (!globalForPool._pgPool) {
    const pool = createPool()
    if (!process.env.DATABASE_URL) {
      attachDatabasePool(pool)
    }
    globalForPool._pgPool = pool
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

export const pool = { query: query as Pool["query"] }
