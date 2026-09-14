import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260908000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "leadtime_to_ship" integer NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "offer" DROP COLUMN IF EXISTS "leadtime_to_ship";`)
  }
}
