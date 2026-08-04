import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260804000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "manage_inventory" boolean NOT NULL DEFAULT true;`,
    )
    this.addSql(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "allow_backorder" boolean NOT NULL DEFAULT false;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`ALTER TABLE "offer" DROP COLUMN IF EXISTS "manage_inventory";`)
    this.addSql(`ALTER TABLE "offer" DROP COLUMN IF EXISTS "allow_backorder";`)
  }
}
