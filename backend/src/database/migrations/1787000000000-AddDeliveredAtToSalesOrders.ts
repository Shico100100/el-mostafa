import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveredAtToSalesOrders1787000000000
  implements MigrationInterface
{
  name = 'AddDeliveredAtToSalesOrders1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_orders') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='delivered_at') THEN ALTER TABLE "sales_orders" ADD "delivered_at" TIMESTAMP WITH TIME ZONE; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN "delivered_at"`,
    );
  }
}
