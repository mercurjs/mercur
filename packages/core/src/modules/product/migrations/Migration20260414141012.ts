import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260414141012 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_gtin_unique";`);
    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_asin_unique";`);
    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_isbn_unique";`);
    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_upc_unique";`);
    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_ean_unique";`);
    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_barcode_unique";`);
    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_sku_unique";`);
    this.addSql(`alter table if exists "product" drop constraint if exists "product_handle_unique";`);
    this.addSql(`alter table if exists "product_type" drop constraint if exists "type_value_unique";`);
    this.addSql(`alter table if exists "product_tag" drop constraint if exists "tag_value_unique";`);
    this.addSql(`alter table if exists "product_rejection_reason" drop constraint if exists "product_rejection_reason_code_unique";`);
    this.addSql(`alter table if exists "product_collection" drop constraint if exists "collection_handle_unique";`);
    this.addSql(`alter table if exists "product_category" drop constraint if exists "category_handle_unique";`);
    this.addSql(`alter table if exists "product_brand" drop constraint if exists "product_brand_handle_unique";`);
    this.addSql(`alter table if exists "product_brand" drop constraint if exists "product_brand_name_unique";`);
    this.addSql(`alter table if exists "product_attribute_value" drop constraint if exists "product_attribute_value_handle_unique";`);
    this.addSql(`alter table if exists "product_attribute" drop constraint if exists "product_attribute_handle_unique";`);
    this.addSql(`create table if not exists "product_attribute" ("id" text not null, "handle" text not null, "name" text not null, "description" text null, "type" text check ("type" in ('single_select', 'multi_select', 'unit', 'toggle', 'text')) not null, "is_required" boolean not null default false, "is_filterable" boolean not null default false, "is_variant_axis" boolean not null default false, "rank" integer not null default 0, "is_active" boolean not null default true, "created_by" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_attribute_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_deleted_at" ON "product_attribute" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_handle_unique" ON "product_attribute" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_type" ON "product_attribute" ("type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_attribute_value" ("id" text not null, "handle" text not null, "name" text not null, "rank" integer not null default 0, "is_active" boolean not null default true, "metadata" jsonb null, "attribute_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_attribute_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_attribute_id" ON "product_attribute_value" ("attribute_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_attribute_value_deleted_at" ON "product_attribute_value" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_attribute_value_handle_unique" ON "product_attribute_value" ("attribute_id", "handle") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_brand" ("id" text not null, "name" text not null, "handle" text not null, "is_restricted" boolean not null default false, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_brand_deleted_at" ON "product_brand" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_brand_name_unique" ON "product_brand" ("name") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_brand_handle_unique" ON "product_brand" ("handle") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_category" ("id" text not null, "name" text not null, "description" text not null default '', "handle" text not null, "mpath" text not null, "is_active" boolean not null default false, "is_internal" boolean not null default false, "is_restricted" boolean not null default false, "rank" integer not null default 0, "metadata" jsonb null, "parent_category_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_category_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_category_parent_category_id" ON "product_category" ("parent_category_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_category_deleted_at" ON "product_category" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_category_path" ON "product_category" ("mpath") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_category_handle_unique" ON "product_category" ("handle") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_category_attribute" ("product_category_id" text not null, "product_attribute_id" text not null, constraint "product_category_attribute_pkey" primary key ("product_category_id", "product_attribute_id"));`);

    this.addSql(`create table if not exists "product_collection" ("id" text not null, "title" text not null, "handle" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_collection_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_collection_deleted_at" ON "product_collection" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_collection_handle_unique" ON "product_collection" ("handle") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_rejection_reason" ("id" text not null, "code" text not null, "label" text not null, "type" text check ("type" in ('temporary', 'permanent')) not null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_rejection_reason_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_rejection_reason_deleted_at" ON "product_rejection_reason" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_rejection_reason_code_unique" ON "product_rejection_reason" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_rejection_reason_type" ON "product_rejection_reason" ("type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_tag" ("id" text not null, "value" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_tag_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_tag_deleted_at" ON "product_tag" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tag_value_unique" ON "product_tag" ("value") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_type" ("id" text not null, "value" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_type_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_type_deleted_at" ON "product_type" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_type_value_unique" ON "product_type" ("value") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product" ("id" text not null, "title" text not null, "handle" text not null, "subtitle" text null, "description" text null, "is_giftcard" boolean not null default false, "thumbnail" text null, "weight" text null, "length" text null, "height" text null, "width" text null, "origin_country" text null, "hs_code" text null, "mid_code" text null, "material" text null, "discountable" boolean not null default true, "external_id" text null, "metadata" jsonb null, "status" text check ("status" in ('pending', 'accepted', 'requires_action', 'rejected')) not null default 'pending', "is_active" boolean not null default false, "is_restricted" boolean not null default false, "created_by" text null, "created_by_actor" text null, "type_id" text null, "brand_id" text null, "collection_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_type_id" ON "product" ("type_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_brand_id" ON "product" ("brand_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_collection_id" ON "product" ("collection_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_deleted_at" ON "product" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_handle_unique" ON "product" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_status" ON "product" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_is_active" ON "product" ("is_active") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_created_by" ON "product" ("created_by") WHERE deleted_at IS NULL AND created_by IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_created_by_actor" ON "product" ("created_by_actor") WHERE deleted_at IS NULL AND created_by_actor IS NOT NULL;`);

    this.addSql(`create table if not exists "image" ("id" text not null, "url" text not null, "metadata" jsonb null, "rank" integer not null default 0, "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_image_product_id" ON "image" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_image_deleted_at" ON "image" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_image_url" ON "image" ("url") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_image_rank" ON "image" ("rank") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_image_url_rank_product_id" ON "image" ("url", "rank", "product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_image_rank_product_id" ON "image" ("rank", "product_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_change" ("id" text not null, "product_id" text not null, "status" text check ("status" in ('pending', 'confirmed', 'declined', 'canceled')) not null default 'pending', "internal_note" text null, "created_by" text null, "confirmed_by" text null, "confirmed_at" timestamptz null, "declined_by" text null, "declined_at" timestamptz null, "declined_reason" text null, "canceled_by" text null, "canceled_at" timestamptz null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_change_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_change_product_id" ON "product_change" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_change_deleted_at" ON "product_change" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_change_status" ON "product_change" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_change_action" ("id" text not null, "product_id" text not null, "ordering" serial, "action" text not null, "details" jsonb not null default '{}', "internal_note" text null, "applied" boolean not null default false, "product_change_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_change_action_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_change_action_product_change_id" ON "product_change_action" ("product_change_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_change_action_deleted_at" ON "product_change_action" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_prodchact_product_change_id" ON "product_change_action" ("product_change_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_prodchact_product_id" ON "product_change_action" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_prodchact_ordering" ON "product_change_action" ("ordering") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_change_rejection_reason" ("product_change_id" text not null, "product_rejection_reason_id" text not null, constraint "product_change_rejection_reason_pkey" primary key ("product_change_id", "product_rejection_reason_id"));`);

    this.addSql(`create table if not exists "product_variant_attribute" ("product_attribute_id" text not null, "product_id" text not null, constraint "product_variant_attribute_pkey" primary key ("product_attribute_id", "product_id"));`);

    this.addSql(`create table if not exists "product_tags" ("product_id" text not null, "product_tag_id" text not null, constraint "product_tags_pkey" primary key ("product_id", "product_tag_id"));`);

    this.addSql(`create table if not exists "product_category_product" ("product_id" text not null, "product_category_id" text not null, constraint "product_category_product_pkey" primary key ("product_id", "product_category_id"));`);

    this.addSql(`create table if not exists "product_variant" ("id" text not null, "title" text not null, "sku" text null, "barcode" text null, "ean" text null, "upc" text null, "allow_backorder" boolean not null default false, "manage_inventory" boolean not null default true, "hs_code" text null, "origin_country" text null, "mid_code" text null, "material" text null, "weight" integer null, "length" integer null, "height" integer null, "width" integer null, "metadata" jsonb null, "variant_rank" integer null default 0, "thumbnail" text null, "isbn" text null, "asin" text null, "gtin" text null, "product_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_variant_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_id" ON "product_variant" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_deleted_at" ON "product_variant" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_id_product_id" ON "product_variant" ("id", "product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_sku_unique" ON "product_variant" ("sku") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_barcode_unique" ON "product_variant" ("barcode") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_ean_unique" ON "product_variant" ("ean") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_upc_unique" ON "product_variant" ("upc") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_isbn_unique" ON "product_variant" ("isbn") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_asin_unique" ON "product_variant" ("asin") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_gtin_unique" ON "product_variant" ("gtin") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_variant_attribute_value" ("product_attribute_value_id" text not null, "product_variant_id" text not null, constraint "product_variant_attribute_value_pkey" primary key ("product_attribute_value_id", "product_variant_id"));`);

    this.addSql(`create table if not exists "product_variant_product_image" ("id" text not null, "variant_id" text not null, "image_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_variant_product_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_image_variant_id" ON "product_variant_product_image" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_image_image_id" ON "product_variant_product_image" ("image_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_image_deleted_at" ON "product_variant_product_image" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_attribute_value" add constraint "product_attribute_value_attribute_id_foreign" foreign key ("attribute_id") references "product_attribute" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_category" add constraint "product_category_parent_category_id_foreign" foreign key ("parent_category_id") references "product_category" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_category_attribute" add constraint "product_category_attribute_product_category_id_foreign" foreign key ("product_category_id") references "product_category" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_category_attribute" add constraint "product_category_attribute_product_attribute_id_foreign" foreign key ("product_attribute_id") references "product_attribute" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product" add constraint "product_type_id_foreign" foreign key ("type_id") references "product_type" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table if exists "product" add constraint "product_brand_id_foreign" foreign key ("brand_id") references "product_brand" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table if exists "product" add constraint "product_collection_id_foreign" foreign key ("collection_id") references "product_collection" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table if exists "image" add constraint "image_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_change" add constraint "product_change_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade;`);

    this.addSql(`alter table if exists "product_change_action" add constraint "product_change_action_product_change_id_foreign" foreign key ("product_change_id") references "product_change" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_change_rejection_reason" add constraint "product_change_rejection_reason_product_change_id_foreign" foreign key ("product_change_id") references "product_change" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_change_rejection_reason" add constraint "product_change_rejection_reason_product_rejectio_8c955_foreign" foreign key ("product_rejection_reason_id") references "product_rejection_reason" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_variant_attribute" add constraint "product_variant_attribute_product_attribute_id_foreign" foreign key ("product_attribute_id") references "product_attribute" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_variant_attribute" add constraint "product_variant_attribute_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_tags" add constraint "product_tags_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_tags" add constraint "product_tags_product_tag_id_foreign" foreign key ("product_tag_id") references "product_tag" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_category_product" add constraint "product_category_product_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_category_product" add constraint "product_category_product_product_category_id_foreign" foreign key ("product_category_id") references "product_category" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_variant" add constraint "product_variant_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_variant_attribute_value" add constraint "product_variant_attribute_value_product_attribut_8c654_foreign" foreign key ("product_attribute_value_id") references "product_attribute_value" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_variant_attribute_value" add constraint "product_variant_attribute_value_product_variant_id_foreign" foreign key ("product_variant_id") references "product_variant" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_attribute_value" drop constraint if exists "product_attribute_value_attribute_id_foreign";`);

    this.addSql(`alter table if exists "product_category_attribute" drop constraint if exists "product_category_attribute_product_attribute_id_foreign";`);

    this.addSql(`alter table if exists "product_variant_attribute" drop constraint if exists "product_variant_attribute_product_attribute_id_foreign";`);

    this.addSql(`alter table if exists "product_variant_attribute_value" drop constraint if exists "product_variant_attribute_value_product_attribut_8c654_foreign";`);

    this.addSql(`alter table if exists "product" drop constraint if exists "product_brand_id_foreign";`);

    this.addSql(`alter table if exists "product_category" drop constraint if exists "product_category_parent_category_id_foreign";`);

    this.addSql(`alter table if exists "product_category_attribute" drop constraint if exists "product_category_attribute_product_category_id_foreign";`);

    this.addSql(`alter table if exists "product_category_product" drop constraint if exists "product_category_product_product_category_id_foreign";`);

    this.addSql(`alter table if exists "product" drop constraint if exists "product_collection_id_foreign";`);

    this.addSql(`alter table if exists "product_change_rejection_reason" drop constraint if exists "product_change_rejection_reason_product_rejectio_8c955_foreign";`);

    this.addSql(`alter table if exists "product_tags" drop constraint if exists "product_tags_product_tag_id_foreign";`);

    this.addSql(`alter table if exists "product" drop constraint if exists "product_type_id_foreign";`);

    this.addSql(`alter table if exists "image" drop constraint if exists "image_product_id_foreign";`);

    this.addSql(`alter table if exists "product_change" drop constraint if exists "product_change_product_id_foreign";`);

    this.addSql(`alter table if exists "product_variant_attribute" drop constraint if exists "product_variant_attribute_product_id_foreign";`);

    this.addSql(`alter table if exists "product_tags" drop constraint if exists "product_tags_product_id_foreign";`);

    this.addSql(`alter table if exists "product_category_product" drop constraint if exists "product_category_product_product_id_foreign";`);

    this.addSql(`alter table if exists "product_variant" drop constraint if exists "product_variant_product_id_foreign";`);

    this.addSql(`alter table if exists "product_change_action" drop constraint if exists "product_change_action_product_change_id_foreign";`);

    this.addSql(`alter table if exists "product_change_rejection_reason" drop constraint if exists "product_change_rejection_reason_product_change_id_foreign";`);

    this.addSql(`alter table if exists "product_variant_attribute_value" drop constraint if exists "product_variant_attribute_value_product_variant_id_foreign";`);

    this.addSql(`drop table if exists "product_attribute" cascade;`);

    this.addSql(`drop table if exists "product_attribute_value" cascade;`);

    this.addSql(`drop table if exists "product_brand" cascade;`);

    this.addSql(`drop table if exists "product_category" cascade;`);

    this.addSql(`drop table if exists "product_category_attribute" cascade;`);

    this.addSql(`drop table if exists "product_collection" cascade;`);

    this.addSql(`drop table if exists "product_rejection_reason" cascade;`);

    this.addSql(`drop table if exists "product_tag" cascade;`);

    this.addSql(`drop table if exists "product_type" cascade;`);

    this.addSql(`drop table if exists "product" cascade;`);

    this.addSql(`drop table if exists "image" cascade;`);

    this.addSql(`drop table if exists "product_change" cascade;`);

    this.addSql(`drop table if exists "product_change_action" cascade;`);

    this.addSql(`drop table if exists "product_change_rejection_reason" cascade;`);

    this.addSql(`drop table if exists "product_variant_attribute" cascade;`);

    this.addSql(`drop table if exists "product_tags" cascade;`);

    this.addSql(`drop table if exists "product_category_product" cascade;`);

    this.addSql(`drop table if exists "product_variant" cascade;`);

    this.addSql(`drop table if exists "product_variant_attribute_value" cascade;`);

    this.addSql(`drop table if exists "product_variant_product_image" cascade;`);
  }

}
