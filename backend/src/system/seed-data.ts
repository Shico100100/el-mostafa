import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Logger } from '@nestjs/common';

const logger = new Logger('SeedData');

async function insertIgnore(
  qr: any,
  tableName: string,
  values: Record<string, any>[],
) {
  if (values.length === 0) return;
  const keys = Object.keys(values[0]).filter(k => !(typeof values[0][k] === 'object' && values[0][k] !== null));
  const cols = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const stmt = `INSERT INTO "${tableName}"(${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  for (const row of values) {
    const params = keys.map(k => (row[k] !== undefined ? row[k] : null));
    await qr.query(stmt, params);
  }
}

export async function seedDemoData(dataSource: DataSource) {
  logger.log('SEED DEMO DATA START');
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await insertIgnore(queryRunner, 'role', [
      { id: 1, name: 'admin' },
      { id: 2, name: 'user' },
    ]);
    logger.log('Roles seeded');

    await insertIgnore(queryRunner, 'status', [
      { id: 1, name: 'active' },
      { id: 2, name: 'inactive' },
    ]);
    logger.log('Statuses seeded');

    const hash = await bcrypt.hash('admin123', await bcrypt.genSalt());
    await insertIgnore(queryRunner, 'user', [
      { id: 1, email: 'admin@admin.com', password: hash, provider: 'email', firstName: 'مدير', lastName: 'النظام', roleId: 1, statusId: 1 },
      { id: 2, email: 'admin@example.com', password: hash, provider: 'email', firstName: 'Admin', lastName: 'User', roleId: 1, statusId: 1 },
    ]);
    logger.log('Users seeded');

    await insertIgnore(queryRunner, 'categories', [
      { id: 1, name: 'Raw Materials', description: 'المواد الخام' },
      { id: 2, name: 'Finished Products', description: 'المنتجات النهائية' },
      { id: 3, name: 'Spare Parts', description: 'قطع الغيار' },
    ]);
    logger.log('Categories seeded');

    await insertIgnore(queryRunner, 'warehouses', [
      { id: 1, name: 'Main Warehouse', location: 'المخزن الرئيسي - المصنع', is_active: true },
      { id: 2, name: 'Raw Materials Warehouse', location: 'مخزن المواد الخام', is_active: true },
    ]);
    logger.log('Warehouses seeded');

    await insertIgnore(queryRunner, 'products', [
      { id: 1, name: 'HDPE Granules', sku: 'RM-HDPE-001', barcode: '100001', cost_price: 8.50, selling_price: 12.00, category_id: 1, warehouse_id: 2, unit: 'kg', type: 'RAW', description: 'حبيبات HDPE عالية الكثافة', min_stock: 500, weight_grams: 1000, raw_material_type: 'HDPE' },
      { id: 2, name: 'PP Granules', sku: 'RM-PP-001', barcode: '100002', cost_price: 7.00, selling_price: 10.50, category_id: 1, warehouse_id: 2, unit: 'kg', type: 'RAW', description: 'حبيبات بولي بروبيلين', min_stock: 500, weight_grams: 1000, raw_material_type: 'PP' },
      { id: 3, name: 'Masterbatch Black', sku: 'RM-MB-BLK', barcode: '100003', cost_price: 15.00, selling_price: 22.00, category_id: 1, warehouse_id: 2, unit: 'kg', type: 'RAW', description: 'ماستر باتش أسود', min_stock: 100, weight_grams: 1000, raw_material_type: 'Masterbatch' },
      { id: 4, name: 'Masterbatch White', sku: 'RM-MB-WHT', barcode: '100004', cost_price: 16.00, selling_price: 24.00, category_id: 1, warehouse_id: 2, unit: 'kg', type: 'RAW', description: 'ماستر باتش أبيض', min_stock: 100, weight_grams: 1000, raw_material_type: 'Masterbatch' },
      { id: 5, name: 'LDPE Granules', sku: 'RM-LDPE-001', barcode: '100005', cost_price: 9.00, selling_price: 13.00, category_id: 1, warehouse_id: 2, unit: 'kg', type: 'RAW', description: 'حبيبات LDPE منخفضة الكثافة', min_stock: 300, weight_grams: 1000, raw_material_type: 'LDPE' },
      { id: 6, name: 'Plastic Chair 501', sku: 'FG-CH-501', barcode: '200001', cost_price: 25.00, selling_price: 45.00, category_id: 2, warehouse_id: 1, unit: 'piece', type: 'FINISHED', description: 'كرسي بلاستيك موديل 501', min_stock: 50, weight_grams: 1800 },
      { id: 7, name: 'Table Top 60x60', sku: 'FG-TT-60', barcode: '200002', cost_price: 35.00, selling_price: 65.00, category_id: 2, warehouse_id: 1, unit: 'piece', type: 'FINISHED', description: 'سطح طاولة 60×60 سم', min_stock: 30, weight_grams: 2500 },
      { id: 8, name: 'Storage Box 40L', sku: 'FG-SB-40', barcode: '200003', cost_price: 18.00, selling_price: 32.00, category_id: 2, warehouse_id: 1, unit: 'piece', type: 'FINISHED', description: 'صندوق تخزين 40 لتر', min_stock: 40, weight_grams: 1200 },
      { id: 9, name: 'Industrial Bucket 20L', sku: 'FG-IB-20', barcode: '200004', cost_price: 12.00, selling_price: 22.00, category_id: 2, warehouse_id: 1, unit: 'piece', type: 'FINISHED', description: 'دلو صناعي 20 لتر', min_stock: 60, weight_grams: 800 },
      { id: 10, name: 'Water Bottle 1.5L', sku: 'FG-WB-15', barcode: '200005', cost_price: 1.50, selling_price: 3.50, category_id: 2, warehouse_id: 1, unit: 'piece', type: 'FINISHED', description: 'قنينة ماء 1.5 لتر', min_stock: 500, weight_grams: 35 },
      { id: 11, name: 'Bottle Cap Blue', sku: 'FG-BC-BL', barcode: '200006', cost_price: 0.30, selling_price: 0.80, category_id: 2, warehouse_id: 1, unit: 'piece', type: 'FINISHED', description: 'غطاء قنينة أزرق', min_stock: 1000, weight_grams: 3 },
      { id: 12, name: 'Crate 40x30', sku: 'FG-CR-4030', barcode: '200007', cost_price: 20.00, selling_price: 38.00, category_id: 2, warehouse_id: 1, unit: 'piece', type: 'FINISHED', description: 'صندوق بلاستيك 40×30 سم', min_stock: 25, weight_grams: 1500 },
    ]);
    logger.log('Products seeded');

    await insertIgnore(queryRunner, 'customers', [
      { id: 1, name: 'شركة الأمل للبلاستيك', phone: '01234567890', email: 'info@alamal-plastic.com', address: 'المنطقة الصناعية - القاهرة', balance: 15000 },
      { id: 2, name: 'مؤسسة النور للتجارة', phone: '01234567891', email: 'info@annour-trade.com', address: 'شارع الجمهورية - الإسكندرية', balance: 8500 },
      { id: 3, name: 'شركة البركة للمواد الغذائية', phone: '01234567892', email: 'info@albaraka-food.com', address: 'المنطقة الصناعية - العاشر من رمضان', balance: 22000 },
      { id: 4, name: 'مصنع المستقبل للتعليب', phone: '01234567893', email: 'info@mustaqbal-canning.com', address: 'مدينة السادات - المنوفية', balance: 5000 },
      { id: 5, name: 'شركة الربيع للتعبئة', phone: '01234567894', email: 'info@rabie-packing.com', address: 'برج العرب - الإسكندرية', balance: 12000 },
    ]);
    logger.log('Customers seeded');

    await insertIgnore(queryRunner, 'suppliers', [
      { id: 1, name: 'شركة الخليج للبتروكيماويات', phone: '01234567895', email: 'sales@gulf-petrochem.com', address: 'الدمام - المملكة العربية السعودية', balance: 0 },
      { id: 2, name: 'مؤسسة الصين للتجارة', phone: '01234567896', email: 'sales@china-trade.cn', address: 'غوانزو - الصين', balance: 0 },
      { id: 3, name: 'الشركة المصرية للمواد الخام', phone: '01234567897', email: 'info@egypt-rawmaterials.com', address: 'السادس من أكتوبر - الجيزة', balance: 0 },
      { id: 4, name: 'مؤسسة الإتحاد للتوريدات', phone: '01234567898', email: 'info@ittihad-supplies.com', address: 'المنصورة - الدقهلية', balance: 0 },
    ]);
    logger.log('Suppliers seeded');

    // Raw materials data is embedded in the products table (type='RAW')
    // The raw_materials table has been consolidated into products
    logger.log('Raw materials embedded in products');

    await insertIgnore(queryRunner, 'machines', [
      { id: 1, name: 'Injection Molding Machine 200T', serial_number: 'IM-200-001', purchase_date: '2024-01-15', status: 'ACTIVE', last_maintenance: '2026-05-01', next_maintenance: '2026-07-01', maintenance_interval_days: 60, total_hours: 4500, power_consumption: 75, price: 450000, useful_life_years: 10, notes: 'ماكينة حقن 200 طن' },
      { id: 2, name: 'Blow Molding Machine 100T', serial_number: 'BM-100-001', purchase_date: '2024-03-20', status: 'ACTIVE', last_maintenance: '2026-04-15', next_maintenance: '2026-06-15', maintenance_interval_days: 60, total_hours: 3200, power_consumption: 55, price: 320000, useful_life_years: 8, notes: 'ماكينة نفخ 100 طن' },
      { id: 3, name: 'Extrusion Line', serial_number: 'EL-001', purchase_date: '2024-06-01', status: 'ACTIVE', last_maintenance: '2026-05-20', next_maintenance: '2026-08-20', maintenance_interval_days: 90, total_hours: 2800, power_consumption: 90, price: 550000, useful_life_years: 12, notes: 'خط بثق' },
    ]);
    logger.log('Machines seeded');

    await insertIgnore(queryRunner, 'molds', [
      { id: 1, name: 'Chair Mold', product_id: 6, product_weight: 1.800, cavities: 2, status: 'GOOD', current_shots: 15000, price: 85000, max_shots: 500000, total_production_cycles: 7500, life_cycle_status: 'good', notes: 'قالب كرسي 501' },
      { id: 2, name: 'Table Top Mold', product_id: 7, product_weight: 2.500, cavities: 1, status: 'GOOD', current_shots: 8000, price: 95000, max_shots: 400000, total_production_cycles: 8000, life_cycle_status: 'good', notes: 'قالب سطح طاولة 60×60' },
      { id: 3, name: 'Storage Box Mold', product_id: 8, product_weight: 1.200, cavities: 2, status: 'GOOD', current_shots: 22000, price: 65000, max_shots: 600000, total_production_cycles: 11000, life_cycle_status: 'good', notes: 'قالب صندوق تخزين 40 لتر' },
      { id: 4, name: 'Bucket Mold', product_id: 9, product_weight: 0.800, cavities: 4, status: 'GOOD', current_shots: 35000, price: 55000, max_shots: 700000, total_production_cycles: 8750, life_cycle_status: 'good', notes: 'قالب دلو 20 لتر' },
      { id: 5, name: 'Bottle Cap Mold', product_id: 11, product_weight: 0.003, cavities: 16, status: 'GOOD', current_shots: 120000, price: 45000, max_shots: 1000000, total_production_cycles: 7500, life_cycle_status: 'good', notes: 'قالب غطاء قنينة' },
      { id: 6, name: 'Crate Mold', product_id: 12, product_weight: 1.500, cavities: 1, status: 'GOOD', current_shots: 5000, price: 78000, max_shots: 350000, total_production_cycles: 5000, life_cycle_status: 'good', notes: 'قالب صندوق 40×30' },
    ]);
    logger.log('Molds seeded');

    await insertIgnore(queryRunner, 'boms', [
      { id: 1, name: 'BOM - Plastic Chair 501', product_id: 6, description: 'قائمة مكونات الكرسي 501', carton_product_id: 6, box_product_id: 6, pcs_per_carton: 4, pcs_per_box: 1 },
      { id: 2, name: 'BOM - Table Top 60x60', product_id: 7, description: 'قائمة مكونات سطح الطاولة', carton_product_id: 7, box_product_id: 7, pcs_per_carton: 2, pcs_per_box: 1 },
      { id: 3, name: 'BOM - Storage Box 40L', product_id: 8, description: 'قائمة مكونات صندوق التخزين', carton_product_id: 8, box_product_id: 8, pcs_per_carton: 6, pcs_per_box: 1 },
    ]);
    await insertIgnore(queryRunner, 'bom_items', [
      { id: 1, bom_id: 1, product_id: 1, quantity: 1.800 },
      { id: 2, bom_id: 1, product_id: 3, quantity: 0.050 },
      { id: 3, bom_id: 2, product_id: 2, quantity: 2.500 },
      { id: 4, bom_id: 2, product_id: 4, quantity: 0.080 },
      { id: 5, bom_id: 3, product_id: 5, quantity: 1.200 },
      { id: 6, bom_id: 3, product_id: 3, quantity: 0.040 },
    ]);
    logger.log('BOMs seeded');

    await insertIgnore(queryRunner, 'purchase_orders', [
      { id: 1, supplier_id: 1, invoice_number: 'PO-2026-001', total_amount: 17000, status: 'COMPLETED', notes: 'طلب HDPE', order_date: '2026-05-01', currency_code: 'USD', exchange_rate: 30.5, total_amount_foreign: 557.38, freight_cost: 500, customs_percent: 5, commission_percent: 2, total_landed_cost: 18500, total_weight_kg: 2000 },
      { id: 2, supplier_id: 3, invoice_number: 'PO-2026-002', total_amount: 14000, status: 'COMPLETED', notes: 'طلب PP', order_date: '2026-05-10', currency_code: 'EGP', exchange_rate: 1, total_amount_foreign: 14000, freight_cost: 0, customs_percent: 0, commission_percent: 0, total_landed_cost: 14000, total_weight_kg: 2000 },
      { id: 3, supplier_id: 2, invoice_number: 'PO-2026-003', total_amount: 9000, status: 'PENDING', notes: 'طلب LDPE', order_date: '2026-05-20', currency_code: 'USD', exchange_rate: 30.5, total_amount_foreign: 295.08, freight_cost: 300, customs_percent: 5, commission_percent: 1.5, total_landed_cost: 10000, total_weight_kg: 1000 },
    ]);
    await insertIgnore(queryRunner, 'purchase_order_items', [
      { id: 1, order_id: 1, product_id: 1, quantity: 2000, price: 8.50, total: 17000 },
      { id: 2, order_id: 2, product_id: 2, quantity: 2000, price: 7.00, total: 14000 },
      { id: 3, order_id: 3, product_id: 5, quantity: 1000, price: 9.00, total: 9000 },
    ]);
    logger.log('Purchase orders seeded');

    await insertIgnore(queryRunner, 'sales_orders', [
      { id: 1, customer_id: 1, total_amount: 13500, status: 'COMPLETED', notes: 'طلب كراسي', order_date: '2026-05-05' },
      { id: 2, customer_id: 2, total_amount: 13000, status: 'COMPLETED', notes: 'طلب طاولات وصناديق', order_date: '2026-05-10' },
      { id: 3, customer_id: 3, total_amount: 3500, status: 'PENDING', notes: 'طلب قنينات ماء', order_date: '2026-05-20' },
      { id: 4, customer_id: 4, total_amount: 4400, status: 'PENDING', notes: 'طلب دلاء', order_date: '2026-05-22' },
      { id: 5, customer_id: 5, total_amount: 22800, status: 'COMPLETED', notes: 'طلب متنوع', order_date: '2026-05-15' },
    ]);
    await insertIgnore(queryRunner, 'sales_order_items', [
      { id: 1, order_id: 1, product_id: 6, quantity: 300, price: 45.00, total: 13500 },
      { id: 2, order_id: 2, product_id: 7, quantity: 100, price: 65.00, total: 6500 },
      { id: 3, order_id: 2, product_id: 8, quantity: 200, price: 32.50, total: 6500 },
      { id: 4, order_id: 3, product_id: 10, quantity: 1000, price: 3.50, total: 3500 },
      { id: 5, order_id: 4, product_id: 9, quantity: 200, price: 22.00, total: 4400 },
      { id: 6, order_id: 5, product_id: 12, quantity: 300, price: 38.00, total: 11400 },
      { id: 7, order_id: 5, product_id: 6, quantity: 200, price: 45.00, total: 9000 },
      { id: 8, order_id: 5, product_id: 11, quantity: 3000, price: 0.80, total: 2400 },
    ]);
    logger.log('Sales orders seeded');

    await insertIgnore(queryRunner, 'stock', [
      { product_id: 1, warehouse_id: 2, quantity: 1500 },
      { product_id: 2, warehouse_id: 2, quantity: 1800 },
      { product_id: 3, warehouse_id: 2, quantity: 400 },
      { product_id: 4, warehouse_id: 2, quantity: 350 },
      { product_id: 5, warehouse_id: 2, quantity: 800 },
      { product_id: 6, warehouse_id: 1, quantity: 200 },
      { product_id: 7, warehouse_id: 1, quantity: 80 },
      { product_id: 8, warehouse_id: 1, quantity: 150 },
      { product_id: 9, warehouse_id: 1, quantity: 300 },
      { product_id: 10, warehouse_id: 1, quantity: 2500 },
      { product_id: 11, warehouse_id: 1, quantity: 5000 },
      { product_id: 12, warehouse_id: 1, quantity: 100 },
    ]);
    logger.log('Stock seeded');

    await insertIgnore(queryRunner, 'stock_movements', [
      { id: 1, product_id: 1, warehouse_id: 2, type: 'IN', quantity: 2000, reference_type: 'purchase_order', reference_id: 1, notes: 'استلام HDPE', date: '2026-05-02' },
      { id: 2, product_id: 2, warehouse_id: 2, type: 'IN', quantity: 2000, reference_type: 'purchase_order', reference_id: 2, notes: 'استلام PP', date: '2026-05-11' },
      { id: 3, product_id: 5, warehouse_id: 2, type: 'IN', quantity: 1000, reference_type: 'purchase_order', reference_id: 3, notes: 'استلام LDPE', date: '2026-05-21' },
      { id: 4, product_id: 6, warehouse_id: 1, type: 'IN', quantity: 500, reference_type: 'production', reference_id: 1, notes: 'إنتاج كراسي', date: '2026-05-03' },
      { id: 5, product_id: 6, warehouse_id: 1, type: 'OUT', quantity: 300, reference_type: 'sales_order', reference_id: 1, notes: 'بيع كراسي للشركة الأمل', date: '2026-05-05' },
      { id: 6, product_id: 7, warehouse_id: 1, type: 'IN', quantity: 200, reference_type: 'production', reference_id: 2, notes: 'إنتاج طاولات', date: '2026-05-06' },
      { id: 7, product_id: 8, warehouse_id: 1, type: 'IN', quantity: 300, reference_type: 'production', reference_id: 3, notes: 'إنتاج صناديق', date: '2026-05-07' },
      { id: 8, product_id: 7, warehouse_id: 1, type: 'OUT', quantity: 100, reference_type: 'sales_order', reference_id: 2, notes: 'بيع طاولات', date: '2026-05-10' },
      { id: 9, product_id: 8, warehouse_id: 1, type: 'OUT', quantity: 200, reference_type: 'sales_order', reference_id: 2, notes: 'بيع صناديق', date: '2026-05-10' },
      { id: 10, product_id: 1, warehouse_id: 2, type: 'OUT', quantity: 500, reference_type: 'production', reference_id: 1, notes: 'صرف HDPE للإنتاج', date: '2026-05-03' },
      { id: 11, product_id: 2, warehouse_id: 2, type: 'OUT', quantity: 300, reference_type: 'production', reference_id: 2, notes: 'صرف PP للإنتاج', date: '2026-05-06' },
      { id: 12, product_id: 5, warehouse_id: 2, type: 'OUT', quantity: 200, reference_type: 'production', reference_id: 3, notes: 'صرف LDPE للإنتاج', date: '2026-05-07' },
      { id: 13, product_id: 9, warehouse_id: 1, type: 'IN', quantity: 500, reference_type: 'production', reference_id: 4, notes: 'إنتاج دلاء', date: '2026-05-12' },
      { id: 14, product_id: 10, warehouse_id: 1, type: 'IN', quantity: 3000, reference_type: 'production', reference_id: 5, notes: 'إنتاج قنينات', date: '2026-05-14' },
      { id: 15, product_id: 12, warehouse_id: 1, type: 'IN', quantity: 400, reference_type: 'production', reference_id: 6, notes: 'إنتاج صناديق كبيرة', date: '2026-05-16' },
    ]);
    logger.log('Stock movements seeded');

    await insertIgnore(queryRunner, 'daily_production', [
      { id: 1, machine_id: 1, mold_id: 1, product_id: 1, date: '2026-05-03', total_production_kg: 900, pieces_produced: 500, hours_worked: 8, start_time: '2026-05-03 07:00:00', end_time: '2026-05-03 15:00:00', overhead_cost: 0.05, notes: 'إنتاج كراسي - وردية صباحية', status: 'QC_PASS' },
      { id: 2, machine_id: 1, mold_id: 2, product_id: 2, date: '2026-05-06', total_production_kg: 500, pieces_produced: 200, hours_worked: 8, start_time: '2026-05-06 07:00:00', end_time: '2026-05-06 15:00:00', overhead_cost: 0.08, notes: 'إنتاج طاولات - وردية صباحية', status: 'QC_PASS' },
      { id: 3, machine_id: 3, mold_id: 3, product_id: 5, date: '2026-05-07', total_production_kg: 360, pieces_produced: 300, hours_worked: 8, start_time: '2026-05-07 07:00:00', end_time: '2026-05-07 15:00:00', overhead_cost: 0.04, notes: 'إنتاج صناديق تخزين', status: 'QC_PASS' },
      { id: 4, machine_id: 1, mold_id: 4, product_id: 1, date: '2026-05-12', total_production_kg: 400, pieces_produced: 500, hours_worked: 8, start_time: '2026-05-12 07:00:00', end_time: '2026-05-12 15:00:00', overhead_cost: 0.03, notes: 'إنتاج دلاء', status: 'QC_PASS' },
      { id: 5, machine_id: 2, mold_id: 5, product_id: 1, date: '2026-05-14', total_production_kg: 105, pieces_produced: 3000, hours_worked: 8, start_time: '2026-05-14 07:00:00', end_time: '2026-05-14 15:00:00', overhead_cost: 0.01, notes: 'إنتاج أغطية قنينات', status: 'QC_PASS' },
      { id: 6, machine_id: 1, mold_id: 6, product_id: 1, date: '2026-05-16', total_production_kg: 600, pieces_produced: 400, hours_worked: 8, start_time: '2026-05-16 07:00:00', end_time: '2026-05-16 15:00:00', overhead_cost: 0.06, notes: 'إنتاج صناديق 40×30', status: 'QC_PASS' },
      { id: 7, machine_id: 1, mold_id: 1, product_id: 1, date: '2026-05-17', total_production_kg: 450, pieces_produced: 250, hours_worked: 8, start_time: '2026-05-17 07:00:00', end_time: '2026-05-17 15:00:00', overhead_cost: 0.05, notes: 'إنتاج كراسي - وردية مسائية', status: 'QC_PASS' },
      { id: 8, machine_id: 3, mold_id: 3, product_id: 5, date: '2026-05-18', total_production_kg: 240, pieces_produced: 200, hours_worked: 8, start_time: '2026-05-18 07:00:00', end_time: '2026-05-18 15:00:00', overhead_cost: 0.04, notes: 'إنتاج صناديق تخزين إضافية', status: 'QC_PASS' },
      { id: 9, machine_id: 1, mold_id: 4, product_id: 1, date: '2026-05-19', total_production_kg: 320, pieces_produced: 400, hours_worked: 8, start_time: '2026-05-19 07:00:00', end_time: '2026-05-19 15:00:00', overhead_cost: 0.03, notes: 'إنتاج دلاء إضافية', status: 'PENDING' },
      { id: 10, machine_id: 2, mold_id: 5, product_id: 1, date: '2026-05-20', total_production_kg: 70, pieces_produced: 2000, hours_worked: 8, start_time: '2026-05-20 07:00:00', end_time: '2026-05-20 15:00:00', overhead_cost: 0.01, notes: 'إنتاج أغطية إضافية', status: 'PENDING' },
    ]);
    logger.log('Daily production seeded');

    await insertIgnore(queryRunner, 'production_schedules', [
      { id: 1, planned_date: '2026-06-01', shift: 'DAY', machine_id: 1, mold_id: 1, product_id: 6, target_quantity: 400, status: 'PENDING', notes: 'جدولة إنتاج كراسي' },
      { id: 2, planned_date: '2026-06-01', shift: 'NIGHT', machine_id: 1, mold_id: 4, product_id: 9, target_quantity: 500, status: 'PENDING', notes: 'جدولة إنتاج دلاء' },
      { id: 3, planned_date: '2026-06-02', shift: 'DAY', machine_id: 3, mold_id: 3, product_id: 8, target_quantity: 300, status: 'PENDING', notes: 'جدولة إنتاج صناديق تخزين' },
      { id: 4, planned_date: '2026-06-02', shift: 'DAY', machine_id: 2, mold_id: 5, product_id: 11, target_quantity: 5000, status: 'PENDING', notes: 'جدولة إنتاج أغطية' },
      { id: 5, planned_date: '2026-06-03', shift: 'DAY', machine_id: 1, mold_id: 2, product_id: 7, target_quantity: 150, status: 'PENDING', notes: 'جدولة إنتاج طاولات' },
    ]);
    logger.log('Production schedules seeded');

    await insertIgnore(queryRunner, 'fixed_costs', [
      { id: 1, month: '2026-05', category: 'ELECTRICITY', amount: 15000, notes: 'فاتورة كهرباء المصنع - مايو' },
      { id: 2, month: '2026-05', category: 'RENT', amount: 25000, notes: 'إيجار المصنع - مايو' },
      { id: 3, month: '2026-05', category: 'MAINTENANCE', amount: 5000, notes: 'صيانة دورية للماكينات - مايو' },
    ]);
    logger.log('Fixed costs seeded');

    await insertIgnore(queryRunner, 'accounts', [
      { id: 1, code: '101', name: 'Cash', type: 'ASSET', description: 'النقدية بالصندوق', balance: 50000 },
      { id: 2, code: '102', name: 'Bank', type: 'ASSET', description: 'البنك', balance: 200000 },
      { id: 3, code: '201', name: 'Accounts Payable', type: 'LIABILITY', description: 'حسابات دائنة', balance: 0 },
      { id: 4, code: '301', name: 'Sales Revenue', type: 'REVENUE', description: 'إيرادات المبيعات', balance: 0 },
      { id: 5, code: '401', name: 'Cost of Goods Sold', type: 'EXPENSE', description: 'تكلفة البضاعة المباعة', balance: 0 },
    ]);
    logger.log('Accounts seeded');

    await insertIgnore(queryRunner, 'journal_entries', [
      { id: 1, date: '2026-05-05', description: 'تسجيل مبيعات كراسي - شركة الأمل', reference: 'SO-2026-001', account_id: 1, debit: 13500, credit: 0 },
      { id: 2, date: '2026-05-05', description: 'تسجيل مبيعات كراسي - شركة الأمل', reference: 'SO-2026-001', account_id: 4, debit: 0, credit: 13500 },
      { id: 3, date: '2026-05-10', description: 'تسجيل مبيعات طاولات وصناديق', reference: 'SO-2026-002', account_id: 1, debit: 13000, credit: 0 },
      { id: 4, date: '2026-05-10', description: 'تسجيل مبيعات طاولات وصناديق', reference: 'SO-2026-002', account_id: 4, debit: 0, credit: 13000 },
      { id: 5, date: '2026-05-02', description: 'شراء HDPE من شركة الخليج', reference: 'PO-2026-001', account_id: 5, debit: 17000, credit: 0 },
    ]);
    logger.log('Journal entries seeded');

    await insertIgnore(queryRunner, 'attendance', [
      { id: 1, user_id: 1, date: '2026-05-20', status: 'PRESENT', check_in: '07:00', check_out: '15:00', notes: 'حضور عادي' },
      { id: 2, user_id: 1, date: '2026-05-21', status: 'PRESENT', check_in: '07:15', check_out: '15:00', notes: 'تأخير 15 دقيقة' },
      { id: 3, user_id: 1, date: '2026-05-22', status: 'ABSENT', notes: 'إجازة مرضية' },
    ]);
    logger.log('Attendance seeded');

    await insertIgnore(queryRunner, 'employee_profiles', [
      { id: 1, user_id: 1, base_salary: 5000, working_hours_per_day: 8, overtime_rate: 1.5, deduction_rate: 1.0 },
      { id: 2, user_id: 2, base_salary: 4500, working_hours_per_day: 8, overtime_rate: 1.5, deduction_rate: 1.0 },
    ]);
    logger.log('Employee profiles seeded');

    await insertIgnore(queryRunner, 'salary_payments', [
      { id: 1, user_id: 1, month: '2026-05', base_salary: 5000, attendance_days: 22, absent_days: 1, overtime_pay: 300, bonuses: 500, deductions: 200, net_salary: 5600, status: 'PAID', payment_date: '2026-05-31', notes: 'راتب شهر مايو' },
      { id: 2, user_id: 2, month: '2026-05', base_salary: 4500, attendance_days: 23, absent_days: 0, overtime_pay: 0, bonuses: 200, deductions: 0, net_salary: 4700, status: 'PAID', payment_date: '2026-05-31', notes: 'راتب شهر مايو' },
    ]);
    logger.log('Salary payments seeded');

    await insertIgnore(queryRunner, 'notifications', [
      { id: 1, title: 'تم إضافة طلب شراء جديد', message: 'تم إنشاء طلب شراء رقم PO-2026-003 لمورد LDPE', isRead: false, userId: 1, actionType: 'create_order', actionData: { orderId: 3 } },
      { id: 2, title: 'تنبيه مخزون منخفض', message: 'مخزون HDPE أقل من حد إعادة الطلب (500 كجم)', isRead: false, userId: 1, actionType: 'low_stock', actionData: { productId: 1, currentStock: 200 } },
      { id: 3, title: 'تم تسجيل إنتاج جديد', message: 'تم إنتاج 250 كرسي في الوردية المسائية', isRead: true, userId: 1, actionType: 'production_record', actionData: { productionId: 7 } },
    ]);
    logger.log('Notifications seeded');

    await insertIgnore(queryRunner, 'supplier_payments', [
      { id: 1, supplier_id: 1, amount: 17000, amount_foreign: 557.38, currency_code: 'USD', exchange_rate: 30.5, payment_date: '2026-05-15', notes: 'دفعة HDPE' },
      { id: 2, supplier_id: 3, amount: 14000, payment_date: '2026-05-20', notes: 'دفعة PP' },
    ]);
    logger.log('Supplier payments seeded');

    await insertIgnore(queryRunner, 'customer_payments', [
      { id: 1, customer_id: 1, amount: 13500, payment_date: '2026-05-15', notes: 'دفعة كراسي' },
      { id: 2, customer_id: 2, amount: 13000, payment_date: '2026-05-20', notes: 'دفعة طاولات وصناديق' },
      { id: 3, customer_id: 5, amount: 22800, payment_date: '2026-05-25', notes: 'دفعة طلب متنوع' },
    ]);
    logger.log('Customer payments seeded');

    await queryRunner.commitTransaction();
    logger.log('SEED DEMO DATA DONE');
    return { message: 'Demo data seeded successfully' };
  } catch (error) {
    logger.error('Seed demo data failed', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
