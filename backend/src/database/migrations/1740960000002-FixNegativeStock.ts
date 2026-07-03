import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNegativeStock1740960000002 implements MigrationInterface {
  name = 'FixNegativeStock1740960000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE stock
      SET quantity = 0
      WHERE quantity < 0
    `);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(queryRunner: QueryRunner): Promise<void> {
    // No rollback — can't restore original negative values
  }
}
