import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderLinkToCustomerPayments1788700000001
  implements MigrationInterface
{
  name = 'AddOrderLinkToCustomerPayments1788700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='customer_payments') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_payments' AND column_name='order_id') THEN ALTER TABLE "customer_payments" ADD "order_id" INT; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='customer_payments') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customer_payments' AND column_name='method') THEN ALTER TABLE "customer_payments" ADD "method" VARCHAR(20); END IF; END $$;`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_customer_payments_order_id" ON "customer_payments" ("order_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_payments_order_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_payments" DROP COLUMN IF EXISTS "method"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_payments" DROP COLUMN IF EXISTS "order_id"`,
    );
  }
}
