import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDailyProduction1740960000006 implements MigrationInterface {
  name = 'FixDailyProduction1740960000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_production" ADD COLUMN "pieces_defective" integer DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_production" DROP COLUMN "pieces_defective"`,
    );
  }
}
