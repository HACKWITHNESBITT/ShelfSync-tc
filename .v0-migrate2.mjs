import { readFileSync } from "node:fs"
import { Pool } from "pg"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
const signer = new Signer({
  credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN, clientConfig: { region: process.env.AWS_REGION } }),
  region: process.env.AWS_REGION, hostname: process.env.PGHOST,
  username: process.env.PGUSER || "postgres", port: 5432,
})
const pool = new Pool({
  host: process.env.PGHOST, database: process.env.PGDATABASE || "postgres", port: 5432,
  user: process.env.PGUSER || "postgres", password: () => signer.getAuthToken(),
  ssl: { rejectUnauthorized: false }, max: 4,
})
const sql = readFileSync("scripts/002-add-password-reset-tokens.sql", "utf8")
await pool.query(sql)
const { rows } = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='password_reset_tokens'")
console.log("Table created:", rows.length > 0 ? "YES" : "NO")
await pool.end()
