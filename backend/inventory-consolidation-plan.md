# خطة دمج كيانات المخزون (Inventory Consolidation Plan)

## التاريخ: 30 يونيو 2026

---

## 1. مقدمة

يحتوي الكود حاليًا على **3 كيانات منفصلة** للمخزون:
- **Product** (`products` table) - في `inventory` module
- **RawMaterial** (`raw_materials` table) - في `manufacturing` module
- **Accessory** (`accessories` table) - في `manufacturing` module

بالإضافة إلى وجود **type discriminator** في جدول `products` (حقل `type`) يدعم القيم:
`FINISHED`, `RAW`, `RAW_PLASTIC`, `SEMI_FINISHED`, `ACCESSORY`, `PACKAGING`, `IMPORTED`

الهدف هو توحيد كل هذه الكيانات في جدول `products` واحد مع `type` discriminator لإزالة التكرار.

---

## 2. هيكل كل Entity

### 2.1 Product Entity

الملف: `src/inventory/entities/product.entity.ts`

| الحقل | النوع | إعدادات | ملاحظات |
|---|---|---|---|
| id | number (PK) | auto-increment | |
| name | string | required | |
| sku | string | nullable | |
| barcode | string | nullable | |
| cost_price | decimal(10,2) | default: 0 | |
| selling_price | decimal(10,2) | default: 0 | |
| category_id | number (FK → categories) | required | |
| warehouse_id | number (FK → warehouses) | required | |
| unit | string | default: piece | |
| type | string | default: FINISHED | Discriminator |
| description | string | nullable | |
| min_stock | decimal(10,2) | nullable | |
| weight_grams | decimal(10,2) | nullable | |
| image_path | string | nullable | |
| raw_material_type | string | nullable | مثال: PLASTIC |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Relations:** ManyToOne → Category, ManyToOne → Warehouse

### 2.2 RawMaterial Entity

الملف: `src/manufacturing/entities/raw-material.entity.ts`

| الحقل | النوع | إعدادات | ملاحظات |
|---|---|---|---|
| id | number (PK) | auto-increment | |
| product_id | number (FK → products) | required | يربط بجدول products |
| preferred_supplier_id | number (FK → suppliers) | nullable | |
| reorder_point | decimal(10,2) | default: 0 | الحد الأدنى |
| reorder_quantity | decimal(10,2) | default: 0 | الكمية المقترحة |
| avg_consumption_rate | decimal(10,4) | default: 0 | متوسط الاستهلاك اليومي |
| last_purchase_price | decimal(10,2) | nullable | |
| last_purchase_date | date | nullable | |
| notes | text | nullable | |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Relations:** ManyToOne → Product, ManyToOne → Supplier, OneToMany → RawMaterialConsumption, OneToMany → SupplierMaterial

ملاحظة: RawMaterial يشير إلى Product عبر product_id. الشرط في raw-material.service.ts يتطلب product.type === RAW.

### 2.3 Accessory Entity

الملف: `src/manufacturing/entities/accessory.entity.ts`

| الحقل | النوع | إعدادات | ملاحظات |
|---|---|---|---|
| id | number (PK) | auto-increment | |
| product_id | number (FK → products) | required | يربط بجدول products |
| preferred_supplier_id | number (FK → suppliers) | nullable | |
| reorder_point | decimal(10,2) | default: 0 | |
| reorder_quantity | decimal(10,2) | default: 0 | |
| image_path | string | nullable | |
| weight_per_piece | decimal(10,2) | nullable | وزن القطعة بالجرام |
| last_purchase_price | decimal(10,2) | nullable | |
| last_purchase_date | date | nullable | |
| notes | text | nullable | |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |
| deleted_at | timestamp | nullable | Soft delete |

**Relations:** ManyToOne → Product, ManyToOne → Supplier

ملاحظة: Accessory يشير إلى Product عبر product_id. عند الإنشاء، product.type = ACCESSORY.

---

## 3. الجداول المساعدة المرتبطة

- **Stock** (stock): product_id + warehouse_id (PK), quantity - نفس الجدول لجميع الأنواع
- **StockMovement** (stock_movements): product_id, type(IN/OUT/ADJUST), reference_type, reference_id
- **BOM** (boms): product_id, carton_product_id, box_product_id ← كلها FK إلى products
- **BOMItem** (bom_items): product_id ← FK إلى products
- **SupplierMaterial** (supplier_materials): raw_material_id ← FK إلى raw_materials (مشكلة!)
- **RawMaterialConsumption** (raw_material_consumptions): raw_material_id ← FK إلى raw_materials (مشكلة!)

---

## 4. API Endpoints

### Product (Inventory Controller - /inventory)

| Method | Path | Function |
|---|---|---|
| GET | /inventory/products | List with filters (search, type, categoryId, page, limit, lowStock, warehouseId) |
| GET | /inventory/products/export | Export Excel |
| POST | /inventory/products/import | Import Excel |
| POST | /inventory/products/upload-image | Upload image |
| GET | /inventory/products/:id | Get one |
| POST | /inventory/products | Create |
| PUT | /inventory/products/:id | Update |
| DELETE | /inventory/products/:id | Delete |
| GET | /inventory/products/:id/movements | Movements |
| POST | /inventory/products/:id/recalculate | Recalculate stock |
| POST | /inventory/products/bulk-update-prices | Bulk price update |
| POST | /inventory/products/smart-assign | Smart warehouse assign |
| POST | /inventory/products/:id/auto-price | Auto price by BOM |

### RawMaterial (Manufacturing Controller - /manufacturing)

| Method | Path | Function |
|---|---|---|
| GET | /manufacturing/raw-materials | List all |
| GET | /manufacturing/raw-materials/:id | Get one |
| POST | /manufacturing/raw-materials | Create |
| PUT | /manufacturing/raw-materials/:id | Update |
| DELETE | /manufacturing/raw-materials/:id | Delete |
| GET | /manufacturing/raw-materials/consumption/history | Consumption history |
| POST | /manufacturing/raw-materials/consumption | Record consumption |
| GET | /manufacturing/raw-materials/alerts/low-stock | Low stock alerts |
| GET | /manufacturing/raw-materials/:id/suppliers | Suppliers for material |
| POST | /manufacturing/raw-materials/:id/suppliers | Add supplier to material |
| POST | /manufacturing/raw-materials/:id/purchase | Add stock (purchase) |
| GET | /manufacturing/raw-materials/:id/movements | Movements |
| POST | /manufacturing/raw-materials/:id/recalculate | Recalculate stock |
| GET | /manufacturing/export/raw-materials | Export Excel |
| POST | /manufacturing/import/raw-materials | Import Excel |

### Accessory (Accessories Controller - /manufacturing/accessories)

| Method | Path | Function |
|---|---|---|
| GET | /manufacturing/accessories | List all |
| GET | /manufacturing/accessories/alerts | Low stock alerts |
| GET | /manufacturing/accessories/reports/top-consumed | Top consumed |
| GET | /manufacturing/accessories/reports/slow-moving | Slow moving |
| GET | /manufacturing/accessories/po/draft | Purchase order draft |
| POST | /manufacturing/accessories/stock/bulk | Bulk add stock |
| GET | /manufacturing/accessories/:id | Get one |
| POST | /manufacturing/accessories | Create (with image upload) |
| PUT | /manufacturing/accessories/:id | Update (with image upload) |
| DELETE | /manufacturing/accessories/:id | Soft delete |
| GET | /manufacturing/accessories/:id/history | History |
| GET | /manufacturing/accessories/stats/total-value | Total value |
| POST | /manufacturing/accessories/:id/stock/add | Add stock |
| POST | /manufacturing/accessories/:id/stock/consume | Consume stock |
| GET | /manufacturing/accessories/export/excel | Export Excel |
| POST | /manufacturing/accessories/import/excel | Import Excel |

---

## 5. Table Relationships (FKs)

كل شيء يشير إلى products(id) باستثناء:
1. supplier_materials.raw_material_id → raw_materials(id)
2. raw_material_consumptions.raw_material_id → raw_materials(id)

القائمة الكاملة:
- products.category_id → categories(id)
- products.warehouse_id → warehouses(id)
- raw_materials.product_id → products(id)
- raw_materials.preferred_supplier_id → suppliers(id)
- accessories.product_id → products(id)
- accessories.preferred_supplier_id → suppliers(id)
- stock.product_id → products(id), stock.warehouse_id → warehouses(id)
- stock_movements.product_id → products(id), stock_movements.warehouse_id → warehouses(id)
- boms.product_id, carton_product_id, box_product_id → products(id)
- bom_items.product_id → products(id)
- molds.product_id → products(id)
- manufacturing_orders.product_id → products(id)
- production_batches.product_id → products(id)
- production_schedules.product_id → products(id)
- qc_inspections.product_id → products(id)
- purchase_order_items.product_id → products(id)
- purchase_return_items.product_id → products(id)
- sales_order_items.product_id → products(id)
- sales_return_items.product_id → products(id)
- quote_items.product_id → products(id)

---

## 6. خطة دمج مقترحة

### 6.1 إضافة Columns إلى جدول products

| الحقل الجديد | مصدره | نوعه |
|---|---|---|
| reorder_point | RawMaterial + Accessory | decimal(10,2), nullable |
| reorder_quantity | RawMaterial + Accessory | decimal(10,2), nullable |
| avg_consumption_rate | RawMaterial | decimal(10,4), nullable |
| last_purchase_price | RawMaterial + Accessory | decimal(10,2), nullable |
| last_purchase_date | RawMaterial + Accessory | date, nullable |
| weight_per_piece | Accessory | decimal(10,2), nullable |
| preferred_supplier_id | RawMaterial + Accessory | int (FK → suppliers), nullable |
| notes | RawMaterial + Accessory | text, nullable |
| deleted_at | Accessory | timestamp, nullable (soft delete) |

### 6.2 ProductType Enum (جديد)

```typescript
export enum ProductType {
  RAW = 'RAW',
  RAW_PLASTIC = 'RAW_PLASTIC',
  SEMI_FINISHED = 'SEMI_FINISHED',
  FINISHED = 'FINISHED',
  ACCESSORY = 'ACCESSORY',
  PACKAGING = 'PACKAGING',
  IMPORTED = 'IMPORTED',
}
```

### 6.3 خطة الإزالة على 3 مراحل

**المرحلة 1: إضافة الحقول فقط**
- إضافة الـ columns الجديدة إلى جدول products
- إضافة ProductType enum
- تحديث Product entity
- لا تغيير في raw_materials أو accessories

**المرحلة 2: Dual-Write**
- تحديث raw-material.service.ts ليكتب أيضًا في products
- تحديث accessory services ليكتب أيضًا في products
- تحديث كل الكود الذي يقرأ raw_materials ليشمل products

**المرحلة 3: الإزالة الكاملة**
- SupplierMaterial.raw_material_id ← تغيير إلى product_id
- RawMaterialConsumption.raw_material_id ← تغيير إلى product_id
- إزالة raw_materials و accessories tables
- إزالة entities, services, controllers القديمة
- دمج APIs تحت /inventory/products

---

## 7. الكود المتأثر بـ product.type

| الملف | السطر | الكود الحالي |
|---|---|---|
| raw-material.service.ts | 84 | product.type !== RAW |
| manufacturing-order.service.ts | 37 | item.product?.type === RAW |
| purchases.service.ts | 348, 457 | poProduct?.type === RAW |
| product-pricing.service.ts | 81-82 | type === RAW → IN (RAW, RAW_PLASTIC) |
| product-crud.service.ts | 67-68 | type === RAW → IN (RAW, RAW_PLASTIC) |
| inventory.service.ts | 429-435 | RAW, RAW_PLASTIC, FINISHED, PACKAGING, IMPORTED |
| accessory-crud.service.ts | 78 | type: ACCESSORY |
| accessory-export.service.ts | 217 | type: ACCESSORY |

---

## 8. المخاطر والملاحظات

### مخاطر عالية
1. **SupplierMaterial + RawMaterialConsumption** مرتبطان بـ raw_materials.id وليس products.id
2. **البيانات في Docker PostgreSQL** - أي تغيير schema يعرض البيانات للخطر
3. **manufacturing.service.ts** - يستخدم rawMaterialRepo في createProduction transaction

### مخاطر متوسطة
4. **Soft delete** في Accessory (deleted_at) غير موجود في Product
5. **is_preferred** في SupplierMaterial يحتاج إعادة تصميم بعد الدمج
6. **Frontend** يطلب /api/v1/accessories (غير موجود حاليًا) - الدمج قد يكسر routes

### توصيات
- Phased rollout على 3 مراحل
- DATABASE_SYNCHRONIZE=false
- إنشاء migration جديدة
- Backup قبل أي تغيير schema
- تحديث AGENTS.md بعد الدمج
