import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNegativeStock1740960000002 implements MigrationInterface {
  name = 'FixNegativeStock1740960000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock') THEN UPDATE stock SET quantity = 0 WHERE quantity < 0; END IF; END $$;`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback — can't restore original negative values
  }
}
