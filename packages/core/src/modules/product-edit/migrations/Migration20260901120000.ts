import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260901120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_change_action"
        ADD COLUMN IF NOT EXISTS "reference" text NULL,
        ADD COLUMN IF NOT EXISTS "reference_id" text NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_prodchact_reference_reference_id"
        ON "product_change_action" ("reference", "reference_id")
        WHERE "deleted_at" IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_prodchact_reference_reference_id";
    `)
    this.addSql(`
      ALTER TABLE "product_change_action"
        DROP COLUMN IF EXISTS "reference",
        DROP COLUMN IF EXISTS "reference_id";
    `)
  }
}
