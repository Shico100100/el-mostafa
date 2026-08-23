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

    // 7. documents table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" SERIAL PRIMARY KEY,
        "filename" varchar NOT NULL,
        "originalName" varchar NOT NULL,
        "mimeType" varchar NOT NULL,
        "size" bigint NOT NULL,
        "entityType" varchar,
        "entityId" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 8. range_production_sessions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "range_production_sessions" (
        "id" SERIAL PRIMARY KEY,
        "machine_id" integer NOT NULL,
        "mold_id" integer NOT NULL,
        "product_id" integer,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "total_production_kg" decimal(10,2) NOT NULL,
        "mode" varchar NOT NULL DEFAULT 'distribute',
        "hours_worked" decimal(10,2) DEFAULT 8,
        "notes" text,
        "created_by" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 9. exchange_rates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exchange_rates" (
        "id" SERIAL PRIMARY KEY,
        "fromCurrency" varchar NOT NULL,
        "toCurrency" varchar NOT NULL,
        "rate" decimal(10,6) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_exchange_rates_pair" ON "exchange_rates" ("fromCurrency", "toCurrency")`);

    // 10. budgets table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budgets" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar,
        "description" varchar,
        "period" varchar,
        "status" varchar DEFAULT 'DRAFT',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 11. budget_lines table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budget_lines" (
        "id" SERIAL PRIMARY KEY,
        "budget_id" integer NOT NULL,
        "account_id" integer,
        "budgeted_amount" decimal(15,2) DEFAULT 0,
        "notes" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 12. fixed_assets table + enums
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "depreciationmethod_enum" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "assetstatus_enum" AS ENUM ('ACTIVE', 'DISPOSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fixed_assets" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "asset_code" varchar UNIQUE NOT NULL,
        "category" varchar,
        "purchase_date" date NOT NULL,
        "purchase_cost" decimal(15,2) NOT NULL,
        "salvage_value" decimal(15,2) DEFAULT 0,
        "useful_life_years" integer NOT NULL,
        "depreciation_method" "depreciationmethod_enum" DEFAULT 'STRAIGHT_LINE',
        "accumulated_depreciation" decimal(15,2) DEFAULT 0,
        "book_value" decimal(15,2) DEFAULT 0,
        "disposal_date" date,
        "disposal_amount" decimal(15,2),
        "status" "assetstatus_enum" DEFAULT 'ACTIVE',
        "notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 13. depreciation_entries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "depreciation_entries" (
        "id" SERIAL PRIMARY KEY,
        "asset_id" integer NOT NULL,
        "period" varchar(7) NOT NULL,
        "amount" decimal(15,2) NOT NULL,
        "accumulated_after" decimal(15,2) NOT NULL,
        "journal_entry_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 14. jobs table + enum
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "jobstatus_enum" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "jobs" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar,
        "code" varchar,
        "description" varchar,
        "customer_id" integer,
        "start_date" date,
        "end_date" date,
        "estimated_cost" decimal(15,2) DEFAULT 0,
        "actual_cost" decimal(15,2) DEFAULT 0,
        "estimated_revenue" decimal(15,2) DEFAULT 0,
        "status" "jobstatus_enum" DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 15. job_phases table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_phases" (
        "id" SERIAL PRIMARY KEY,
        "job_id" integer NOT NULL,
        "name" varchar,
        "code" varchar,
        "estimated_cost" decimal(15,2) DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 16. job_costs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_costs" (
        "id" SERIAL PRIMARY KEY,
        "job_id" integer NOT NULL,
        "phase_id" integer,
        "type" varchar NOT NULL,
        "amount" decimal(15,2) NOT NULL,
        "description" text,
        "date" date,
        "reference" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 17. period_closes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "period_closes" (
        "id" SERIAL PRIMARY KEY,
        "period" varchar(7) UNIQUE NOT NULL,
        "status" varchar NOT NULL DEFAULT 'OPEN',
        "closed_by" varchar,
        "closed_at" timestamp,
        "closing_entries" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 18. bank_accounts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bank_accounts" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL,
        "bank_name" varchar,
        "account_number" varchar,
        "routing_number" varchar,
        "gl_account_id" integer,
        "balance" decimal(15,2) DEFAULT 0,
        "is_active" boolean DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 19. bank_transactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bank_transactions" (
        "id" SERIAL PRIMARY KEY,
        "bank_account_id" integer NOT NULL,
        "date" date NOT NULL,
        "description" varchar NOT NULL,
        "debit" decimal(15,2) DEFAULT 0,
        "credit" decimal(15,2) DEFAULT 0,
        "reference" varchar,
        "check_number" varchar,
        "is_reconciled" boolean DEFAULT false,
        "journal_entry_id" integer,
        "reconciliation_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // 20. bank_reconciliations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bank_reconciliations" (
        "id" SERIAL PRIMARY KEY,
        "bank_account_id" integer NOT NULL,
        "statement_date" date NOT NULL,
        "statement_balance" decimal(15,2) NOT NULL,
        "reconciled_balance" decimal(15,2) DEFAULT 0,
        "difference" decimal(15,2) DEFAULT 0,
        "status" varchar NOT NULL DEFAULT 'PENDING',
        "reconciled_by" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Indexes for peachtree tables
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_review_status" ON "peachtree_sync_review" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_log_run" ON "peachtree_sync_log" ("run_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "bank_reconciliations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bank_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bank_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "period_closes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_costs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "job_phases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "jobs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "jobstatus_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "depreciation_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fixed_assets"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "assetstatus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "depreciationmethod_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budgets"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_exchange_rates_pair"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exchange_rates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "range_production_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
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
