import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixManufacturingOrders1740960000004 implements MigrationInterface {
  name = 'FixManufacturingOrders1740960000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "manufacturing_orders" ("id" SERIAL NOT NULL, "sales_order_id" integer NOT NULL, "sales_order_item_id" integer, "product_id" integer NOT NULL, "quantity_required" numeric(12,2) NOT NULL, "quantity_produced" numeric(12,2) NOT NULL DEFAULT '0', "status" character varying NOT NULL DEFAULT 'PENDING', "priority" character varying NOT NULL DEFAULT 'MEDIUM', "due_date" date, "notes" character varying, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_manufacturing_orders" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_manufacturing_orders_product') THEN ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "FK_manufacturing_orders_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "manufacturing_orders" DROP CONSTRAINT "FK_manufacturing_orders_product"`);
    await queryRunner.query(`DROP TABLE "manufacturing_orders"`);
  }
}
