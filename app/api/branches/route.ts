import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { withTransaction } from "@/lib/db"
import { createId } from "@/lib/id"
import { logActivity, syncAlertForInventory } from "@/lib/mutations"
import { getBranches } from "@/lib/queries"

export async function GET() {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const branches = await getBranches(ctx.business.id)
  return NextResponse.json({ branches })
}

export async function POST(req: Request) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? "").trim()
  const address = String(body.address ?? "").trim()
  const city = String(body.city ?? "").trim()

  if (!name) {
    return NextResponse.json({ error: "Branch name is required." }, { status: 400 })
  }

  const branchId = createId("br")
  await withTransaction(async (client) => {
    await client.query(
      "INSERT INTO branches (id, name, address, city, business_id) VALUES ($1,$2,$3,$4,$5)",
      [branchId, name, address, city, ctx.business.id],
    )

    // Stock every existing product at this new branch with 0 units so the
    // catalog stays consistent, and open low-stock alerts accordingly.
    const products = await client.query(
      "SELECT id FROM products WHERE business_id = $1",
      [ctx.business.id],
    )
    for (const p of products.rows) {
      const invId = createId("inv")
      await client.query(
        `INSERT INTO inventory (id, branch_id, product_id, quantity, low_stock_threshold)
         VALUES ($1,$2,$3,0,$4)`,
        [invId, branchId, p.id, ctx.business.default_threshold],
      )
      await syncAlertForInventory(client, ctx.business.id, invId)
    }

    await logActivity(client, ctx.business.id, `Added new branch "${name}".`, "branch")
  })

  return NextResponse.json({ ok: true, id: branchId }, { status: 201 })
}
