import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositeIndexes1747000000000 implements MigrationInterface {
  name = 'AddCompositeIndexes1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_production') THEN CREATE INDEX IF NOT EXISTS "IDX_daily_production_machine_date" ON "daily_production" ("machine_id", "date" DESC); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock') THEN CREATE INDEX IF NOT EXISTS "IDX_stock_product_warehouse" ON "stock" ("product_id", "warehouse_id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_movements') THEN CREATE INDEX IF NOT EXISTS "IDX_stock_movements_product_date" ON "stock_movements" ("product_id", "date" DESC); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_orders') THEN CREATE INDEX IF NOT EXISTS "IDX_sales_orders_customer_date" ON "sales_orders" ("customer_id", "order_date" DESC); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_orders') THEN CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_supplier_date" ON "purchase_orders" ("supplier_id", "order_date" DESC); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') THEN CREATE INDEX IF NOT EXISTS "IDX_journal_entries_account_date" ON "journal_entries" ("account_id", "date" DESC); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read" ON "notifications" ("userId", "isRead"); END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_daily_production_machine_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_stock_product_warehouse"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_stock_movements_product_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_sales_orders_customer_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchase_orders_supplier_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_journal_entries_account_date"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notifications_user_read"`,
    );
  }
}
