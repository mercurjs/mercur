import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261021000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_seller_id_created_at" ON "offer" ("seller_id", "created_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_product_id_seller_id_created_at" ON "offer" ("product_id", "seller_id", "created_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_seller_id_created_at";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_product_id_seller_id_created_at";`)
  }
}
