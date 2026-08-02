import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositeIndexes1747000000000 implements MigrationInterface {
  name = 'AddCompositeIndexes1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_production_machine_date" ON "daily_production" ("machine_id", "date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_product_warehouse" ON "stock" ("product_id", "warehouse_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_movements_product_date" ON "stock_movements" ("product_id", "date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sales_orders_customer_date" ON "sales_orders" ("customer_id", "order_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_supplier_date" ON "purchase_orders" ("supplier_id", "order_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_journal_entries_account_date" ON "journal_entries" ("account_id", "date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read" ON "notifications" ("userId", "isRead")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_daily_production_machine_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_product_warehouse"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_movements_product_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sales_orders_customer_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_orders_supplier_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_journal_entries_account_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);
  }
}
