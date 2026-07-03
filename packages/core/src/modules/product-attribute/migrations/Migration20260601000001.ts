import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds the `product_id` FK column to `product_attribute` (nullable —
 * non-null marks the attribute as product-scoped / inline-custom; NULL
 * = global). Safe for environments that already ran the base table
 * migration `Migration20260601000000`.
 */
export class Migration20260601000001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_attribute"
        ADD COLUMN IF NOT EXISTS "product_id" text NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_attribute_product_id"
        ON "product_attribute" ("product_id")
        WHERE "deleted_at" IS NULL AND "product_id" IS NOT NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(
      `DROP INDEX IF EXISTS "IDX_product_attribute_product_id";`,
    )
    this.addSql(
      `ALTER TABLE "product_attribute" DROP COLUMN IF EXISTS "product_id";`,
    )
  }
}
