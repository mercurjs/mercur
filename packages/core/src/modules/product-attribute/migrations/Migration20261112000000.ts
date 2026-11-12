import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261112000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_attribute"
        ADD COLUMN IF NOT EXISTS "validation" jsonb NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "product_attribute" DROP COLUMN IF EXISTS "validation";`,
    )
  }
}
