-- ============================================================
-- V1__Initial_Schema.sql
-- InvenTrack Database Migration
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role      AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER');
CREATE TYPE user_status    AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE product_status AS ENUM ('IN_STOCK', 'LOW_STOCK', 'CRITICAL', 'DISCONTINUED');
CREATE TYPE movement_type  AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER');
CREATE TYPE order_status   AS ENUM ('PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- USERS
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(120)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   TEXT          NOT NULL,
    role            VARCHAR(20)   NOT NULL DEFAULT 'STAFF',
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    avatar_url      TEXT,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- WAREHOUSES
CREATE TABLE warehouses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100)  NOT NULL,
    code            VARCHAR(20)   NOT NULL UNIQUE,
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100),
    manager_id      UUID REFERENCES users(id),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- SUPPLIERS
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
    payment_terms   VARCHAR(100),
    lead_time_days  INT,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- CATEGORIES
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100)  NOT NULL UNIQUE,
    slug            VARCHAR(100)  NOT NULL UNIQUE,
    parent_id       UUID REFERENCES categories(id),
    description     TEXT,
    icon            VARCHAR(50),
    sort_order      INT           NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- PRODUCTS
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)  NOT NULL,
    sku             VARCHAR(100)  NOT NULL UNIQUE,
    barcode         VARCHAR(100),
    description     TEXT,
    category_id     UUID REFERENCES categories(id),
    supplier_id     UUID REFERENCES suppliers(id),
    cost_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
    selling_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
    reorder_point   INT           NOT NULL DEFAULT 10,
    reorder_qty     INT           NOT NULL DEFAULT 50,
    status          VARCHAR(20)   NOT NULL DEFAULT 'IN_STOCK',
    unit            VARCHAR(30)   NOT NULL DEFAULT 'piece',
    weight_kg       NUMERIC(8,3),
    image_url       TEXT,
    tags            TEXT[],
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

-- INVENTORY LOCATIONS
CREATE TABLE inventory_locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    quantity        INT  NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, warehouse_id)
);

-- STOCK MOVEMENTS
CREATE TABLE stock_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    movement_type   VARCHAR(20)   NOT NULL,
    quantity        INT           NOT NULL,
    quantity_before INT           NOT NULL,
    quantity_after  INT           NOT NULL,
    reference_no    VARCHAR(100),
    notes           TEXT,
    unit_cost       NUMERIC(12,2),
    to_warehouse_id UUID REFERENCES warehouses(id),
    performed_by    UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- PURCHASE ORDERS
CREATE TABLE purchase_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number       VARCHAR(50)   NOT NULL UNIQUE,
    supplier_id     UUID NOT NULL REFERENCES suppliers(id),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
    notes           TEXT,
    expected_date   DATE,
    received_at     TIMESTAMPTZ,
    created_by_user UUID REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255)
);

CREATE TABLE purchase_order_items (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id             UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id        UUID NOT NULL REFERENCES products(id),
    quantity_ordered  INT  NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INT  NOT NULL DEFAULT 0,
    unit_cost         NUMERIC(12,2) NOT NULL
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   UUID,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50)  NOT NULL DEFAULT 'info',
    link        TEXT,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_products_sku          ON products(sku);
CREATE INDEX idx_products_status       ON products(status);
CREATE INDEX idx_products_category     ON products(category_id);
CREATE INDEX idx_inv_product           ON inventory_locations(product_id);
CREATE INDEX idx_movements_product     ON stock_movements(product_id);
CREATE INDEX idx_movements_date        ON stock_movements(created_at DESC);
CREATE INDEX idx_po_status             ON purchase_orders(status);
CREATE INDEX idx_audit_entity          ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_notif_user            ON notifications(user_id);
