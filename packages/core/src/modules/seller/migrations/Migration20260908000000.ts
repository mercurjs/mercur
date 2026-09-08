import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260908000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "seller" ADD COLUMN IF NOT EXISTS "default_leadtime_to_ship" integer NOT NULL DEFAULT 2;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "seller" DROP COLUMN IF EXISTS "default_leadtime_to_ship";`,
    )
  }
}
