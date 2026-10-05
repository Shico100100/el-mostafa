import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePeachtreeReviewJob1788600000000
  implements MigrationInterface
{
  name = 'CreatePeachtreeReviewJob1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      [
        'CREATE TABLE IF NOT EXISTS "peachtree_review_job" (',
        '"id" SERIAL NOT NULL,',
        '"job_id" character varying NOT NULL,',
        '"action" character varying NOT NULL,',
        '"status" character varying NOT NULL,',
        '"started_at" TIMESTAMP NOT NULL,',
        '"completed_at" TIMESTAMP,',
        '"total" integer NOT NULL DEFAULT 0,',
        '"done" integer NOT NULL DEFAULT 0,',
        '"applied" integer NOT NULL DEFAULT 0,',
        '"skipped" integer NOT NULL DEFAULT 0,',
        '"failed" integer NOT NULL DEFAULT 0,',
        '"percent_complete" integer NOT NULL DEFAULT 0,',
        '"current_entity" character varying,',
        '"current_record_key" character varying,',
        '"errors" jsonb,',
        '"created_at" TIMESTAMP NOT NULL DEFAULT now(),',
        'CONSTRAINT "UQ_peachtree_review_job_job_id" UNIQUE ("job_id"),',
        'CONSTRAINT "PK_peachtree_review_job" PRIMARY KEY ("id")',
        ')',
      ].join('\n'),
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_peachtree_review_job_status" ON "peachtree_review_job" ("status")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "peachtree_review_job"');
  }
}
