import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDailyProduction1740960000006 implements MigrationInterface {
  name = 'FixDailyProduction1740960000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='daily_production') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_production' AND column_name='pieces_defective') THEN ALTER TABLE "daily_production" ADD COLUMN "pieces_defective" integer DEFAULT 0; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_production" DROP COLUMN IF EXISTS "pieces_defective"`,
    );
  }
}
