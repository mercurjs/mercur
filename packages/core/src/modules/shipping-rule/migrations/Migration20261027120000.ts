import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261027120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "shipping_zone" ("id" text not null, "name" text not null, "code" text not null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_zone_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipping_zone_code_unique" ON "shipping_zone" ("code") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_zone_deleted_at" ON "shipping_zone" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "shipping_zone_area" ("id" text not null, "type" text check ("type" in ('country', 'province')) not null default 'country', "country_code" text not null, "province_code" text null, "shipping_zone_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_zone_area_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_zone_area_shipping_zone_id" ON "shipping_zone_area" ("shipping_zone_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_zone_area_deleted_at" ON "shipping_zone_area" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "marketplace_shipping_method" ("id" text not null, "name" text not null, "code" text not null, "description" text null, "provider_id" text not null, "shipping_option_type_id" text not null, "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "marketplace_shipping_method_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_marketplace_shipping_method_code_unique" ON "marketplace_shipping_method" ("code") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_marketplace_shipping_method_deleted_at" ON "marketplace_shipping_method" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "shipping_rule" ("id" text not null, "shipping_profile_id" text not null, "requirement" text check ("requirement" in ('mandatory', 'optional', 'not_supported')) not null default 'optional', "price_type" text check ("price_type" in ('flat', 'calculated')) not null default 'flat', "seller_can_edit_price" boolean not null default false, "transit_min_days" integer null, "transit_max_days" integer null, "seller_can_edit_transit" boolean not null default false, "shipping_zone_id" text not null, "shipping_method_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_rule_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipping_rule_zone_method_profile_unique" ON "shipping_rule" ("shipping_zone_id", "shipping_method_id", "shipping_profile_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_rule_shipping_profile_id" ON "shipping_rule" ("shipping_profile_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_rule_shipping_zone_id" ON "shipping_rule" ("shipping_zone_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_rule_shipping_method_id" ON "shipping_rule" ("shipping_method_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_rule_deleted_at" ON "shipping_rule" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "shipping_rule_price" ("id" text not null, "currency_code" text null, "region_id" text null, "amount" numeric not null, "raw_amount" jsonb not null, "shipping_rule_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_rule_price_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_rule_price_shipping_rule_id" ON "shipping_rule_price" ("shipping_rule_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipping_rule_price_deleted_at" ON "shipping_rule_price" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `alter table if exists "shipping_zone_area" add constraint "shipping_zone_area_shipping_zone_id_foreign" foreign key ("shipping_zone_id") references "shipping_zone" ("id") on update cascade on delete cascade;`
    )
    this.addSql(
      `alter table if exists "shipping_rule" add constraint "shipping_rule_shipping_zone_id_foreign" foreign key ("shipping_zone_id") references "shipping_zone" ("id") on update cascade on delete cascade;`
    )
    this.addSql(
      `alter table if exists "shipping_rule" add constraint "shipping_rule_shipping_method_id_foreign" foreign key ("shipping_method_id") references "marketplace_shipping_method" ("id") on update cascade on delete cascade;`
    )
    this.addSql(
      `alter table if exists "shipping_rule_price" add constraint "shipping_rule_price_shipping_rule_id_foreign" foreign key ("shipping_rule_id") references "shipping_rule" ("id") on update cascade on delete cascade;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shipping_rule_price" cascade;`)
    this.addSql(`drop table if exists "shipping_rule" cascade;`)
    this.addSql(`drop table if exists "shipping_zone_area" cascade;`)
    this.addSql(`drop table if exists "marketplace_shipping_method" cascade;`)
    this.addSql(`drop table if exists "shipping_zone" cascade;`)
  }
}
