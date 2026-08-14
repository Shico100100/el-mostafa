import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrphanedTables1785900000000 implements MigrationInterface {
  name = 'DropOrphanedTables1785900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "salary_payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_profiles" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "production_schedules" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "quotes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quote_items" CASCADE`);
  }

  public async down(): Promise<void> {
    // Tables are unrecoverable once dropped; nothing to restore.
  }
}
