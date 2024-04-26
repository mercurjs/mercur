import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShippingOptionsToStoreAndProduct1712310298656 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE product_shipping_options (
                product_id character varying NOT NULL,
                shipping_option_id character varying NOT NULL,
                PRIMARY KEY (product_id, shipping_option_id),
                FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
                FOREIGN KEY (shipping_option_id) REFERENCES shipping_option(id) ON DELETE CASCADE
            )
        `);

		await queryRunner.query(`
            ALTER TABLE IF EXISTS shipping_option
            ADD COLUMN IF NOT EXISTS store_id character varying
        `);

		await queryRunner.query(`
            ALTER TABLE IF EXISTS shipping_option
            ADD CONSTRAINT FK_SHIPPING_OPTION_STORE_ID 
            FOREIGN KEY (store_id) 
            REFERENCES store(id) 
            ON DELETE CASCADE
        `);

		await queryRunner.query(`
            CREATE INDEX ShippingOptionStoreId 
            ON shipping_option(store_id)
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            DROP TABLE product_shipping_options
        `);

		await queryRunner.query(`
            DROP INDEX IF EXISTS ShippingOptionStoreId
        `);

		await queryRunner.query(`
            ALTER TABLE IF EXISTS shipping_option
            DROP CONSTRAINT IF EXISTS FK_SHIPPING_OPTION_STORE_ID
        `);

		await queryRunner.query(`
            ALTER TABLE IF EXISTS shipping_option
            DROP COLUMN IF EXISTS store_id
        `);
	}
}
