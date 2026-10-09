import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountToSalesOrders1788700000000
  implements MigrationInterface
{
  name = 'AddDiscountToSalesOrders1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_orders') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='discount_type') THEN ALTER TABLE "sales_orders" ADD "discount_type" VARCHAR(20) DEFAULT 'none'; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_orders') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='discount_value') THEN ALTER TABLE "sales_orders" ADD "discount_value" DECIMAL(10,2) DEFAULT 0; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "discount_value"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "discount_type"`,
    );
  }
}
