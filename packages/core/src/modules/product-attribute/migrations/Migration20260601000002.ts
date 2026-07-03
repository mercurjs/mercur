import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds the native-option mirror FK columns (SPEC-014):
 *   - `product_attribute.product_option_id` → mirror `ProductOption`
 *     (variant-axis multi_select attributes).
 *   - `product_attribute_value.product_option_value_id` → mirror
 *     `ProductOptionValue`.
 * Both nullable; non-axis attributes/values leave them NULL. Read-only
 * mirror links resolve through these FKs. Safe to re-run.
 */
export class Migration20260601000002 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_attribute"
        ADD COLUMN IF NOT EXISTS "product_option_id" text NULL;
    `)
    this.addSql(`
      ALTER TABLE "product_attribute_value"
        ADD COLUMN IF NOT EXISTS "product_option_value_id" text NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "product_attribute_value" DROP COLUMN IF EXISTS "product_option_value_id";`,
    )
    this.addSql(
      `ALTER TABLE "product_attribute" DROP COLUMN IF EXISTS "product_option_id";`,
    )
  }
}
