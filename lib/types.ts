export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Business {
  id: string
  name: string
  owner_id: string
  default_threshold: number
  created_at: string
}

export interface Branch {
  id: string
  name: string
  address: string
  city: string
  business_id: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  business_id: string
  created_at: string
}

export interface InventoryRow {
  id: string
  branch_id: string
  product_id: string
  quantity: number
  low_stock_threshold: number
  updated_at: string
}

export interface Transfer {
  id: string
  business_id: string
  from_branch_id: string
  to_branch_id: string
  product_id: string
  quantity: number
  status: "completed" | "pending"
  created_at: string
}

export interface Alert {
  id: string
  business_id: string
  inventory_id: string
  resolved: boolean
  created_at: string
}

export interface ActivityItem {
  id: string
  business_id: string
  message: string
  type: string
  created_at: string
}

// Joined / view shapes used by the UI

export interface BranchWithStats extends Branch {
  product_count: number
  total_units: number
  low_stock_count: number
}

export interface ProductWithStock extends Product {
  total_quantity: number
  branch_count: number
  low_stock: boolean
}

export interface InventoryDetail {
  inventory_id: string
  product_id: string
  product_name: string
  sku: string
  category: string
  branch_id: string
  branch_name: string
  quantity: number
  low_stock_threshold: number
  low_stock: boolean
  updated_at: string
}

export interface TransferDetail extends Transfer {
  product_name: string
  from_branch_name: string
  to_branch_name: string
}

export interface AlertDetail extends Alert {
  product_name: string
  sku: string
  branch_name: string
  branch_id: string
  quantity: number
  low_stock_threshold: number
}
