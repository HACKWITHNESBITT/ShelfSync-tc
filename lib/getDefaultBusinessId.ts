import { query } from "./db"

let cachedBusinessId: string | null = null

export async function getDefaultBusinessId(): Promise<string> {
  if (cachedBusinessId) return cachedBusinessId

  try {
    // Try to get the first business
    const result = await query("SELECT id FROM businesses ORDER BY created_at ASC LIMIT 1")
    if (result.rows.length > 0) {
      cachedBusinessId = result.rows[0].id as string
      return cachedBusinessId
    }

    // If no business exists, create a default one with demo data
    console.log("[v0] No business found, creating default business with demo data...")
    const businessRes = await query(
      `INSERT INTO businesses (name, owner_id, created_at) 
       VALUES ($1, NULL, NOW()) RETURNING id`,
      ["Default Business"]
    )
    const businessId = businessRes.rows[0].id as string
    cachedBusinessId = businessId

    // Create demo branches
    await query(
      `INSERT INTO branches (business_id, name, location, created_at) VALUES
       ($1, 'Main Branch', 'New York', NOW()),
       ($1, 'Secondary Branch', 'Los Angeles', NOW())`,
      [businessId]
    )

    // Get branch IDs for product assignment
    const branchesRes = await query(`SELECT id FROM branches WHERE business_id = $1 LIMIT 2`, [
      businessId,
    ])
    const branches = branchesRes.rows

    // Create demo products
    await query(
      `INSERT INTO products (business_id, name, sku, unit_price, created_at) VALUES
       ($1, 'Laptop', 'SKU-001', 999.99, NOW()),
       ($1, 'Keyboard', 'SKU-002', 79.99, NOW()),
       ($1, 'Mouse', 'SKU-003', 29.99, NOW()),
       ($1, 'Monitor', 'SKU-004', 299.99, NOW())`,
      [businessId]
    )

    // Get product IDs
    const productsRes = await query(`SELECT id FROM products WHERE business_id = $1`, [businessId])
    const products = productsRes.rows

    // Create inventory records for each product/branch
    for (const product of products) {
      for (const branch of branches) {
        await query(
          `INSERT INTO inventory (business_id, product_id, branch_id, quantity, created_at) 
           VALUES ($1, $2, $3, $4, NOW())`,
          [businessId, product.id, branch.id, Math.floor(Math.random() * 100) + 10]
        )
      }
    }

    console.log("[v0] Default business created with ID:", businessId)
    return businessId
  } catch (err) {
    console.error("[v0] Error in getDefaultBusinessId:", err)
    throw err
  }
}
