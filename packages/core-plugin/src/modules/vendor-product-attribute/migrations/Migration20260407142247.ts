import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260407142247 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "vendor_product_attribute" ("id" text not null, "name" text not null, "value" text not null, "ui_component" text check ("ui_component" in ('select', 'multivalue', 'unit', 'toggle', 'text_area', 'color_picker')) not null default 'text_area', "extends_attribute_id" text null, "rank" integer not null default 0, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_product_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_product_attribute_deleted_at" ON "vendor_product_attribute" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_product_attribute_name" ON "vendor_product_attribute" ("name") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vendor_product_attribute" cascade;`);
  }

}
