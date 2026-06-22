import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260520104835 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "offer" ("id" text not null, "seller_id" text not null, "variant_id" text not null, "shipping_profile_id" text not null, "price_set_id" text not null, "sku" text not null, "ean" text null, "upc" text null, "created_by" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "offer_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_offer_seller_sku_unique" ON "offer" ("seller_id", "sku") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_variant_id" ON "offer" ("variant_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_seller_id" ON "offer" ("seller_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_shipping_profile_id" ON "offer" ("shipping_profile_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_price_set_id" ON "offer" ("price_set_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_ean" ON "offer" ("ean") WHERE deleted_at IS NULL AND ean IS NOT NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_upc" ON "offer" ("upc") WHERE deleted_at IS NULL AND upc IS NOT NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_deleted_at" ON "offer" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "offer" cascade;`)
  }
}
