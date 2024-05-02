import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreIdAndIsAdminFlagToInvite1714119227979 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            ALTER TABLE invite
            ADD COLUMN store_id VARCHAR NULL
        `);

		await queryRunner.query(`
        ALTER TABLE invite
        ADD COLUMN is_admin bool DEFAULT FALSE
    `);

		await queryRunner.query(`
            CREATE INDEX "InviteStoreId" ON invite ("store_id")
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            DROP INDEX "InviteStoreId"
        `);

		await queryRunner.query(`
            ALTER TABLE invite
            DROP COLUMN store_id;
        `);

		await queryRunner.query(`
        ALTER TABLE invite
        DROP COLUMN is_admin;
    `);
	}
}
