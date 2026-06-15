import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { query } from "@/lib/db"

/** Manually dismiss (resolve) an alert. */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const { rows } = await query(
    "UPDATE alerts SET resolved=true WHERE id=$1 AND business_id=$2 RETURNING id",
    [id, ctx.business.id],
  )
  if (rows.length === 0) {
    return NextResponse.json({ error: "Alert not found." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
