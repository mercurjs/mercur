import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreIdToOrderColumn1712224157863 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		const query = `
                ALTER TABLE public."order" ADD COLUMN IF NOT EXISTS "store_id" text; 
                ALTER TABLE public."order" ADD COLUMN IF NOT EXISTS "order_parent_id" text;
                ALTER TABLE public."order" ADD CONSTRAINT "FK_8a96dde86e3cad9d2fcc6cb171f87" FOREIGN KEY ("order_parent_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            `;
		await queryRunner.query(query);

		await queryRunner.query(`CREATE INDEX "OrderStoreId" ON "order" ("store_id") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		const query = `
                ALTER TABLE public."order" DROP COLUMN "store_id";
                ALTER TABLE public."order" DROP COLUMN "order_parent_id";
                ALTER TABLE public."order" DROP FOREIGN KEY "FK_8a96dde86e3cad9d2fcc6cb171f87cb2"; 
            `;
		await queryRunner.query(query);

		await queryRunner.query(`DROP INDEX "public"."OrderStoreId"`);
	}
}
