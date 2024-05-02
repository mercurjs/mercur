import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreIdToOrderColumn1712224157863 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		const query = `
                ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "store_id" text; 
                ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "order_parent_id" text;
            `;
		await queryRunner.query(query);

		await queryRunner.query(`CREATE INDEX "OrderStoreId" ON "order" ("store_id") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		const query = `
                ALTER TABLE "order" DROP COLUMN "store_id";
                ALTER TABLE "order" DROP COLUMN "order_parent_id";
            `;
		await queryRunner.query(query);

		await queryRunner.query(`DROP INDEX IF EXISTS "OrderStoreId"`);
	}
}
