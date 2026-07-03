import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260622000000 extends Migration {
  override async up(): Promise<void> {
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
