import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260622000000 extends Migration {
  override async up(): Promise<void> {
    // Module migrations are schema-isolated and run in no guaranteed
    // cross-module order, so a variant→product backfill can't live here
    // (it would reference the product module's `product_variant` table).
    // New offers always set `product_id` in `createOffersWorkflow`.
    this.addSql(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "product_id" text NOT NULL DEFAULT '';`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_product_id" ON "offer" ("product_id") WHERE deleted_at IS NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_product_id";`)
    this.addSql(
      `ALTER TABLE "offer" DROP COLUMN IF EXISTS "product_id";`,
    )
  }
}
