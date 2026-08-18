import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateInventory1740960000007 implements MigrationInterface {
  name = 'ConsolidateInventory1740960000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new columns to products table
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='reorder_point') THEN ALTER TABLE "products" ADD COLUMN "reorder_point" numeric(10,2) DEFAULT 0; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='reorder_quantity') THEN ALTER TABLE "products" ADD COLUMN "reorder_quantity" numeric(10,2) DEFAULT 0; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='avg_consumption_rate') THEN ALTER TABLE "products" ADD COLUMN "avg_consumption_rate" numeric(10,4) DEFAULT 0; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_purchase_price') THEN ALTER TABLE "products" ADD COLUMN "last_purchase_price" numeric(10,2); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='last_purchase_date') THEN ALTER TABLE "products" ADD COLUMN "last_purchase_date" date; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='weight_per_piece') THEN ALTER TABLE "products" ADD COLUMN "weight_per_piece" numeric(10,2); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='preferred_supplier_id') THEN ALTER TABLE "products" ADD COLUMN "preferred_supplier_id" integer; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='notes') THEN ALTER TABLE "products" ADD COLUMN "notes" text; END IF; END $$;`,
    );

    // 2. Drop FK constraints
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_materials') THEN ALTER TABLE "supplier_materials" DROP CONSTRAINT IF EXISTS "FK_62917f0c1edec18377cdf9b36bb"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='raw_material_consumptions') THEN ALTER TABLE "raw_material_consumptions" DROP CONSTRAINT IF EXISTS "FK_6150072aa38e4655cf507d7bdad"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_production') THEN ALTER TABLE "daily_production" DROP CONSTRAINT IF EXISTS "FK_c51e52915c023975ec660787417"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='batch_components') THEN ALTER TABLE "batch_components" DROP CONSTRAINT IF EXISTS "fk_batch_components_raw_material"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='batch_components') THEN ALTER TABLE "batch_components" DROP CONSTRAINT IF EXISTS "fk_batch_components_accessory"; END IF; END $$;`,
    );

    // 3. Rename columns - check if column exists first
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='supplier_materials' AND column_name='raw_material_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='supplier_materials' AND column_name='product_id') THEN ALTER TABLE "supplier_materials" RENAME COLUMN "raw_material_id" TO "product_id"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='raw_material_consumptions' AND column_name='raw_material_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='raw_material_consumptions' AND column_name='product_id') THEN ALTER TABLE "raw_material_consumptions" RENAME COLUMN "raw_material_id" TO "product_id"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_production' AND column_name='raw_material_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_production' AND column_name='product_id') THEN ALTER TABLE "daily_production" RENAME COLUMN "raw_material_id" TO "product_id"; END IF; END $$;`,
    );

    // 4. Merge batch_components columns
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='batch_components') THEN UPDATE "batch_components" SET "raw_material_id" = "accessory_id" WHERE "raw_material_id" IS NULL AND "accessory_id" IS NOT NULL; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batch_components' AND column_name='accessory_id') THEN ALTER TABLE "batch_components" DROP COLUMN "accessory_id"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batch_components' AND column_name='raw_material_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batch_components' AND column_name='product_id') THEN ALTER TABLE "batch_components" RENAME COLUMN "raw_material_id" TO "product_id"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='batch_components') THEN ALTER TABLE "batch_components" ALTER COLUMN "product_id" SET NOT NULL; END IF; END $$;`,
    );

    // 5. Add new FK constraints
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_materials') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_supplier_materials_product') THEN ALTER TABLE "supplier_materials" ADD CONSTRAINT "FK_supplier_materials_product" FOREIGN KEY ("product_id") REFERENCES "products"("id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='raw_material_consumptions') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_raw_material_consumptions_product') THEN ALTER TABLE "raw_material_consumptions" ADD CONSTRAINT "FK_raw_material_consumptions_product" FOREIGN KEY ("product_id") REFERENCES "products"("id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_production') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_daily_production_product') THEN ALTER TABLE "daily_production" ADD CONSTRAINT "FK_daily_production_product" FOREIGN KEY ("product_id") REFERENCES "products"("id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='batch_components') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_batch_components_product') THEN ALTER TABLE "batch_components" ADD CONSTRAINT "FK_batch_components_product" FOREIGN KEY ("product_id") REFERENCES "products"("id"); END IF; END $$;`,
    );

    // 6. Drop old tables
    await queryRunner.query(`DROP TABLE IF EXISTS "accessories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "raw_materials" CASCADE`);

    // 7. Add FK for preferred_supplier_id
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products') AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='suppliers') AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_products_preferred_supplier') THEN ALTER TABLE "products" ADD CONSTRAINT "FK_products_preferred_supplier" FOREIGN KEY ("preferred_supplier_id") REFERENCES "suppliers"("id"); END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_preferred_supplier"`,
    );
    await queryRunner.query(
      `ALTER TABLE "batch_components" DROP CONSTRAINT IF EXISTS "FK_batch_components_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_production" DROP CONSTRAINT IF EXISTS "FK_daily_production_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "raw_material_consumptions" DROP CONSTRAINT IF EXISTS "FK_raw_material_consumptions_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_materials" DROP CONSTRAINT IF EXISTS "FK_supplier_materials_product"`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batch_components' AND column_name='product_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batch_components' AND column_name='raw_material_id') THEN ALTER TABLE "batch_components" RENAME COLUMN "product_id" TO "raw_material_id"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='batch_components' AND column_name='accessory_id') THEN ALTER TABLE "batch_components" ADD COLUMN "accessory_id" integer; END IF; END $$;`,
    );
    await queryRunner.query(
      `ALTER TABLE "batch_components" ALTER COLUMN "raw_material_id" DROP NOT NULL`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_production' AND column_name='product_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_production' AND column_name='raw_material_id') THEN ALTER TABLE "daily_production" RENAME COLUMN "product_id" TO "raw_material_id"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='raw_material_consumptions' AND column_name='product_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='raw_material_consumptions' AND column_name='raw_material_id') THEN ALTER TABLE "raw_material_consumptions" RENAME COLUMN "product_id" TO "raw_material_id"; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='supplier_materials' AND column_name='product_id') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='supplier_materials' AND column_name='raw_material_id') THEN ALTER TABLE "supplier_materials" RENAME COLUMN "product_id" TO "raw_material_id"; END IF; END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_batch_components_raw_material') THEN ALTER TABLE "batch_components" ADD CONSTRAINT "fk_batch_components_raw_material" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_batch_components_accessory') THEN ALTER TABLE "batch_components" ADD CONSTRAINT "fk_batch_components_accessory" FOREIGN KEY ("accessory_id") REFERENCES "accessories"("id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_c51e52915c023975ec660787417') THEN ALTER TABLE "daily_production" ADD CONSTRAINT "FK_c51e52915c023975ec660787417" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_6150072aa38e4655cf507d7bdad') THEN ALTER TABLE "raw_material_consumptions" ADD CONSTRAINT "FK_6150072aa38e4655cf507d7bdad" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_62917f0c1edec18377cdf9b36bb') THEN ALTER TABLE "supplier_materials" ADD CONSTRAINT "FK_62917f0c1edec18377cdf9b36bb" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id"); END IF; END $$;`,
    );

    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "preferred_supplier_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "weight_per_piece"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "last_purchase_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "last_purchase_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "avg_consumption_rate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "reorder_quantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "reorder_point"`,
    );
  }
}
