import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJournalEntryIndexes1748000000000 implements MigrationInterface {
  name = 'AddJournalEntryIndexes1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') THEN CREATE INDEX IF NOT EXISTS "IDX_journal_entries_date_id" ON "journal_entries" ("date" DESC, "id" DESC); END IF; END $$;`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='journal_entries') THEN CREATE INDEX IF NOT EXISTS "IDX_journal_entries_created_at" ON "journal_entries" ("created_at" DESC); END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_journal_entries_date_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_journal_entries_created_at"`,
    );
  }
}
