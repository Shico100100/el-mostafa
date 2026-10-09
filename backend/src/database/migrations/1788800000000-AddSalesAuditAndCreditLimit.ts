import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesAuditAndCreditLimit1788800000000
  implements MigrationInterface
{
  name = 'AddSalesAuditAndCreditLimit1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='customers') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='credit_limit') THEN ALTER TABLE "customers" ADD "credit_limit" DECIMAL(12,2); END IF; END $$;`,
    );
    for (const col of [
      'created_by',
      'updated_by',
      'delivered_by',
      'cancelled_by',
    ]) {
      await queryRunner.query(
        `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='sales_orders') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='${col}') THEN ALTER TABLE "sales_orders" ADD "${col}" INT; END IF; END $$;`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers" DROP COLUMN IF EXISTS "credit_limit"`,
    );
    for (const col of [
      'created_by',
      'updated_by',
      'delivered_by',
      'cancelled_by',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "${col}"`,
      );
    }
  }
}
