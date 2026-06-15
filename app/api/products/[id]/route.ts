import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { query, withTransaction } from "@/lib/db"
import { logActivity } from "@/lib/mutations"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? "").trim()
  const category = String(body.category ?? "").trim() || "Uncategorized"
  if (!name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 })
  }

  const { rows } = await query(
    "UPDATE products SET name=$1, category=$2 WHERE id=$3 AND business_id=$4 RETURNING id",
    [name, category, id, ctx.business.id],
  )
  if (rows.length === 0) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 })
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
      "DELETE FROM products WHERE id=$1 AND business_id=$2 RETURNING name",
      [id, ctx.business.id],
    )
    if (res.rows.length > 0) {
      await logActivity(
        client,
        ctx.business.id,
        `Removed product "${res.rows[0].name}".`,
        "product",
      )
    }
  })
  return NextResponse.json({ ok: true })
}
