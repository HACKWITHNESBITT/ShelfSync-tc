-- ShelfSync schema
-- All IDs are application-generated text (cuid-style) values.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS businesses (
  id          TEXT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  owner_id    TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  default_threshold INT NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);

CREATE TABLE IF NOT EXISTS branches (
  id          TEXT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  address     VARCHAR(255) NOT NULL DEFAULT '',
  city        VARCHAR(120) NOT NULL DEFAULT '',
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_branches_business ON branches(business_id);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  sku         VARCHAR(100) NOT NULL,
  category    VARCHAR(120) NOT NULL DEFAULT 'Uncategorized',
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS inventory (
  id                  TEXT PRIMARY KEY,
  branch_id           TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_id          TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity            INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

CREATE TABLE IF NOT EXISTS transfers (
  id            TEXT PRIMARY KEY,
  business_id   TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  from_branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  to_branch_id   TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity       INT NOT NULL CHECK (quantity > 0),
  status         VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transfers_business ON transfers(business_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created ON transfers(created_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id           TEXT PRIMARY KEY,
  business_id  TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  inventory_id TEXT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  resolved     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inventory_id)
);
CREATE INDEX IF NOT EXISTS idx_alerts_business ON alerts(business_id) WHERE resolved = false;

-- Activity log for the dashboard recent-activity feed
CREATE TABLE IF NOT EXISTS activity (
  id          TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  type        VARCHAR(30) NOT NULL DEFAULT 'info',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_business ON activity(business_id, created_at DESC);
