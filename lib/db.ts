import { Pool, type PoolClient } from "pg"
import { Signer } from "@aws-sdk/rds-signer"

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error(
    "AWS credentials missing: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION required for RDS IAM authentication"
  )
}

if (!process.env.PGHOST) {
  throw new Error("PGHOST environment variable is not set")
}

const signer = new Signer({
  region: process.env.AWS_REGION,
  hostname: process.env.PGHOST,
  port: 5432,
  username: "postgres",
})

const globalForPool = globalThis as unknown as { _pgPool?: Pool }

function getPool(): Pool {
  if (!globalForPool._pgPool) {
    globalForPool._pgPool = new Pool({
      host: process.env.PGHOST,
      port: 5432,
      user: "postgres",
      database: "postgres",
      password: async () => {
        return signer.getAuthToken({
          username: "postgres",
        })
      },
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
