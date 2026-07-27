import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260710151923 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "search_product" ("id" text not null, "product_id" text not null, "title" text not null, "handle" text not null, "description" text null, "thumbnail" text null, "status" text not null, "collection_id" text null, "type_id" text null, "category_ids" jsonb not null default '[]', "tag_ids" jsonb not null default '[]', "seller_ids" jsonb not null default '[]', "variant_skus" jsonb not null default '[]', "attributes" jsonb not null default '{}', "search_text" text null, "min_amount" numeric null, "raw_min_amount" jsonb null, "max_amount" numeric null, "raw_max_amount" jsonb null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "search_product_pkey" primary key ("id"));`
    )

    this.addSql(
      `create table if not exists "search_product_price" ("id" text not null, "region_id" text not null, "currency_code" text not null, "min_amount" numeric not null, "raw_min_amount" jsonb not null, "max_amount" numeric not null, "raw_max_amount" jsonb not null, "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "search_product_price_pkey" primary key ("id"));`
    )

    // Generated full-text column over title, description and the flattened
    // search_text (offer SKUs), queried via websearch_to_tsquery.
    this.addSql(
      `alter table if exists "search_product" add column if not exists "search_tsv" tsvector generated always as (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("search_text", ''))) stored;`
    )

    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_search_product_product_id_unique" ON "search_product" ("product_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_status" ON "search_product" ("status") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_collection_id" ON "search_product" ("collection_id") WHERE deleted_at IS NULL AND collection_id IS NOT NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_type_id" ON "search_product" ("type_id") WHERE deleted_at IS NULL AND type_id IS NOT NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_search_tsv" ON "search_product" USING GIN ("search_tsv");`
    )
    // Default jsonb_ops GIN so jsonb_exists_any (element membership) can use the index.
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_category_ids" ON "search_product" USING GIN ("category_ids");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_tag_ids" ON "search_product" USING GIN ("tag_ids");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_seller_ids" ON "search_product" USING GIN ("seller_ids");`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_attributes" ON "search_product" USING GIN ("attributes");`
    )

    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_search_product_price_product_region_unique" ON "search_product_price" ("product_id", "region_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_search_product_price_region_min_amount" ON "search_product_price" ("region_id", "min_amount") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "search_product_price" cascade;`)
    this.addSql(`drop table if exists "search_product" cascade;`)
  }
}
