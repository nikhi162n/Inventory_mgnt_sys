-- ============================================================
-- INVENTRACK — DATABASE SCHEMA
-- PostgreSQL 15+
-- ============================================================

-- ── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ──────────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('admin', 'manager', 'staff', 'viewer');
CREATE TYPE user_status     AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE product_status  AS ENUM ('in_stock', 'low_stock', 'critical', 'discontinued');
CREATE TYPE movement_type   AS ENUM ('in', 'out', 'adjustment', 'transfer');
CREATE TYPE order_status    AS ENUM ('pending', 'approved', 'ordered', 'received', 'cancelled');

-- ============================================================
-- 1. USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(120)  NOT NULL,
  email           VARCHAR(255)  NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  role            user_role     NOT NULL DEFAULT 'staff',
  status          user_status   NOT NULL DEFAULT 'active',
  avatar_url      TEXT,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT          NOT NULL UNIQUE,
  ip_address      INET,
  user_agent      TEXT,
  expires_at      TIMESTAMPTZ   NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE password_resets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT          NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ   NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. ORGANIZATION / WAREHOUSES
-- ============================================================

CREATE TABLE warehouses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100)  NOT NULL,
  code            VARCHAR(20)   NOT NULL UNIQUE,
  address         TEXT,
  city            VARCHAR(100),
  country         VARCHAR(100),
  manager_id      UUID          REFERENCES users(id),
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouse_zones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id    UUID          NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name            VARCHAR(100)  NOT NULL,  -- e.g. "Aisle A", "Shelf 3"
  description     TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. SUPPLIERS
-- ============================================================

CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200)  NOT NULL,
  code            VARCHAR(30)   UNIQUE,
  email           VARCHAR(255),
  phone           VARCHAR(30),
  website         TEXT,
  address         TEXT,
  city            VARCHAR(100),
  country         VARCHAR(100),
  payment_terms   VARCHAR(100),  -- e.g. "Net 30"
  lead_time_days  INT,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. CATEGORIES & PRODUCTS
-- ============================================================

CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100)  NOT NULL UNIQUE,
  slug            VARCHAR(100)  NOT NULL UNIQUE,
  parent_id       UUID          REFERENCES categories(id),
  description     TEXT,
  icon            VARCHAR(50),
  sort_order      INT           NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255)  NOT NULL,
  sku             VARCHAR(100)  NOT NULL UNIQUE,
  barcode         VARCHAR(100),
  description     TEXT,
  category_id     UUID          REFERENCES categories(id),
  supplier_id     UUID          REFERENCES suppliers(id),

  -- Pricing
  cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price   NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Stock control
  reorder_point   INT           NOT NULL DEFAULT 10,
  reorder_qty     INT           NOT NULL DEFAULT 50,
  status          product_status NOT NULL DEFAULT 'in_stock',

  -- Meta
  unit            VARCHAR(30)   NOT NULL DEFAULT 'piece', -- piece, kg, litre
  weight_kg       NUMERIC(8,3),
  image_url       TEXT,
  tags            TEXT[],
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,

  created_by      UUID          REFERENCES users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Total stock per warehouse location
CREATE TABLE inventory_locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id    UUID          NOT NULL REFERENCES warehouses(id),
  zone_id         UUID          REFERENCES warehouse_zones(id),
  quantity        INT           NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id, zone_id)
);

-- Computed totals view
CREATE VIEW product_stock_summary AS
SELECT
  p.id AS product_id,
  p.name,
  p.sku,
  p.reorder_point,
  p.status,
  COALESCE(SUM(il.quantity), 0)         AS total_qty,
  COALESCE(SUM(il.quantity * p.cost_price), 0) AS total_value
FROM products p
LEFT JOIN inventory_locations il ON il.product_id = p.id
GROUP BY p.id;

-- ============================================================
-- 5. STOCK MOVEMENTS (Ledger)
-- ============================================================

CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID          NOT NULL REFERENCES products(id),
  warehouse_id    UUID          NOT NULL REFERENCES warehouses(id),
  zone_id         UUID          REFERENCES warehouse_zones(id),

  movement_type   movement_type NOT NULL,
  quantity        INT           NOT NULL,           -- always positive; type determines direction
  quantity_before INT           NOT NULL,
  quantity_after  INT           NOT NULL,

  reference_no    VARCHAR(100),                     -- PO number, order ID, etc.
  notes           TEXT,
  unit_cost       NUMERIC(12,2),

  -- Transfer fields (when type = 'transfer')
  to_warehouse_id UUID          REFERENCES warehouses(id),
  to_zone_id      UUID          REFERENCES warehouse_zones(id),

  performed_by    UUID          NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. PURCHASE ORDERS
-- ============================================================

CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number       VARCHAR(50)   NOT NULL UNIQUE,
  supplier_id     UUID          NOT NULL REFERENCES suppliers(id),
  warehouse_id    UUID          NOT NULL REFERENCES warehouses(id),
  status          order_status  NOT NULL DEFAULT 'pending',

  total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  expected_date   DATE,
  received_at     TIMESTAMPTZ,

  created_by      UUID          NOT NULL REFERENCES users(id),
  approved_by     UUID          REFERENCES users(id),
  approved_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id           UUID          NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id      UUID          NOT NULL REFERENCES products(id),
  quantity_ordered INT          NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INT         NOT NULL DEFAULT 0,
  unit_cost       NUMERIC(12,2) NOT NULL,
  total_cost      NUMERIC(14,2) GENERATED ALWAYS AS (quantity_ordered * unit_cost) STORED
);

-- ============================================================
-- 7. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          REFERENCES users(id),
  action          VARCHAR(100)  NOT NULL,  -- 'product.create', 'user.update', etc.
  entity_type     VARCHAR(50),             -- 'product', 'user', 'order'
  entity_id       UUID,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255)  NOT NULL,
  message         TEXT          NOT NULL,
  type            VARCHAR(50)   NOT NULL DEFAULT 'info',  -- info, warning, alert, success
  link            TEXT,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. INDEXES
-- ============================================================

CREATE INDEX idx_products_sku            ON products(sku);
CREATE INDEX idx_products_category       ON products(category_id);
CREATE INDEX idx_products_supplier       ON products(supplier_id);
CREATE INDEX idx_products_status         ON products(status);
CREATE INDEX idx_inv_locations_product   ON inventory_locations(product_id);
CREATE INDEX idx_inv_locations_warehouse ON inventory_locations(warehouse_id);
CREATE INDEX idx_movements_product       ON stock_movements(product_id);
CREATE INDEX idx_movements_date          ON stock_movements(created_at DESC);
CREATE INDEX idx_movements_type          ON stock_movements(movement_type);
CREATE INDEX idx_po_supplier             ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status               ON purchase_orders(status);
CREATE INDEX idx_audit_entity            ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user              ON audit_logs(user_id);
CREATE INDEX idx_audit_date              ON audit_logs(created_at DESC);
CREATE INDEX idx_sessions_token          ON sessions(token_hash);
CREATE INDEX idx_notifications_user      ON notifications(user_id, read_at);

-- ============================================================
-- 10. AUTO-UPDATE TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at   BEFORE UPDATE ON products   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suppliers_updated_at  BEFORE UPDATE ON suppliers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_po_updated_at         BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update product status based on stock level
CREATE OR REPLACE FUNCTION refresh_product_status()
RETURNS TRIGGER AS $$
DECLARE
  total_qty   INT;
  reorder_pt  INT;
BEGIN
  SELECT COALESCE(SUM(il.quantity), 0), p.reorder_point
    INTO total_qty, reorder_pt
  FROM inventory_locations il
  JOIN products p ON p.id = il.product_id
  WHERE il.product_id = NEW.product_id
  GROUP BY p.reorder_point;

  UPDATE products
    SET status = CASE
      WHEN total_qty = 0            THEN 'critical'
      WHEN total_qty <= reorder_pt  THEN 'low_stock'
      ELSE 'in_stock'
    END
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_status
AFTER INSERT OR UPDATE ON inventory_locations
FOR EACH ROW EXECUTE FUNCTION refresh_product_status();

-- ============================================================
-- 11. SEED DATA (Demo)
-- ============================================================

INSERT INTO warehouses (name, code, city, country) VALUES
  ('Warehouse A', 'WH-A', 'New York', 'US'),
  ('Warehouse B', 'WH-B', 'Los Angeles', 'US'),
  ('Warehouse C', 'WH-C', 'Chicago', 'US');

INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Accessories', 'accessories'),
  ('Cables', 'cables'),
  ('Furniture', 'furniture');

INSERT INTO users (name, email, password_hash, role) VALUES
  ('John Smith', 'admin@company.com', crypt('admin123', gen_salt('bf')), 'admin'),
  ('Jane Doe',   'jane@company.com',  crypt('pass123',  gen_salt('bf')), 'manager');
