# InvenTrack — REST API Specification
## Version 1.0 | Base URL: `https://api.inventrack.com/v1`

---

## Authentication
All endpoints (except auth routes) require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

JWT tokens expire after **24 hours**. Use the refresh endpoint to renew.

---

## 1. AUTH

### POST `/auth/login`
Authenticate and receive access token.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "password123"
}
```
**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBh...",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "admin@company.com",
    "role": "admin"
  }
}
```
**Errors:** `401 Invalid credentials` · `403 Account suspended`

---

### POST `/auth/refresh`
**Request:** `{ "refresh_token": "string" }`
**Response 200:** `{ "token": "string", "expires_in": 86400 }`

---

### POST `/auth/logout`
Invalidates the current session token.
**Response 200:** `{ "message": "Logged out successfully" }`

---

### POST `/auth/forgot-password`
**Request:** `{ "email": "user@company.com" }`
**Response 200:** `{ "message": "Reset link sent" }`

---

### POST `/auth/reset-password`
**Request:** `{ "token": "string", "password": "newpassword123" }`
**Response 200:** `{ "message": "Password updated" }`

---

## 2. USERS

### GET `/users`
List all users.
**Roles:** admin
**Query params:** `page` `limit` `role` `status` `search`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@company.com",
      "role": "manager",
      "status": "active",
      "last_login_at": "2026-02-25T08:30:00Z",
      "created_at": "2023-03-22T00:00:00Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 20, "pages": 3 }
}
```

---

### POST `/users`
Create a new user.
**Roles:** admin

**Request:**
```json
{
  "name": "Alice Brown",
  "email": "alice@company.com",
  "password": "temp_password123",
  "role": "staff"
}
```
**Response 201:** `{ "id": "uuid", "name": "Alice Brown", ... }`

---

### GET `/users/:id`
Get user by ID.
**Roles:** admin (any user) · self (own profile)
**Response 200:** Full user object.

---

### PATCH `/users/:id`
Update user.
**Roles:** admin
**Request:** Any subset of `{ name, email, role, status }`
**Response 200:** Updated user object.

---

### DELETE `/users/:id`
Soft-delete (deactivates) a user.
**Roles:** admin
**Response 200:** `{ "message": "User deactivated" }`

---

## 3. PRODUCTS

### GET `/products`
List all products with stock summary.
**Query params:**
| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (default: 1) |
| `limit` | int | Per page (default: 20, max: 100) |
| `search` | string | Search name or SKU |
| `category_id` | uuid | Filter by category |
| `supplier_id` | uuid | Filter by supplier |
| `status` | string | `in_stock` / `low_stock` / `critical` |
| `warehouse_id` | uuid | Filter by warehouse |
| `sort` | string | `name` / `qty` / `price` / `created_at` |
| `order` | string | `asc` / `desc` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "MacBook Pro 16\"",
      "sku": "MBP-001",
      "category": { "id": "uuid", "name": "Electronics" },
      "supplier": { "id": "uuid", "name": "Apple Inc" },
      "cost_price": 1800.00,
      "selling_price": 2499.00,
      "total_qty": 145,
      "total_value": 261000.00,
      "reorder_point": 20,
      "status": "in_stock",
      "unit": "piece",
      "image_url": "https://cdn.inventrack.com/products/mbp.jpg",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": { "total": 234, "page": 1, "limit": 20, "pages": 12 }
}
```

---

### POST `/products`
Create a new product.
**Roles:** admin, manager

**Request:**
```json
{
  "name": "MacBook Pro 16\"",
  "sku": "MBP-001",
  "barcode": "0194252014417",
  "description": "Apple M3 Pro chip, 16GB RAM",
  "category_id": "uuid",
  "supplier_id": "uuid",
  "cost_price": 1800.00,
  "selling_price": 2499.00,
  "reorder_point": 20,
  "reorder_qty": 50,
  "unit": "piece",
  "weight_kg": 2.1,
  "initial_stock": {
    "warehouse_id": "uuid",
    "quantity": 145
  }
}
```
**Response 201:** Product object with `id`

---

### GET `/products/:id`
Get single product with full details.
**Response 200:**
```json
{
  "id": "uuid",
  "name": "MacBook Pro 16\"",
  "sku": "MBP-001",
  "stock_by_warehouse": [
    { "warehouse_id": "uuid", "warehouse_name": "Warehouse A", "quantity": 100 },
    { "warehouse_id": "uuid", "warehouse_name": "Warehouse B", "quantity": 45 }
  ],
  "recent_movements": [ ... ],
  ...
}
```

---

### PATCH `/products/:id`
Update product details.
**Roles:** admin, manager
**Request:** Any subset of product fields.
**Response 200:** Updated product.

---

### DELETE `/products/:id`
Soft-delete (marks as discontinued).
**Roles:** admin
**Response 200:** `{ "message": "Product discontinued" }`

---

### POST `/products/import`
Bulk import products via CSV/JSON.
**Roles:** admin, manager
**Content-Type:** `multipart/form-data`
**Body:** `file` (CSV file with headers matching product fields)
**Response 200:** `{ "imported": 120, "failed": 3, "errors": [...] }`

---

## 4. STOCK MOVEMENTS

### GET `/movements`
List stock movement history.
**Query params:** `product_id` `warehouse_id` `type` `from_date` `to_date` `page` `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "product": { "id": "uuid", "name": "MacBook Pro", "sku": "MBP-001" },
      "warehouse": { "id": "uuid", "name": "Warehouse A" },
      "movement_type": "in",
      "quantity": 50,
      "quantity_before": 95,
      "quantity_after": 145,
      "reference_no": "PO-2026-089",
      "notes": "Monthly restock",
      "unit_cost": 1800.00,
      "performed_by": { "id": "uuid", "name": "Jane Doe" },
      "created_at": "2026-02-25T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### POST `/movements`
Record a stock movement (in/out/adjustment/transfer).
**Roles:** admin, manager, staff

**Request (Stock IN):**
```json
{
  "product_id": "uuid",
  "warehouse_id": "uuid",
  "movement_type": "in",
  "quantity": 50,
  "reference_no": "PO-2026-089",
  "notes": "Monthly restock",
  "unit_cost": 1800.00
}
```

**Request (Transfer):**
```json
{
  "product_id": "uuid",
  "warehouse_id": "uuid-from",
  "movement_type": "transfer",
  "quantity": 20,
  "to_warehouse_id": "uuid-to",
  "notes": "Transfer to LA warehouse"
}
```
**Response 201:** Movement record + updated inventory snapshot.

---

## 5. INVENTORY

### GET `/inventory`
Current stock levels across all products and warehouses.
**Query params:** `warehouse_id` `status` `low_stock_only`

**Response 200:**
```json
{
  "data": [
    {
      "product_id": "uuid",
      "product_name": "MacBook Pro",
      "sku": "MBP-001",
      "warehouse": "Warehouse A",
      "quantity": 145,
      "reorder_point": 20,
      "status": "in_stock",
      "last_updated": "2026-02-25T09:00:00Z"
    }
  ]
}
```

---

### GET `/inventory/alerts`
Products at or below reorder point.
**Response 200:**
```json
{
  "data": [
    {
      "product_id": "uuid",
      "product_name": "USB-C Hub",
      "sku": "HUB-012",
      "current_qty": 3,
      "reorder_point": 10,
      "shortage": 7,
      "supplier": { "id": "uuid", "name": "Anker" },
      "status": "critical"
    }
  ],
  "total_alerts": 5
}
```

---

## 6. PURCHASE ORDERS

### GET `/purchase-orders`
List purchase orders.
**Query params:** `status` `supplier_id` `from_date` `to_date` `page` `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "po_number": "PO-2026-089",
      "supplier": { "id": "uuid", "name": "Apple Inc" },
      "warehouse": { "id": "uuid", "name": "Warehouse A" },
      "status": "pending",
      "total_amount": 90000.00,
      "expected_date": "2026-03-05",
      "created_by": { "name": "John Smith" },
      "created_at": "2026-02-25T08:00:00Z"
    }
  ]
}
```

---

### POST `/purchase-orders`
Create a purchase order.
**Roles:** admin, manager

**Request:**
```json
{
  "supplier_id": "uuid",
  "warehouse_id": "uuid",
  "expected_date": "2026-03-05",
  "notes": "Urgent restock",
  "items": [
    { "product_id": "uuid", "quantity_ordered": 50, "unit_cost": 1800.00 },
    { "product_id": "uuid", "quantity_ordered": 100, "unit_cost": 899.00 }
  ]
}
```
**Response 201:** Full PO with generated `po_number`.

---

### PATCH `/purchase-orders/:id/approve`
Approve a purchase order.
**Roles:** admin, manager
**Response 200:** `{ "status": "approved", "approved_by": "uuid", "approved_at": "..." }`

---

### PATCH `/purchase-orders/:id/receive`
Mark PO as received and auto-create stock movements.
**Roles:** admin, manager, staff

**Request:**
```json
{
  "items": [
    { "po_item_id": "uuid", "quantity_received": 48 },
    { "po_item_id": "uuid", "quantity_received": 100 }
  ],
  "notes": "2 units damaged on arrival"
}
```
**Response 200:** Updated PO + list of stock movements created.

---

## 7. SUPPLIERS

### GET `/suppliers`
**Query params:** `search` `is_active` `page` `limit`
**Response 200:** Paginated supplier list.

### POST `/suppliers`
**Roles:** admin, manager
**Request:** `{ name, email, phone, address, payment_terms, lead_time_days }`
**Response 201:** Supplier object.

### PATCH `/suppliers/:id`
Update supplier.
**Response 200:** Updated supplier.

### DELETE `/suppliers/:id`
Deactivate supplier.

---

## 8. CATEGORIES

### GET `/categories`
Hierarchical category list.
**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "product_count": 42,
      "children": [
        { "id": "uuid", "name": "Laptops", "product_count": 15 }
      ]
    }
  ]
}
```

### POST `/categories`
**Request:** `{ name, parent_id?, description, icon }`
**Response 201:** Category object.

---

## 9. REPORTS

### GET `/reports/inventory-valuation`
**Query params:** `warehouse_id` `category_id` `as_of_date`
**Response 200:**
```json
{
  "as_of": "2026-02-25",
  "total_value": 2840500.00,
  "total_units": 12540,
  "by_category": [
    { "category": "Electronics", "units": 8100, "value": 1850000.00, "percentage": 65.1 }
  ],
  "by_warehouse": [
    { "warehouse": "Warehouse A", "units": 7200, "value": 1620000.00 }
  ]
}
```

---

### GET `/reports/stock-movement`
**Query params:** `from_date` `to_date` `product_id` `warehouse_id` `type`
**Response 200:**
```json
{
  "from_date": "2026-02-01",
  "to_date": "2026-02-25",
  "summary": {
    "total_in": 790,
    "total_out": 540,
    "net_change": 250,
    "adjustments": 12
  },
  "by_day": [
    { "date": "2026-02-25", "in": 45, "out": 30 }
  ],
  "movements": [ ... ]
}
```

---

### GET `/reports/reorder`
Products needing reorder.
**Response 200:**
```json
{
  "data": [
    {
      "product_id": "uuid",
      "sku": "HUB-012",
      "name": "USB-C Hub",
      "current_qty": 3,
      "reorder_point": 10,
      "reorder_qty": 50,
      "suggested_order_qty": 50,
      "supplier": { "name": "Anker", "lead_time_days": 7 },
      "estimated_cost": 2250.00
    }
  ]
}
```

---

### GET `/reports/top-products`
**Query params:** `limit` `metric` (`value` / `quantity`) `from_date` `to_date`
**Response 200:**
```json
{
  "data": [
    {
      "rank": 1,
      "product_id": "uuid",
      "name": "MacBook Pro 16\"",
      "sku": "MBP-001",
      "total_qty": 145,
      "total_value": 362550.00,
      "percentage_of_total": 12.8
    }
  ]
}
```

---

### GET `/reports/export`
Export report as CSV or PDF.
**Query params:** `report` `format` (`csv` / `pdf`) `from_date` `to_date`
**Response:** File download (Content-Disposition: attachment)

---

## 10. WAREHOUSES

### GET `/warehouses`
**Response 200:** List of warehouses with stock summaries.

### POST `/warehouses`
**Roles:** admin
**Request:** `{ name, code, address, city, country, manager_id }`

### PATCH `/warehouses/:id`
**Roles:** admin

---

## 11. NOTIFICATIONS

### GET `/notifications`
**Query params:** `unread_only` `page` `limit`
**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Low Stock Alert",
      "message": "USB-C Hub has only 3 units remaining",
      "type": "warning",
      "read_at": null,
      "created_at": "2026-02-25T07:00:00Z"
    }
  ],
  "unread_count": 5
}
```

### PATCH `/notifications/:id/read`
Mark notification as read.

### PATCH `/notifications/read-all`
Mark all notifications as read.

---

## 12. AUDIT LOGS

### GET `/audit-logs`
**Roles:** admin
**Query params:** `user_id` `entity_type` `action` `from_date` `to_date` `page` `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": { "name": "John Smith" },
      "action": "product.update",
      "entity_type": "product",
      "entity_id": "uuid",
      "old_values": { "selling_price": 2299.00 },
      "new_values": { "selling_price": 2499.00 },
      "ip_address": "192.168.1.10",
      "created_at": "2026-02-25T09:15:00Z"
    }
  ]
}
```

---

## Standard Error Responses

| Code | Meaning |
|---|---|
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing/invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Not Found |
| 409 | Conflict — e.g. duplicate SKU |
| 422 | Unprocessable Entity |
| 429 | Rate Limited (100 req/min default) |
| 500 | Internal Server Error |

**Error body:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "SKU already exists",
  "details": [
    { "field": "sku", "message": "Must be unique" }
  ]
}
```

---

## Rate Limiting
- Default: **100 requests/minute** per token
- Bulk endpoints: **10 requests/minute**
- Auth endpoints: **5 requests/minute** per IP

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709892060
```

---

## Pagination
All list endpoints follow the same pattern:
```
GET /products?page=2&limit=20
```
Response always includes:
```json
"meta": {
  "total": 234,
  "page": 2,
  "limit": 20,
  "pages": 12,
  "has_next": true,
  "has_prev": true
}
```
