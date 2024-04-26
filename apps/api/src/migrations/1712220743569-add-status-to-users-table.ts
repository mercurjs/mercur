import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToUsersTable1712220743569 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TYPE "userstatuses" AS ENUM ('pending', 'active', 'rejected');
    `);

		await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "status" "userstatuses" DEFAULT 'active' NOT NULL;
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "status";
    `);

		await queryRunner.query(`
      DROP TYPE "userstatuses";
    `);
	}
}
