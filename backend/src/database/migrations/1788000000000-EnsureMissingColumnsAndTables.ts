import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureMissingColumnsAndTables1788000000000 implements MigrationInterface {
  name = 'EnsureMissingColumnsAndTables1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. sales_orders.invoice_number — no prior migration
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "invoice_number" varchar;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // 2. purchase_orders.invoice_number — same issue
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "invoice_number" varchar;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // 3. products.reorder_point — should exist from migration 1740960000007 but ensure
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reorder_point" decimal(10,2) DEFAULT 0;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // 4. audit_logs.entity_type — should exist from migration 1740960000008 but ensure
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "entity_type" varchar;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // 5. peachtree_sync_review table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "peachtree_sync_review" (
        "id" serial PRIMARY KEY,
        "entity" varchar NOT NULL,
        "record_key" varchar NOT NULL,
        "change_type" varchar NOT NULL,
        "db_record_id" integer,
        "old_values" jsonb,
        "new_values" jsonb,
        "status" varchar NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "decided_at" TIMESTAMP
      );
    `);

    // 6. peachtree_sync_log table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "peachtree_sync_log" (
        "id" serial PRIMARY KEY,
        "run_id" varchar NOT NULL,
        "triggered_by" varchar,
        "entity" varchar NOT NULL,
        "action" varchar NOT NULL,
        "record_key" varchar,
        "changes" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Indexes for peachtree tables
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_review_status" ON "peachtree_sync_review" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_log_run" ON "peachtree_sync_log" ("run_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_peachtree_sync_log_run"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_peachtree_sync_review_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "peachtree_sync_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "peachtree_sync_review"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "entity_type"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "reorder_point"`);
    await queryRunner.query(`ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "invoice_number"`);
    await queryRunner.query(`ALTER TABLE "sales_orders" DROP COLUMN IF EXISTS "invoice_number"`);
  }
}
