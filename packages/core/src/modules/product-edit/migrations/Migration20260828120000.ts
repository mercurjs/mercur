import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260828120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_change_product_id_status"
        ON "product_change" ("product_id", "status")
        WHERE "deleted_at" IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_product_change_product_id_status";
    `)
  }
}
