import { Migration } from '@mikro-orm/migrations';

export class Migration20250211102015 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "default_seller_shipping_option" ("id" text not null, "external_provider" text not null, "external_provider_id" text not null, "external_provider_option_name" text not null, "is_enabled" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "default_seller_shipping_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_default_seller_shipping_option_deleted_at" ON "default_seller_shipping_option" (deleted_at) WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "default_shipping_option" ("id" text not null, "external_provider" text not null, "external_provider_id" text not null, "external_provider_option_name" text not null, "is_enabled" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "default_shipping_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_default_shipping_option_deleted_at" ON "default_shipping_option" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "default_seller_shipping_option" cascade;`);

    this.addSql(`drop table if exists "default_shipping_option" cascade;`);
  }

}
