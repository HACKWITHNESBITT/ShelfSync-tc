import type { PoolClient } from "pg"
import { createId } from "@/lib/id"
import { logActivity, syncAlertForInventory } from "@/lib/mutations"

type Queryable = Pick<PoolClient, "query">

const BRANCHES = [
  { name: "Downtown Flagship", address: "120 Market St", city: "San Francisco" },
  { name: "Riverside Outlet", address: "44 Riverside Ave", city: "Portland" },
  { name: "Eastgate Mall", address: "900 Eastgate Blvd", city: "Seattle" },
]

const PRODUCTS = [
  { name: "Aurora Wireless Earbuds", sku: "AUD-EAR-01", category: "Audio" },
  { name: "Nimbus Bluetooth Speaker", sku: "AUD-SPK-02", category: "Audio" },
  { name: "Vertex USB-C Hub", sku: "ACC-HUB-03", category: "Accessories" },
  { name: "Helix Mechanical Keyboard", sku: "ACC-KEY-04", category: "Accessories" },
  { name: "Lumen 4K Webcam", sku: "VID-CAM-05", category: "Video" },
  { name: "Pulse Fitness Tracker", sku: "WEA-TRK-06", category: "Wearables" },
  { name: "Orbit Wireless Mouse", sku: "ACC-MSE-07", category: "Accessories" },
  { name: "Solstice Power Bank", sku: "PWR-BNK-08", category: "Power" },
]

/**
 * Seeds a freshly created business with branches, a product catalog,
 * randomized inventory levels, and a couple of recorded transfers so the
 * dashboard is populated on first login. Intentionally leaves a few items
 * below threshold so the alerts system has data to show.
 */
export async function seedDemoData(client: Queryable, businessId: string) {
  const branchIds: string[] = []
  for (const b of BRANCHES) {
    const id = createId("br")
    branchIds.push(id)
    await client.query(
      "INSERT INTO branches (id, name, address, city, business_id) VALUES ($1,$2,$3,$4,$5)",
      [id, b.name, b.address, b.city, businessId],
    )
  }

  const productIds: string[] = []
  for (const p of PRODUCTS) {
    const id = createId("pr")
    productIds.push(id)
    await client.query(
      "INSERT INTO products (id, name, sku, category, business_id) VALUES ($1,$2,$3,$4,$5)",
      [id, p.name, p.sku, p.category, businessId],
    )
  }

  // Inventory: every product in every branch with varied quantities.
  let lowStockSeeded = 0
  for (const branchId of branchIds) {
    for (const productId of productIds) {
      const threshold = 10
      // Seed a handful of deliberately-low rows to populate alerts.
      let quantity: number
      if (lowStockSeeded < 4 && Math.random() < 0.25) {
        quantity = Math.floor(Math.random() * 6) // 0-5, below threshold
        lowStockSeeded++
      } else {
        quantity = 15 + Math.floor(Math.random() * 120)
      }
      const invId = createId("inv")
      await client.query(
        `INSERT INTO inventory (id, branch_id, product_id, quantity, low_stock_threshold)
         VALUES ($1,$2,$3,$4,$5)`,
        [invId, branchId, productId, quantity, threshold],
      )
      await syncAlertForInventory(client, businessId, invId)
    }
  }

  await logActivity(
    client,
    businessId,
    `Workspace created with ${BRANCHES.length} branches and ${PRODUCTS.length} products.`,
    "system",
  )
}
