import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260422105949 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" drop column if exists "is_global";`);

    this.addSql(`alter table if exists "product_attribute" add column if not exists "product_id" text null;`);
    this.addSql(`alter table if exists "product_attribute" add constraint "product_attribute_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_product_id" ON "product_attribute" ("product_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_variant_attribute" drop constraint if exists "product_variant_attribute_pkey";`);

    this.addSql(`alter table if exists "product_variant_attribute" add constraint "product_variant_attribute_pkey" primary key ("product_id", "product_attribute_id");`);

    this.addSql(`drop index if exists "IDX_product_variant_sku_unique";`);
    this.addSql(`alter table if exists "product_variant" drop column if exists "sku", drop column if exists "allow_backorder";`);

    this.addSql(`alter table if exists "product_variant_attribute_value" drop constraint if exists "product_variant_attribute_value_pkey";`);

    this.addSql(`alter table if exists "product_variant_attribute_value" add constraint "product_variant_attribute_value_pkey" primary key ("product_variant_id", "product_attribute_value_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute" drop constraint if exists "product_attribute_product_id_foreign";`);

    this.addSql(`drop index if exists "IDX_product_attribute_product_id";`);
    this.addSql(`alter table if exists "product_attribute" drop column if exists "product_id";`);

    this.addSql(`alter table if exists "product_attribute" add column if not exists "is_global" boolean not null default true;`);

    this.addSql(`alter table if exists "product_variant_attribute" drop constraint if exists "product_variant_attribute_pkey";`);

    this.addSql(`alter table if exists "product_variant_attribute" add constraint "product_variant_attribute_pkey" primary key ("product_attribute_id", "product_id");`);

    this.addSql(`alter table if exists "product_variant" add column if not exists "sku" text null, add column if not exists "allow_backorder" boolean not null default false;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_sku_unique" ON "product_variant" ("sku") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_variant_attribute_value" drop constraint if exists "product_variant_attribute_value_pkey";`);

    this.addSql(`alter table if exists "product_variant_attribute_value" add constraint "product_variant_attribute_value_pkey" primary key ("product_attribute_value_id", "product_variant_id");`);
  }

}
