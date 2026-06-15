import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { withTransaction } from "@/lib/db"
import { logActivity, syncAlertForInventory } from "@/lib/mutations"

/**
 * Updates a single inventory row's quantity and/or low-stock threshold.
 * Verifies the row belongs to the caller's business before mutating.
 */
export async function PATCH(req: Request) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const inventoryId = String(body.inventoryId ?? "")
  const hasQty = body.quantity !== undefined && body.quantity !== null
  const hasThreshold = body.threshold !== undefined && body.threshold !== null
  const quantity = Math.max(0, Number.parseInt(String(body.quantity ?? "0"), 10) || 0)
  const threshold = Math.max(0, Number.parseInt(String(body.threshold ?? "0"), 10) || 0)

  if (!inventoryId || (!hasQty && !hasThreshold)) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 })
  }

  const result = await withTransaction(async (client) => {
    // Ownership check via join to branches.
    const owns = await client.query(
      `SELECT i.id, p.name AS product_name, b.name AS branch_name
       FROM inventory i
       JOIN branches b ON b.id = i.branch_id
       JOIN products p ON p.id = i.product_id
       WHERE i.id=$1 AND b.business_id=$2`,
      [inventoryId, ctx.business.id],
    )
    if (owns.rows.length === 0) return null

    if (hasQty && hasThreshold) {
      await client.query(
        "UPDATE inventory SET quantity=$1, low_stock_threshold=$2, updated_at=now() WHERE id=$3",
        [quantity, threshold, inventoryId],
      )
    } else if (hasQty) {
      await client.query(
        "UPDATE inventory SET quantity=$1, updated_at=now() WHERE id=$2",
        [quantity, inventoryId],
      )
    } else {
      await client.query(
        "UPDATE inventory SET low_stock_threshold=$1, updated_at=now() WHERE id=$2",
        [threshold, inventoryId],
      )
    }

    await syncAlertForInventory(client, ctx.business.id, inventoryId)
    const r = owns.rows[0]
    await logActivity(
      client,
      ctx.business.id,
      `Updated stock for "${r.product_name}" at ${r.branch_name}.`,
      "inventory",
    )
    return true
  })

  if (!result) {
    return NextResponse.json({ error: "Inventory item not found." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
