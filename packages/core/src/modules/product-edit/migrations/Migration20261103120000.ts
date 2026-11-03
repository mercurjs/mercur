import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261103120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_change_created_by"
        ON "product_change" ("created_by")
        WHERE "deleted_at" IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_product_change_created_by";
    `)
  }
}
