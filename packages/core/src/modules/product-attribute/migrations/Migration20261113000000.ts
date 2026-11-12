import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261113000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_attribute"
        ADD COLUMN IF NOT EXISTS "is_internal" boolean NOT NULL DEFAULT false;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "product_attribute" DROP COLUMN IF EXISTS "is_internal";`,
    )
  }
}
