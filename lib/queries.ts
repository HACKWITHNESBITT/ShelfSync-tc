import { query } from "@/lib/db"
import type {
  ActivityItem,
  AlertDetail,
  Branch,
  BranchWithStats,
  InventoryDetail,
  Product,
  ProductWithStock,
  TransferDetail,
} from "@/lib/types"

/* ----------------------------- Branches ----------------------------- */

export async function getBranches(businessId: string): Promise<BranchWithStats[]> {
  const { rows } = await query<BranchWithStats>(
    `SELECT b.*,
       COALESCE(COUNT(DISTINCT i.product_id), 0)::int AS product_count,
       COALESCE(SUM(i.quantity), 0)::int            AS total_units,
       COALESCE(SUM(CASE WHEN i.quantity <= i.low_stock_threshold THEN 1 ELSE 0 END), 0)::int AS low_stock_count
     FROM branches b
     LEFT JOIN inventory i ON i.branch_id = b.id
     WHERE b.business_id = $1
     GROUP BY b.id
     ORDER BY b.created_at ASC`,
    [businessId],
  )
  return rows
}

export async function getBranch(businessId: string, branchId: string): Promise<Branch | null> {
  const { rows } = await query<Branch>(
    "SELECT * FROM branches WHERE id = $1 AND business_id = $2 LIMIT 1",
    [branchId, businessId],
  )
  return rows[0] ?? null
}

export async function getBranchInventory(
  businessId: string,
  branchId: string,
): Promise<InventoryDetail[]> {
  const { rows } = await query<InventoryDetail>(
    `SELECT i.id AS inventory_id, i.product_id, p.name AS product_name, p.sku, p.category,
       i.branch_id, b.name AS branch_name, i.quantity, i.low_stock_threshold,
       (i.quantity <= i.low_stock_threshold) AS low_stock, i.updated_at
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     JOIN branches b ON b.id = i.branch_id
     WHERE i.branch_id = $1 AND b.business_id = $2
     ORDER BY p.name ASC`,
    [branchId, businessId],
  )
  return rows
}

/* ----------------------------- Products ----------------------------- */

export async function getProducts(businessId: string): Promise<ProductWithStock[]> {
  const { rows } = await query<ProductWithStock>(
    `SELECT p.*,
       COALESCE(SUM(i.quantity), 0)::int            AS total_quantity,
       COALESCE(COUNT(DISTINCT i.branch_id), 0)::int AS branch_count,
       BOOL_OR(i.quantity <= i.low_stock_threshold) AS low_stock
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.business_id = $1
     GROUP BY p.id
     ORDER BY p.name ASC`,
    [businessId],
  )
  return rows.map((r) => ({ ...r, low_stock: r.low_stock ?? false }))
}

export async function getProduct(
  businessId: string,
  productId: string,
): Promise<Product | null> {
  const { rows } = await query<Product>(
    "SELECT * FROM products WHERE id = $1 AND business_id = $2 LIMIT 1",
    [productId, businessId],
  )
  return rows[0] ?? null
}

/* ---------------------------- Inventory ----------------------------- */

export async function getInventoryDetail(businessId: string): Promise<InventoryDetail[]> {
  const { rows } = await query<InventoryDetail>(
    `SELECT i.id AS inventory_id, i.product_id, p.name AS product_name, p.sku, p.category,
       i.branch_id, b.name AS branch_name, i.quantity, i.low_stock_threshold,
       (i.quantity <= i.low_stock_threshold) AS low_stock, i.updated_at
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     JOIN branches b ON b.id = i.branch_id
     WHERE p.business_id = $1
     ORDER BY p.name ASC, b.name ASC`,
    [businessId],
  )
  return rows
}

/* ---------------------------- Transfers ----------------------------- */

export async function getTransfers(
  businessId: string,
  limit = 100,
): Promise<TransferDetail[]> {
  const { rows } = await query<TransferDetail>(
    `SELECT t.*, p.name AS product_name,
       fb.name AS from_branch_name, tb.name AS to_branch_name
     FROM transfers t
     JOIN products p ON p.id = t.product_id
     JOIN branches fb ON fb.id = t.from_branch_id
     JOIN branches tb ON tb.id = t.to_branch_id
     WHERE t.business_id = $1
     ORDER BY t.created_at DESC
     LIMIT $2`,
    [businessId, limit],
  )
  return rows
}

/* ------------------------------ Alerts ------------------------------ */

export async function getAlerts(
  businessId: string,
  includeResolved = false,
): Promise<AlertDetail[]> {
  const { rows } = await query<AlertDetail>(
    `SELECT a.*, p.name AS product_name, p.sku, b.name AS branch_name, b.id AS branch_id,
       i.quantity, i.low_stock_threshold
     FROM alerts a
     JOIN inventory i ON i.id = a.inventory_id
     JOIN products p ON p.id = i.product_id
     JOIN branches b ON b.id = i.branch_id
     WHERE a.business_id = $1 ${includeResolved ? "" : "AND a.resolved = false"}
     ORDER BY a.created_at DESC`,
    [businessId],
  )
  return rows
}

/* ----------------------------- Activity ----------------------------- */

export async function getActivity(
  businessId: string,
  limit = 12,
): Promise<ActivityItem[]> {
  const { rows } = await query<ActivityItem>(
    `SELECT * FROM activity WHERE business_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [businessId, limit],
  )
  return rows
}

/* ---------------------------- Dashboard ----------------------------- */

export interface DashboardStats {
  branch_count: number
  product_count: number
  total_units: number
  low_stock_count: number
  transfers_30d: number
}

export async function getDashboardStats(businessId: string): Promise<DashboardStats> {
  const { rows } = await query<DashboardStats>(
    `SELECT
       (SELECT COUNT(*) FROM branches WHERE business_id = $1)::int AS branch_count,
       (SELECT COUNT(*) FROM products WHERE business_id = $1)::int AS product_count,
       (SELECT COALESCE(SUM(i.quantity),0) FROM inventory i
          JOIN branches b ON b.id = i.branch_id WHERE b.business_id = $1)::int AS total_units,
       (SELECT COUNT(*) FROM alerts WHERE business_id = $1 AND resolved = false)::int AS low_stock_count,
       (SELECT COUNT(*) FROM transfers WHERE business_id = $1
          AND created_at >= now() - interval '30 days')::int AS transfers_30d`,
    [businessId],
  )
  return rows[0]
}

export interface BranchStockBar {
  branch_name: string
  total_units: number
}

export async function getStockByBranch(businessId: string): Promise<BranchStockBar[]> {
  const { rows } = await query<BranchStockBar>(
    `SELECT b.name AS branch_name, COALESCE(SUM(i.quantity),0)::int AS total_units
     FROM branches b
     LEFT JOIN inventory i ON i.branch_id = b.id
     WHERE b.business_id = $1
     GROUP BY b.id
     ORDER BY total_units DESC`,
    [businessId],
  )
  return rows
}
