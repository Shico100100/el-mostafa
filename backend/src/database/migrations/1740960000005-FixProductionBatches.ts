import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductionBatches1740960000005 implements MigrationInterface {
  name = 'FixProductionBatches1740960000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "production_batches" ("id" SERIAL NOT NULL, "batch_number" character varying NOT NULL, "product_id" integer NOT NULL, "production_date" date NOT NULL, "expiry_date" date, "quantity" numeric(12,2) NOT NULL, "unit" character varying NOT NULL DEFAULT 'piece', "status" character varying NOT NULL DEFAULT 'PENDING', "notes" text, "production_id" integer, "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_production_batches" PRIMARY KEY ("id"), CONSTRAINT "UQ_batch_number" UNIQUE ("batch_number"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "batch_components" ("id" SERIAL NOT NULL, "batch_id" integer NOT NULL, "raw_material_id" integer, "accessory_id" integer, "supplier_batch_number" character varying, "quantity_used" numeric(12,4) NOT NULL, "unit" character varying NOT NULL DEFAULT 'piece', "cost_per_unit" numeric(12,2) NOT NULL DEFAULT '0', "total_cost" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_batch_components" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_production_batches_product') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN ALTER TABLE "production_batches" ADD CONSTRAINT "FK_production_batches_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_batch_components_batch') THEN ALTER TABLE "batch_components" ADD CONSTRAINT "FK_batch_components_batch" FOREIGN KEY ("batch_id") REFERENCES "production_batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_batch_components_raw_material') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='raw_materials') THEN ALTER TABLE "batch_components" ADD CONSTRAINT "FK_batch_components_raw_material" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_batch_components_accessory') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='accessories') THEN ALTER TABLE "batch_components" ADD CONSTRAINT "FK_batch_components_accessory" FOREIGN KEY ("accessory_id") REFERENCES "accessories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "batch_components" DROP CONSTRAINT IF EXISTS "FK_batch_components_accessory"`,
    );
    await queryRunner.query(
      `ALTER TABLE "batch_components" DROP CONSTRAINT IF EXISTS "FK_batch_components_raw_material"`,
    );
    await queryRunner.query(
      `ALTER TABLE "batch_components" DROP CONSTRAINT IF EXISTS "FK_batch_components_batch"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_batches" DROP CONSTRAINT IF EXISTS "FK_production_batches_product"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "batch_components"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "production_batches"`);
  }
}
