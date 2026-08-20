import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFKIndexes1740960000001 implements MigrationInterface {
  name = 'AddFKIndexes1740960000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Products
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN CREATE INDEX IF NOT EXISTS "IDX_products_category_id" ON "products" ("category_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN CREATE INDEX IF NOT EXISTS "IDX_products_warehouse_id" ON "products" ("warehouse_id"); END IF; END $$;`,
    );

    // Stock movements
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_movements') THEN CREATE INDEX IF NOT EXISTS "IDX_stock_movements_product_id" ON "stock_movements" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_movements') THEN CREATE INDEX IF NOT EXISTS "IDX_stock_movements_warehouse_id" ON "stock_movements" ("warehouse_id"); END IF; END $$;`,
    );

    // Daily production
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_production') THEN CREATE INDEX IF NOT EXISTS "IDX_daily_production_machine_id" ON "daily_production" ("machine_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_production') THEN CREATE INDEX IF NOT EXISTS "IDX_daily_production_mold_id" ON "daily_production" ("mold_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_production') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_production' AND column_name='raw_material_id') THEN CREATE INDEX IF NOT EXISTS "IDX_daily_production_raw_material_id" ON "daily_production" ("raw_material_id"); END IF; END $$;`,
    );

    // BOMs
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='boms') THEN CREATE INDEX IF NOT EXISTS "IDX_boms_product_id" ON "boms" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='boms') THEN CREATE INDEX IF NOT EXISTS "IDX_boms_carton_product_id" ON "boms" ("carton_product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='boms') THEN CREATE INDEX IF NOT EXISTS "IDX_boms_box_product_id" ON "boms" ("box_product_id"); END IF; END $$;`,
    );

    // BOM items
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bom_items') THEN CREATE INDEX IF NOT EXISTS "IDX_bom_items_bom_id" ON "bom_items" ("bom_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bom_items') THEN CREATE INDEX IF NOT EXISTS "IDX_bom_items_product_id" ON "bom_items" ("product_id"); END IF; END $$;`,
    );

    // Sales orders & items
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_orders') THEN CREATE INDEX IF NOT EXISTS "IDX_sales_orders_customer_id" ON "sales_orders" ("customer_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_order_items') THEN CREATE INDEX IF NOT EXISTS "IDX_sales_order_items_order_id" ON "sales_order_items" ("order_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_order_items') THEN CREATE INDEX IF NOT EXISTS "IDX_sales_order_items_product_id" ON "sales_order_items" ("product_id"); END IF; END $$;`,
    );

    // Purchase orders & items
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_orders') THEN CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_supplier_id" ON "purchase_orders" ("supplier_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_order_items') THEN CREATE INDEX IF NOT EXISTS "IDX_purchase_order_items_order_id" ON "purchase_order_items" ("order_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_order_items') THEN CREATE INDEX IF NOT EXISTS "IDX_purchase_order_items_product_id" ON "purchase_order_items" ("product_id"); END IF; END $$;`,
    );

    // Quotes
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quotes') THEN CREATE INDEX IF NOT EXISTS "IDX_quotes_customer_id" ON "quotes" ("customer_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_items') THEN CREATE INDEX IF NOT EXISTS "IDX_quote_items_quote_id" ON "quote_items" ("quote_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_items') THEN CREATE INDEX IF NOT EXISTS "IDX_quote_items_product_id" ON "quote_items" ("product_id"); END IF; END $$;`,
    );

    // Customer payments
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='customer_payments') THEN CREATE INDEX IF NOT EXISTS "IDX_customer_payments_customer_id" ON "customer_payments" ("customer_id"); END IF; END $$;`,
    );

    // Sales returns
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_returns') THEN CREATE INDEX IF NOT EXISTS "IDX_sales_returns_customer_id" ON "sales_returns" ("customer_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_return_items') THEN CREATE INDEX IF NOT EXISTS "IDX_sales_return_items_return_id" ON "sales_return_items" ("return_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_return_items') THEN CREATE INDEX IF NOT EXISTS "IDX_sales_return_items_product_id" ON "sales_return_items" ("product_id"); END IF; END $$;`,
    );

    // Supplier payments
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_payments') THEN CREATE INDEX IF NOT EXISTS "IDX_supplier_payments_supplier_id" ON "supplier_payments" ("supplier_id"); END IF; END $$;`,
    );

    // Purchase returns
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_returns') THEN CREATE INDEX IF NOT EXISTS "IDX_purchase_returns_supplier_id" ON "purchase_returns" ("supplier_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_return_items') THEN CREATE INDEX IF NOT EXISTS "IDX_purchase_return_items_return_id" ON "purchase_return_items" ("return_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_return_items') THEN CREATE INDEX IF NOT EXISTS "IDX_purchase_return_items_product_id" ON "purchase_return_items" ("product_id"); END IF; END $$;`,
    );

    // Manufacturing
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='molds') THEN CREATE INDEX IF NOT EXISTS "IDX_molds_product_id" ON "molds" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mold_issues') THEN CREATE INDEX IF NOT EXISTS "IDX_mold_issues_mold_id" ON "mold_issues" ("mold_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='raw_materials') THEN CREATE INDEX IF NOT EXISTS "IDX_raw_materials_product_id" ON "raw_materials" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='accessories') THEN CREATE INDEX IF NOT EXISTS "IDX_accessories_product_id" ON "accessories" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='manufacturing_orders') THEN CREATE INDEX IF NOT EXISTS "IDX_manufacturing_orders_product_id" ON "manufacturing_orders" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='production_schedules') THEN CREATE INDEX IF NOT EXISTS "IDX_production_schedules_product_id" ON "production_schedules" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='production_schedules') THEN CREATE INDEX IF NOT EXISTS "IDX_production_schedules_mold_id" ON "production_schedules" ("mold_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='production_schedules') THEN CREATE INDEX IF NOT EXISTS "IDX_production_schedules_machine_id" ON "production_schedules" ("machine_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='production_batches') THEN CREATE INDEX IF NOT EXISTS "IDX_production_batches_product_id" ON "production_batches" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='qc_inspections') THEN CREATE INDEX IF NOT EXISTS "IDX_qc_inspections_product_id" ON "qc_inspections" ("product_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='qc_inspections') THEN CREATE INDEX IF NOT EXISTS "IDX_qc_inspections_production_id" ON "qc_inspections" ("production_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='machine_maintenance') THEN CREATE INDEX IF NOT EXISTS "IDX_machine_maintenance_machine_id" ON "machine_maintenance" ("machine_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assembly_orders') THEN CREATE INDEX IF NOT EXISTS "IDX_assembly_orders_bom_id" ON "assembly_orders" ("bom_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='production_record_history') THEN CREATE INDEX IF NOT EXISTS "IDX_production_record_history_production_id" ON "production_record_history" ("production_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_materials') THEN CREATE INDEX IF NOT EXISTS "IDX_supplier_materials_supplier_id" ON "supplier_materials" ("supplier_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_materials') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='supplier_materials' AND column_name='raw_material_id') THEN CREATE INDEX IF NOT EXISTS "IDX_supplier_materials_raw_material_id" ON "supplier_materials" ("raw_material_id"); END IF; END $$;`,
    );

    // Accounting
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') THEN CREATE INDEX IF NOT EXISTS "IDX_journal_entries_account_id" ON "journal_entries" ("account_id"); END IF; END $$;`,
    );

    // Attendance
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attendance') THEN CREATE INDEX IF NOT EXISTS "IDX_attendance_user_id" ON "attendance" ("user_id"); END IF; END $$;`,
    );

    // Packing lists & containers
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='packing_lists') THEN CREATE INDEX IF NOT EXISTS "IDX_packing_lists_order_id" ON "packing_lists" ("order_id"); END IF; END $$;`,
    );

    // Fx rates
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fx_rates') THEN CREATE INDEX IF NOT EXISTS "IDX_fx_rates_currency_id" ON "fx_rates" ("currency_id"); END IF; END $$;`,
    );

    // Payroll
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='salary_payments') THEN CREATE INDEX IF NOT EXISTS "IDX_salary_payments_user_id" ON "salary_payments" ("user_id"); END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Products
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_warehouse_id"`);

    // Stock movements
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_stock_movements_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_stock_movements_warehouse_id"`,
    );

    // Daily production
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_daily_production_machine_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_daily_production_mold_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_daily_production_raw_material_id"`,
    );

    // BOMs
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boms_product_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_boms_carton_product_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_boms_box_product_id"`);

    // BOM items
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bom_items_bom_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bom_items_product_id"`);

    // Sales
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_orders_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_order_items_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_order_items_product_id"`,
    );

    // Purchases
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchase_orders_supplier_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchase_order_items_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchase_order_items_product_id"`,
    );

    // Quotes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quotes_customer_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_quote_items_quote_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quote_items_product_id"`,
    );

    // Customer payments
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_payments_customer_id"`,
    );

    // Sales returns
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_returns_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_return_items_return_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_return_items_product_id"`,
    );

    // Supplier payments
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_supplier_payments_supplier_id"`,
    );

    // Purchase returns
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchase_returns_supplier_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchase_return_items_return_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchase_return_items_product_id"`,
    );

    // Manufacturing
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_molds_product_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_mold_issues_mold_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_raw_materials_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_accessories_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_manufacturing_orders_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_schedules_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_schedules_mold_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_schedules_machine_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_batches_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_qc_inspections_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_qc_inspections_production_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_machine_maintenance_machine_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_assembly_orders_bom_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_record_history_production_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_supplier_materials_supplier_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_supplier_materials_raw_material_id"`,
    );

    // Accounting
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_journal_entries_account_id"`,
    );

    // Attendance
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_user_id"`);

    // Packing lists
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_packing_lists_order_id"`,
    );

    // Fx rates
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fx_rates_currency_id"`);

    // Payroll
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_salary_payments_user_id"`,
    );
  }
}
