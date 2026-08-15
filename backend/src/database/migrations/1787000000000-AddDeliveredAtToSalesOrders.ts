import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveredAtToSalesOrders1787000000000
  implements MigrationInterface
{
  name = 'AddDeliveredAtToSalesOrders1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_orders" ADD "delivered_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sales_orders" DROP COLUMN "delivered_at"`,
    );
  }
}
