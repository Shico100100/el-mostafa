import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateInventory1740960000007 implements MigrationInterface {
  name = 'ConsolidateInventory1740960000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new columns to products table
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "reorder_point" numeric(10,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "reorder_quantity" numeric(10,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "avg_consumption_rate" numeric(10,4) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "last_purchase_price" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "last_purchase_date" date`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "weight_per_piece" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "preferred_supplier_id" integer`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "notes" text`);

    // 2. Drop FK constraints referencing raw_materials and accessories
    await queryRunner.query(`ALTER TABLE "supplier_materials" DROP CONSTRAINT "FK_62917f0c1edec18377cdf9b36bb"`);
    await queryRunner.query(`ALTER TABLE "raw_material_consumptions" DROP CONSTRAINT "FK_6150072aa38e4655cf507d7bdad"`);
    await queryRunner.query(`ALTER TABLE "daily_production" DROP CONSTRAINT "FK_c51e52915c023975ec660787417"`);
    await queryRunner.query(`ALTER TABLE "batch_components" DROP CONSTRAINT "fk_batch_components_raw_material"`);
    await queryRunner.query(`ALTER TABLE "batch_components" DROP CONSTRAINT "fk_batch_components_accessory"`);

    // 3. Rename columns in referencing tables
    await queryRunner.query(`ALTER TABLE "supplier_materials" RENAME COLUMN "raw_material_id" TO "product_id"`);
    await queryRunner.query(`ALTER TABLE "raw_material_consumptions" RENAME COLUMN "raw_material_id" TO "product_id"`);
    await queryRunner.query(`ALTER TABLE "daily_production" RENAME COLUMN "raw_material_id" TO "product_id"`);

    // 4. Batch components had two nullable columns (raw_material_id + accessory_id) - merge into one non-nullable product_id
    // First update existing rows: if raw_material_id is set, use it; otherwise use accessory_id
    await queryRunner.query(`UPDATE "batch_components" SET "raw_material_id" = "accessory_id" WHERE "raw_material_id" IS NULL AND "accessory_id" IS NOT NULL`);
    // Drop accessory_id column after merge
    await queryRunner.query(`ALTER TABLE "batch_components" DROP COLUMN "accessory_id"`);
    await queryRunner.query(`ALTER TABLE "batch_components" RENAME COLUMN "raw_material_id" TO "product_id"`);
    await queryRunner.query(`ALTER TABLE "batch_components" ALTER COLUMN "product_id" SET NOT NULL`);

    // 5. Add new FK constraints
    await queryRunner.query(`ALTER TABLE "supplier_materials" ADD CONSTRAINT "FK_supplier_materials_product" FOREIGN KEY ("product_id") REFERENCES "products"("id")`);
    await queryRunner.query(`ALTER TABLE "raw_material_consumptions" ADD CONSTRAINT "FK_raw_material_consumptions_product" FOREIGN KEY ("product_id") REFERENCES "products"("id")`);
    await queryRunner.query(`ALTER TABLE "daily_production" ADD CONSTRAINT "FK_daily_production_product" FOREIGN KEY ("product_id") REFERENCES "products"("id")`);
    await queryRunner.query(`ALTER TABLE "batch_components" ADD CONSTRAINT "FK_batch_components_product" FOREIGN KEY ("product_id") REFERENCES "products"("id")`);

    // 6. Drop old tables
    await queryRunner.query(`DROP TABLE "accessories" CASCADE`);
    await queryRunner.query(`DROP TABLE "raw_materials" CASCADE`);

    // 7. Add FK for preferred_supplier_id
    await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_products_preferred_supplier" FOREIGN KEY ("preferred_supplier_id") REFERENCES "suppliers"("id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a complex migration; down is provided for completeness but data loss is expected
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_preferred_supplier"`);
    await queryRunner.query(`ALTER TABLE "batch_components" DROP CONSTRAINT "FK_batch_components_product"`);
    await queryRunner.query(`ALTER TABLE "daily_production" DROP CONSTRAINT "FK_daily_production_product"`);
    await queryRunner.query(`ALTER TABLE "raw_material_consumptions" DROP CONSTRAINT "FK_raw_material_consumptions_product"`);
    await queryRunner.query(`ALTER TABLE "supplier_materials" DROP CONSTRAINT "FK_supplier_materials_product"`);

    await queryRunner.query(`ALTER TABLE "batch_components" RENAME COLUMN "product_id" TO "raw_material_id"`);
    await queryRunner.query(`ALTER TABLE "batch_components" ADD COLUMN "accessory_id" integer`);
    await queryRunner.query(`ALTER TABLE "batch_components" ALTER COLUMN "raw_material_id" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "daily_production" RENAME COLUMN "product_id" TO "raw_material_id"`);
    await queryRunner.query(`ALTER TABLE "raw_material_consumptions" RENAME COLUMN "product_id" TO "raw_material_id"`);
    await queryRunner.query(`ALTER TABLE "supplier_materials" RENAME COLUMN "product_id" TO "raw_material_id"`);

    await queryRunner.query(`ALTER TABLE "batch_components" ADD CONSTRAINT "fk_batch_components_raw_material" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id")`);
    await queryRunner.query(`ALTER TABLE "batch_components" ADD CONSTRAINT "fk_batch_components_accessory" FOREIGN KEY ("accessory_id") REFERENCES "accessories"("id")`);
    await queryRunner.query(`ALTER TABLE "daily_production" ADD CONSTRAINT "FK_c51e52915c023975ec660787417" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id")`);
    await queryRunner.query(`ALTER TABLE "raw_material_consumptions" ADD CONSTRAINT "FK_6150072aa38e4655cf507d7bdad" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id")`);
    await queryRunner.query(`ALTER TABLE "supplier_materials" ADD CONSTRAINT "FK_62917f0c1edec18377cdf9b36bb" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id")`);

    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "preferred_supplier_id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "weight_per_piece"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "last_purchase_date"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "last_purchase_price"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "avg_consumption_rate"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "reorder_quantity"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "reorder_point"`);
  }
}
