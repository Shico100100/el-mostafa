-- ============================================================
-- Composite Indexes for Performance Optimization
-- Run after schema is created (DATABASE_SYNCHRONIZE=false)
-- ============================================================

-- Manufacturing: production records lookup by machine + date
CREATE INDEX IF NOT EXISTS idx_production_machine_date
ON daily_production (machine_id, date DESC);

-- Manufacturing: BOM component lookups
CREATE INDEX IF NOT EXISTS idx_bom_product_component
ON bom_items (product_id, material_id);

-- Inventory: stock by product + warehouse
CREATE INDEX IF NOT EXISTS idx_stock_product_warehouse
ON stock (product_id, warehouse_id);

-- Inventory: stock movements by date range
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date
ON stock_movements (product_id, date DESC);

-- Sales: orders by customer + date
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_date
ON sales_orders (customer_id, order_date DESC);

-- Purchases: orders by supplier + date
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_date
ON purchase_orders (supplier_id, order_date DESC);

-- Accounting: journal entries by account + date
CREATE INDEX IF NOT EXISTS idx_journal_entries_account_date
ON journal_entries (account_id, date DESC);

-- Manufacturing: daily production by product + date
CREATE INDEX IF NOT EXISTS idx_daily_production_product_date
ON daily_production (product_id, date DESC);

-- Notifications: unread count query
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON notifications (user_id, is_read);