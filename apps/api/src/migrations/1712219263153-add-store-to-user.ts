import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreToUser1712219263153 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN "store_id" character varying NULL
        `);

		await queryRunner.query(`
            ALTER TABLE "user"
            ADD CONSTRAINT "FK_user_store_id" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE "user"
            DROP CONSTRAINT "FK_user_store_id"
        `);

		await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN "store_id"
        `);
	}
}
