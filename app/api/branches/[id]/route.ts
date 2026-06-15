import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { withTransaction } from "@/lib/db"
import { logActivity } from "@/lib/mutations"
import { query } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? "").trim()
  const address = String(body.address ?? "").trim()
  const city = String(body.city ?? "").trim()
  if (!name) {
    return NextResponse.json({ error: "Branch name is required." }, { status: 400 })
  }

  const { rows } = await query(
    `UPDATE branches SET name=$1, address=$2, city=$3
     WHERE id=$4 AND business_id=$5 RETURNING id`,
    [name, address, city, id, ctx.business.id],
  )
  if (rows.length === 0) {
    return NextResponse.json({ error: "Branch not found." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  await withTransaction(async (client) => {
    const res = await client.query(
      "DELETE FROM branches WHERE id=$1 AND business_id=$2 RETURNING name",
      [id, ctx.business.id],
    )
    if (res.rows.length > 0) {
      await logActivity(
        client,
        ctx.business.id,
        `Removed branch "${res.rows[0].name}".`,
        "branch",
      )
    }
  })
  return NextResponse.json({ ok: true })
}
