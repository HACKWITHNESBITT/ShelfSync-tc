import type { PoolClient } from "pg"
import { createId } from "@/lib/id"

type Queryable = Pick<PoolClient, "query">

/** Records an entry in the activity feed. */
export async function logActivity(
  client: Queryable,
  businessId: string,
  message: string,
  type = "info",
) {
  await client.query(
    `INSERT INTO activity (id, business_id, message, type) VALUES ($1, $2, $3, $4)`,
    [createId("ac"), businessId, message, type],
  )
}

/**
 * Reconciles the alerts table for a single inventory row.
 * Opens an unresolved alert when stock is at/below threshold,
 * and resolves any open alert once stock recovers above threshold.
 */
export async function syncAlertForInventory(
  client: Queryable,
  businessId: string,
  inventoryId: string,
) {
  const { rows } = await client.query(
    "SELECT quantity, low_stock_threshold FROM inventory WHERE id = $1",
    [inventoryId],
  )
  const inv = rows[0]
  if (!inv) return

  const isLow = inv.quantity <= inv.low_stock_threshold

  if (isLow) {
    await client.query(
      `INSERT INTO alerts (id, business_id, inventory_id, resolved)
       VALUES ($1, $2, $3, false)
       ON CONFLICT (inventory_id)
       DO UPDATE SET resolved = false, created_at = now()`,
      [createId("al"), businessId, inventoryId],
    )
  } else {
    await client.query(
      "UPDATE alerts SET resolved = true WHERE inventory_id = $1 AND resolved = false",
      [inventoryId],
    )
  }
}
