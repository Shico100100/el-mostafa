import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJournalReversalAuditChanges1785600000000
  implements MigrationInterface
{
  name = 'AddJournalReversalAuditChanges1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journal_entries' AND column_name='reversal_of') THEN ALTER TABLE "journal_entries" ADD COLUMN "reversal_of" bigint; END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='IDX_journal_entries_reversal_of') THEN CREATE INDEX "IDX_journal_entries_reversal_of" ON "journal_entries" ("reversal_of"); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='user_id' AND is_nullable='NO') THEN ALTER TABLE "audit_logs" ALTER COLUMN "user_id" DROP NOT NULL; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_journal_entries_reversal_of"`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_entries" DROP COLUMN IF EXISTS "reversal_of"`,
    );
  }
}
