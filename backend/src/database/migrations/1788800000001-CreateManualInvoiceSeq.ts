import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateManualInvoiceSeq1788800000001 implements MigrationInterface {
  name = 'CreateManualInvoiceSeq1788800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "manual_invoice_seq" ("year" INT NOT NULL, "last_no" INT NOT NULL DEFAULT 0, CONSTRAINT "PK_manual_invoice_seq" PRIMARY KEY ("year"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "manual_invoice_seq"`);
  }
}
