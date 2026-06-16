import { NextResponse } from "next/server"
import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid or missing token." }, { status: 400 })
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      )
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    const { rows } = await query<{
      id: string
      user_id: string
      expires_at: string
      used_at: string | null
    }>(
      "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1",
      [tokenHash],
    )

    const record = rows[0]
    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 })
    }
    if (record.used_at) {
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 },
      )
    }
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired." }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    // Update password and mark token as used in one shot
    await query("UPDATE users SET password = $1 WHERE id = $2", [hashed, record.user_id])
    await query(
      "UPDATE password_reset_tokens SET used_at = now() WHERE id = $1",
      [record.id],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[reset-password]", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
