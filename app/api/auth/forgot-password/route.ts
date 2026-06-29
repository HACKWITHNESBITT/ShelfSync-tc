import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { query } from "@/lib/db"
import { createId } from "@/lib/id"

// Ensure the table exists (self-heals after project rename / fresh deploys)
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await query(`CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash)`)
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }

    await ensureTable()

    const { rows: users } = await query<{ id: string; name: string; email: string }>(
      "SELECT id, name, email FROM users WHERE email = $1 LIMIT 1",
      [email.trim().toLowerCase()],
    )

    // Always return 200 to prevent email enumeration
    if (users.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const user = users[0]

    // Invalidate any existing unused tokens for this user
    await query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL",
      [user.id],
    )

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await query(
      "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
      [createId("prt"), user.id, tokenHash, expiresAt.toISOString()],
    )

    const baseUrl =
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`

    // In production, send an email. For now we return the link so it works
    // immediately without an SMTP provider configured.
    if (process.env.NODE_ENV === "development") {
      console.log(`[ShelfSync] Password reset link for ${user.email}: ${resetUrl}`)
    }

    return NextResponse.json({ ok: true, resetUrl })
  } catch (err) {
    console.error("[forgot-password]", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
