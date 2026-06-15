import { NextResponse } from "next/server"
import { getContext } from "@/lib/session"
import { withTransaction } from "@/lib/db"
import { createId } from "@/lib/id"
import { logActivity, syncAlertForInventory } from "@/lib/mutations"
import { getProducts } from "@/lib/queries"

export async function GET() {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const products = await getProducts(ctx.business.id)
  return NextResponse.json({ products })
}

export async function POST(req: Request) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? "").trim()
  const sku = String(body.sku ?? "").trim()
  const category = String(body.category ?? "").trim() || "Uncategorized"
  const initialQty = Math.max(0, Number.parseInt(String(body.initialQuantity ?? "0"), 10) || 0)

  if (!name || !sku) {
    return NextResponse.json(
      { error: "Product name and SKU are required." },
      { status: 400 },
    )
  }

  const productId = createId("pr")
  try {
    await withTransaction(async (client) => {
      const dup = await client.query(
        "SELECT 1 FROM products WHERE business_id=$1 AND sku=$2",
        [ctx.business.id, sku],
      )
      if (dup.rows.length > 0) throw new Error("SKU_TAKEN")

      await client.query(
        "INSERT INTO products (id, name, sku, category, business_id) VALUES ($1,$2,$3,$4,$5)",
        [productId, name, sku, category, ctx.business.id],
      )

      // Add to every branch; seed the chosen initial quantity everywhere.
      const branches = await client.query(
        "SELECT id FROM branches WHERE business_id=$1",
        [ctx.business.id],
      )
      for (const b of branches.rows) {
        const invId = createId("inv")
        await client.query(
          `INSERT INTO inventory (id, branch_id, product_id, quantity, low_stock_threshold)
           VALUES ($1,$2,$3,$4,$5)`,
          [invId, b.id, productId, initialQty, ctx.business.default_threshold],
        )
        await syncAlertForInventory(client, ctx.business.id, invId)
      }

      await logActivity(client, ctx.business.id, `Added product "${name}" (${sku}).`, "product")
    })
  } catch (err) {
    if (err instanceof Error && err.message === "SKU_TAKEN") {
      return NextResponse.json(
        { error: "A product with that SKU already exists." },
        { status: 409 },
      )
    }
    throw err
  }

  return NextResponse.json({ ok: true, id: productId }, { status: 201 })
}
