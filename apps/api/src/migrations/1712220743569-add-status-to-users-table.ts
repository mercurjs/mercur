import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToUsersTable1712220743569 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TYPE "userstatus" AS ENUM ('pending', 'active', 'rejected');
    `);

		await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "status" "userstatus" DEFAULT 'pending' NOT NULL;
    `);

		await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "role" SET DEFAULT 'admin';
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "status";
    `);

		await queryRunner.query(`
      DROP TYPE "userstatus";
    `);

		await queryRunner.query(`
      ALTER TABLE "user"
      ALTER COLUMN "role" SET DEFAULT 'member';
    `);
	}
}
