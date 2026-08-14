import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCurrenciesFxRatesContainers1740960000003
  implements MigrationInterface
{
  name = 'FixCurrenciesFxRatesContainers1740960000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "currencies" ("id" SERIAL NOT NULL, "code" character varying(3) NOT NULL, "name" character varying NOT NULL, "symbol" character varying, "exchange_rate_to_egp" numeric(10,4) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_currencies" PRIMARY KEY ("id"), CONSTRAINT "UQ_currencies_code" UNIQUE ("code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "fx_rates" ("id" SERIAL NOT NULL, "currency_id" integer NOT NULL, "rate_to_egp" numeric(10,4) NOT NULL, "amount_paid" numeric(10,2), "notes" text, "rate_date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fx_rates" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "containers" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "length_cm" numeric(8,2) NOT NULL, "width_cm" numeric(8,2) NOT NULL, "height_cm" numeric(8,2) NOT NULL, "max_weight_kg" numeric(10,2) NOT NULL, "max_cbm" numeric(10,3) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_containers" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_fx_rates_currency') THEN ALTER TABLE "fx_rates" ADD CONSTRAINT "FK_fx_rates_currency" FOREIGN KEY ("currency_id") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fx_rates" DROP CONSTRAINT "FK_fx_rates_currency"`,
    );
    await queryRunner.query(`DROP TABLE "containers"`);
    await queryRunner.query(`DROP TABLE "fx_rates"`);
    await queryRunner.query(`DROP TABLE "currencies"`);
  }
}
