import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260526000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_price_set_id";`)
    this.addSql(
      `ALTER TABLE "offer" DROP COLUMN IF EXISTS "price_set_id";`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "offer" ADD COLUMN IF NOT EXISTS "price_set_id" text NOT NULL DEFAULT '';`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_price_set_id" ON "offer" ("price_set_id") WHERE deleted_at IS NULL;`,
    )
  }
}
