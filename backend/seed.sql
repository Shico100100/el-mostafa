-- Seed demo data for empty tables
BEGIN;

-- Categories
INSERT INTO categories (name, description)
SELECT name, descr FROM (VALUES
  ('بلاستيك', 'منتجات بلاستيكية'),
  ('تغليف', 'مواد تغليف'),
  ('مواد خام', 'مواد خام أولية')
) AS t(name, descr)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = t.name);

-- Customers
INSERT INTO customers (name, phone, email, address, balance)
SELECT name, phone, email, address, balance FROM (VALUES
  ('شركة النصر للبلاستيك', '01234567890', 'nasar@example.com', 'القاهرة', 0),
  ('مصنع الأهرام للصناعات', '01234567891', 'ahram@example.com', 'الجيزة', 0),
  ('شركة الدلتا للتغليف', '01234567892', 'delta@example.com', 'المنصورة', 0),
  ('مؤسسة الإسكندرية', '01234567893', 'alex@example.com', 'الإسكندرية', 0),
  ('شركة النيل للتجارة', '01234567894', 'nile@example.com', 'القاهرة', 0)
) AS t(name, phone, email, address, balance)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customers.name = t.name);

-- Daily Production (last 3 days, machine 1-2, mold 1-2, raw_material 1)
INSERT INTO daily_production (machine_id, mold_id, raw_material_id, date, total_production_kg, pieces_produced, hours_worked, status, session_id)
SELECT * FROM (VALUES
  (1, 1, 1, CURRENT_DATE - 2, 50.00, 200, 8.0, 'COMPLETED'::varchar, 1),
  (2, 2, 1, CURRENT_DATE - 2, 75.50, 300, 8.0, 'COMPLETED'::varchar, 1),
  (1, 1, 1, CURRENT_DATE - 1, 45.00, 180, 8.0, 'COMPLETED'::varchar, 1),
  (2, 2, 1, CURRENT_DATE - 1, 80.00, 320, 8.0, 'COMPLETED'::varchar, 1),
  (1, 1, 1, CURRENT_DATE, 55.00, 220, 6.0, 'IN_PROGRESS'::varchar, 1),
  (2, 2, 1, CURRENT_DATE, 60.00, 240, 6.0, 'IN_PROGRESS'::varchar, 1)
) AS t(machine_id, mold_id, raw_material_id, date, total_production_kg, pieces_produced, hours_worked, status, session_id)
WHERE NOT EXISTS (SELECT 1 FROM daily_production LIMIT 1);

-- Production Schedules
INSERT INTO production_schedules (planned_date, shift, machine_id, mold_id, product_id, target_quantity, status, notes)
SELECT * FROM (VALUES
  (CURRENT_DATE + 1, 'DAY'::production_schedules_shift_enum, 1, 1, 1, 500, 'PLANNED'::production_schedules_status_enum, 'إنتاج عادي'),
  (CURRENT_DATE + 1, 'NIGHT'::production_schedules_shift_enum, 2, 2, 2, 400, 'PLANNED'::production_schedules_status_enum, 'إنتاج عادي'),
  (CURRENT_DATE + 2, 'DAY'::production_schedules_shift_enum, 1, 1, 1, 600, 'PLANNED'::production_schedules_status_enum, 'طلبية مستعجلة')
) AS t(planned_date, shift, machine_id, mold_id, product_id, target_quantity, status, notes)
WHERE NOT EXISTS (SELECT 1 FROM production_schedules LIMIT 1);

-- BOMs
INSERT INTO boms (name, product_id, pcs_per_carton, pcs_per_box, carton_product_id, box_product_id, description)
SELECT 
  'BOM - ' || p.name,
  p.id,
  100, 10,
  (SELECT id FROM products WHERE id != p.id ORDER BY id LIMIT 1 OFFSET 0),
  (SELECT id FROM products WHERE id != p.id ORDER BY id LIMIT 1 OFFSET 1),
  'Bill of Materials for ' || p.name
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM boms b WHERE b.product_id = p.id)
LIMIT 5;

-- Sales Orders
INSERT INTO sales_orders (customer_id, total_amount, status, notes, order_date)
SELECT c.id, 5000.00 * row_number() OVER (), 'PENDING', 'طلبية جديدة', CURRENT_DATE - (row_number() OVER ())::int
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM sales_orders LIMIT 1)
LIMIT 3;

-- Update product categories (assign first 2 categories)
UPDATE products SET category_id = ((id - 1) % 2) + 1 WHERE category_id IS NULL;

COMMIT;
