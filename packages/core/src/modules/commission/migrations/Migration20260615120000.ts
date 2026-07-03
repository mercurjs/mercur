import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260615120000 extends Migration {

  override async up(): Promise<void> {
    // commission_rate: add include_shipping + is_default; drop target, priority, min_amount
    this.addSql(`alter table if exists "commission_rate" add column if not exists "include_shipping" boolean not null default false;`);
    this.addSql(`alter table if exists "commission_rate" add column if not exists "is_default" boolean not null default false;`);
    this.addSql(`alter table if exists "commission_rate" drop column if exists "priority";`);
    this.addSql(`alter table if exists "commission_rate" drop column if exists "target";`);
    this.addSql(`alter table if exists "commission_rate" drop column if exists "min_amount";`);
    this.addSql(`alter table if exists "commission_rate" drop column if exists "raw_min_amount";`);

    // commission_rate_value: per-currency Fixed amounts
    this.addSql(`create table if not exists "commission_rate_value" ("id" text not null, "currency_code" text not null, "amount" numeric not null, "raw_amount" jsonb not null, "commission_rate_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_rate_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_rate_value_commission_rate_id" ON "commission_rate_value" ("commission_rate_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_rate_value_currency_code" ON "commission_rate_value" ("currency_code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_rate_value_deleted_at" ON "commission_rate_value" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`alter table if exists "commission_rate_value" add constraint "commission_rate_value_commission_rate_id_foreign" foreign key ("commission_rate_id") references "commission_rate" ("id") on update cascade;`);

    // commission_line: item_id nullable + new shipping_method_id (exactly one set)
    this.addSql(`alter table if exists "commission_line" alter column "item_id" drop not null;`);
    this.addSql(`alter table if exists "commission_line" add column if not exists "shipping_method_id" text null;`);
    this.addSql(`alter table if exists "commission_line" drop constraint if exists "commission_line_item_or_shipping_check";`);
    this.addSql(`alter table if exists "commission_line" add constraint "commission_line_item_or_shipping_check" check (num_nonnulls("item_id", "shipping_method_id") = 1);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_line_item_id" ON "commission_line" ("item_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_line_shipping_method_id" ON "commission_line" ("shipping_method_id") WHERE deleted_at IS NULL;`);

    // seed exactly one default (Global Commission) rate
    this.addSql(`insert into "commission_rate" ("id", "is_enabled", "is_default", "currency_code", "name", "code", "type", "value", "raw_value", "include_tax", "include_shipping", "created_at", "updated_at") select 'comrate_default', true, true, null, 'Default', 'default', 'percentage', 0, '{"value":"0"}'::jsonb, false, false, now(), now() where not exists (select 1 from "commission_rate" where "is_default" = true and "deleted_at" is null);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "commission_line" drop constraint if exists "commission_line_item_or_shipping_check";`);
    this.addSql(`alter table if exists "commission_line" drop column if exists "shipping_method_id";`);
    this.addSql(`alter table if exists "commission_line" alter column "item_id" set not null;`);

    this.addSql(`alter table if exists "commission_rate_value" drop constraint if exists "commission_rate_value_commission_rate_id_foreign";`);
    this.addSql(`drop table if exists "commission_rate_value" cascade;`);

    this.addSql(`delete from "commission_rate" where "id" = 'comrate_default';`);
    this.addSql(`alter table if exists "commission_rate" drop column if exists "include_shipping";`);
    this.addSql(`alter table if exists "commission_rate" drop column if exists "is_default";`);
    this.addSql(`alter table if exists "commission_rate" add column if not exists "priority" integer not null default 0;`);
    this.addSql(`alter table if exists "commission_rate" add column if not exists "target" text not null default 'item';`);
    this.addSql(`alter table if exists "commission_rate" add column if not exists "min_amount" numeric null;`);
    this.addSql(`alter table if exists "commission_rate" add column if not exists "raw_min_amount" jsonb null;`);
  }

}
