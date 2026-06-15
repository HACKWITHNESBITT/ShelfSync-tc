import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { query } from "@/lib/db"

export async function PATCH(req: Request) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? "").trim()
  const defaultThreshold = Math.max(
    0,
    Number.parseInt(String(body.defaultThreshold ?? ""), 10),
  )

  if (!name) {
    return NextResponse.json({ error: "Business name is required." }, { status: 400 })
  }
  if (!Number.isFinite(defaultThreshold)) {
    return NextResponse.json(
      { error: "Default threshold must be a number." },
      { status: 400 },
    )
  }

  await query(
    "UPDATE businesses SET name=$1, default_threshold=$2 WHERE id=$3",
    [name, defaultThreshold, ctx.business.id],
  )
  return NextResponse.json({ ok: true })
}
