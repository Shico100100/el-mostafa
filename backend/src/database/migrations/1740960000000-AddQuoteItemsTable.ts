import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteItemsTable1740960000000 implements MigrationInterface {
  name = 'AddQuoteItemsTable1740960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quotes" ("id" SERIAL NOT NULL, "customer_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_quotes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "quote_items" ("id" SERIAL NOT NULL, "quote_id" integer NOT NULL, "product_id" integer NOT NULL, "quantity" numeric(10,2) NOT NULL, "price" numeric(10,2) NOT NULL, "total" numeric(10,2) NOT NULL, CONSTRAINT "PK_quote_items" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_items" ADD CONSTRAINT "FK_quote_items_quote" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_items" ADD CONSTRAINT "FK_quote_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quote_items" DROP CONSTRAINT "FK_quote_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_items" DROP CONSTRAINT "FK_quote_items_quote"`,
    );
    await queryRunner.query(`DROP TABLE "quote_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quotes"`);
  }
}
