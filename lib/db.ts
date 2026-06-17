import { Pool, type PoolClient } from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { attachDatabasePool } from "@vercel/functions"

// The Aurora cluster host — present in both dev (RDSHOST) and production (PGHOST).
const AURORA_HOST =
  process.env.PGHOST ||
  process.env.RDSHOST ||
  "shelfsync-db.cluster-cg3msq0gm604.us-east-1.rds.amazonaws.com"

// The database password — only used when IAM auth is not available.
const AURORA_PASSWORD = process.env.PGPASSWORD || process.env.DB_PASSWORD || "Kalilinux_793"
const AURORA_USER = process.env.PGUSER || "shelfsync_admin"
const AURORA_DB = process.env.PGDATABASE || "postgres"

function createPool(): Pool {
  // 1. Prefer a full DATABASE_URL if provided.
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
    })
  }

  // 2. Use Aurora IAM auth when AWS_ROLE_ARN is present (Vercel integration).
  if (process.env.AWS_ROLE_ARN) {
    const signer = new Signer({
      credentials: awsCredentialsProvider({
        roleArn: process.env.AWS_ROLE_ARN,
        clientConfig: { region: process.env.AWS_REGION },
      }),
      region: process.env.AWS_REGION,
      hostname: AURORA_HOST,
      username: AURORA_USER,
      port: 5432,
    })
    return new Pool({
      host: AURORA_HOST,
      database: AURORA_DB,
      port: 5432,
      user: AURORA_USER,
      password: () => signer.getAuthToken(),
      ssl: { rejectUnauthorized: false },
      max: 20,
    })
  }

  // 3. Plain username/password connection (dev sandbox, no IAM).
  return new Pool({
    host: AURORA_HOST,
    database: AURORA_DB,
    port: 5432,
    user: AURORA_USER,
    password: AURORA_PASSWORD,
    ssl: { rejectUnauthorized: false },
    max: 20,
  })
}

const globalForPool = globalThis as unknown as { _pgPool?: Pool }

// Always clear the cached pool so any env changes take effect on next request.
// In production the process never hot-reloads so this is a no-op there.
if (process.env.NODE_ENV === "development") {
  globalForPool._pgPool = undefined
}

function getPool(): Pool {
  if (!globalForPool._pgPool) {
    const p = createPool()
    if (process.env.AWS_ROLE_ARN && !process.env.DATABASE_URL) {
      attachDatabasePool(p)
    }
    globalForPool._pgPool = p
  }
  return globalForPool._pgPool!
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
