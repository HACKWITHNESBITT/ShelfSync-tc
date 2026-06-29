import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { withTransaction } from "@/lib/db"
import { createId } from "@/lib/id"
import { seedDemoData } from "@/lib/seed"

export async function POST(req: Request) {
  console.log('DEBUG DATABASE_URL RAW:', JSON.stringify(process.env.DATABASE_URL))
  console.log('DEBUG DATABASE_URL LENGTH:', (process.env.DATABASE_URL || '').length)
  let body: { name?: string; email?: string; password?: string; businessName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim().toLowerCase()
  const password = String(body.password ?? "")
  const businessName = String(body.businessName ?? "").trim()

  if (!name || !email || !password || !businessName) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    )
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }

  try {
    await withTransaction(async (client) => {
      const existing = await client.query("SELECT 1 FROM users WHERE email = $1", [email])
      if (existing.rows.length > 0) {
        throw new Error("EMAIL_TAKEN")
      }

      const userId = createId("usr")
      const hashed = await bcrypt.hash(password, 10)
      await client.query(
        "INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)",
        [userId, name, email, hashed],
      )

      const businessId = createId("biz")
      await client.query(
        "INSERT INTO businesses (id, name, owner_id) VALUES ($1, $2, $3)",
        [businessId, businessName, userId],
      )

      await seedDemoData(client, businessId)
    })
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      )
    }
    console.error("[v0] register error:", err)
    return NextResponse.json({ error: "Could not create account." }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
