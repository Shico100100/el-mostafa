import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePeachtreeSyncReviewAndLog1786000000000
  implements MigrationInterface
{
  name = 'CreatePeachtreeSyncReviewAndLog1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "peachtree_sync_review" (
        "id" SERIAL NOT NULL,
        "entity" character varying NOT NULL,
        "record_key" character varying NOT NULL,
        "change_type" character varying NOT NULL,
        "db_record_id" integer,
        "old_values" jsonb,
        "new_values" jsonb,
        "status" character varying NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "decided_at" TIMESTAMP,
        CONSTRAINT "PK_peachtree_sync_review" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "peachtree_sync_log" (
        "id" SERIAL NOT NULL,
        "run_id" character varying NOT NULL,
        "triggered_by" character varying NOT NULL,
        "entity" character varying NOT NULL,
        "action" character varying NOT NULL,
        "record_key" character varying NOT NULL,
        "changes" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_peachtree_sync_log" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_review_status" ON "peachtree_sync_review" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_peachtree_sync_log_run" ON "peachtree_sync_log" ("run_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "peachtree_sync_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "peachtree_sync_review"`);
  }
}