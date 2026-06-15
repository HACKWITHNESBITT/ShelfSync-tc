import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { withTransaction } from "@/lib/db"
import { createId } from "@/lib/id"
import { logActivity, syncAlertForInventory } from "@/lib/mutations"
import { getTransfers } from "@/lib/queries"

export async function GET() {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const transfers = await getTransfers(ctx.business.id)
  return NextResponse.json({ transfers })
}

/**
 * Moves stock from one branch to another atomically:
 *  - validates both branches and the product belong to the business
 *  - ensures the source branch has enough on hand
 *  - decrements source / increments destination
 *  - reconciles low-stock alerts on both rows
 *  - records the transfer and an activity entry
 */
export async function POST(req: Request) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const fromBranchId = String(body.fromBranchId ?? "")
  const toBranchId = String(body.toBranchId ?? "")
  const productId = String(body.productId ?? "")
  const quantity = Number.parseInt(String(body.quantity ?? "0"), 10)

  if (!fromBranchId || !toBranchId || !productId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
  }
  if (fromBranchId === toBranchId) {
    return NextResponse.json(
      { error: "Source and destination must be different branches." },
      { status: 400 },
    )
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "Quantity must be a positive number." },
      { status: 400 },
    )
  }

  try {
    const transferId = await withTransaction(async (client) => {
      // Validate ownership of branches & product.
      const owned = await client.query(
        `SELECT
           (SELECT COUNT(*) FROM branches WHERE id = ANY($1) AND business_id=$2)::int AS branch_count,
           (SELECT COUNT(*) FROM products WHERE id=$3 AND business_id=$2)::int AS product_count`,
        [[fromBranchId, toBranchId], ctx.business.id, productId],
      )
      if (owned.rows[0].branch_count !== 2 || owned.rows[0].product_count !== 1) {
        throw new Error("INVALID_REFS")
      }

      // Lock the source inventory row.
      const fromInv = await client.query(
        "SELECT id, quantity FROM inventory WHERE branch_id=$1 AND product_id=$2 FOR UPDATE",
        [fromBranchId, productId],
      )
      if (fromInv.rows.length === 0 || fromInv.rows[0].quantity < quantity) {
        throw new Error("INSUFFICIENT_STOCK")
      }
      const fromInvId = fromInv.rows[0].id

      // Ensure destination inventory row exists, then lock it.
      let toInv = await client.query(
        "SELECT id FROM inventory WHERE branch_id=$1 AND product_id=$2 FOR UPDATE",
        [toBranchId, productId],
      )
      let toInvId: string
      if (toInv.rows.length === 0) {
        toInvId = createId("inv")
        await client.query(
          `INSERT INTO inventory (id, branch_id, product_id, quantity, low_stock_threshold)
           VALUES ($1,$2,$3,0,$4)`,
          [toInvId, toBranchId, productId, ctx.business.default_threshold],
        )
      } else {
        toInvId = toInv.rows[0].id
      }

      await client.query(
        "UPDATE inventory SET quantity = quantity - $1, updated_at=now() WHERE id=$2",
        [quantity, fromInvId],
      )
      await client.query(
        "UPDATE inventory SET quantity = quantity + $1, updated_at=now() WHERE id=$2",
        [quantity, toInvId],
      )

      await syncAlertForInventory(client, ctx.business.id, fromInvId)
      await syncAlertForInventory(client, ctx.business.id, toInvId)

      const id = createId("tr")
      await client.query(
        `INSERT INTO transfers (id, business_id, from_branch_id, to_branch_id, product_id, quantity, status)
         VALUES ($1,$2,$3,$4,$5,$6,'completed')`,
        [id, ctx.business.id, fromBranchId, toBranchId, productId, quantity],
      )

      const meta = await client.query(
        `SELECT p.name AS pname, fb.name AS fname, tb.name AS tname
         FROM products p, branches fb, branches tb
         WHERE p.id=$1 AND fb.id=$2 AND tb.id=$3`,
        [productId, fromBranchId, toBranchId],
      )
      const m = meta.rows[0]
      await logActivity(
        client,
        ctx.business.id,
        `Transferred ${quantity} × ${m.pname} from ${m.fname} to ${m.tname}.`,
        "transfer",
      )
      return id
    })

    return NextResponse.json({ ok: true, id: transferId }, { status: 201 })
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Not enough stock at the source branch." },
        { status: 400 },
      )
    }
    if (err instanceof Error && err.message === "INVALID_REFS") {
      return NextResponse.json({ error: "Invalid branch or product." }, { status: 400 })
    }
    console.error("[v0] transfer error:", err)
    return NextResponse.json({ error: "Transfer failed." }, { status: 500 })
  }
}
