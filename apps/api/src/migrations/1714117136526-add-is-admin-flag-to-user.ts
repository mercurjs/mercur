import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsAdminFlagToUser1714117136526 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		queryRunner.query(`
        ALTER TABLE "user" ADD COLUMN "is_admin" BOOLEAN DEFAULT FALSE;
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		queryRunner.query(`
        ALTER TABLE "user" DROP COLUMN "is_admin";
        `);
	}
}
