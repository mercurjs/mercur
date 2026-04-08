import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260408120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "service_fee" ("id" text not null, "is_enabled" boolean not null default true, "priority" integer not null default 0, "currency_code" text null, "name" text not null, "display_name" text not null, "code" text not null, "type" text check ("type" in ('fixed', 'percentage')) not null, "target" text check ("target" in ('item', 'shipping')) not null default 'item', "charging_level" text check ("charging_level" in ('global', 'item', 'shop')) not null, "status" text check ("status" in ('active', 'pending', 'inactive')) not null default 'active', "value" numeric not null, "min_amount" numeric null, "max_amount" numeric null, "include_tax" boolean not null default false, "effective_date" timestamptz null, "start_date" timestamptz null, "end_date" timestamptz null, "replaces_fee_id" text null, "raw_value" jsonb not null, "raw_min_amount" jsonb null, "raw_max_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_fee_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_service_fee_code_unique" ON "service_fee" ("code") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_deleted_at" ON "service_fee" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_status" ON "service_fee" ("status") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_charging_level_status" ON "service_fee" ("charging_level", "status") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "service_fee_rule" ("id" text not null, "reference" text not null, "reference_id" text not null, "mode" text not null default 'include', "service_fee_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_fee_rule_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_rule_service_fee_id" ON "service_fee_rule" ("service_fee_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_rule_deleted_at" ON "service_fee_rule" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "service_fee_line" ("id" text not null, "item_id" text not null, "service_fee_id" text null, "code" text not null, "rate" real not null, "amount" numeric not null, "description" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_fee_line_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_line_deleted_at" ON "service_fee_line" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_line_item_id" ON "service_fee_line" ("item_id") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "service_fee_change_log" ("id" text not null, "service_fee_id" text not null, "action" text not null, "changed_by" text null, "previous_snapshot" jsonb null, "new_snapshot" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "service_fee_change_log_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_change_log_service_fee_id" ON "service_fee_change_log" ("service_fee_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_service_fee_change_log_deleted_at" ON "service_fee_change_log" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`alter table if exists "service_fee_rule" add constraint "service_fee_rule_service_fee_id_foreign" foreign key ("service_fee_id") references "service_fee" ("id") on update cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "service_fee_rule" drop constraint if exists "service_fee_rule_service_fee_id_foreign";`)
    this.addSql(`drop table if exists "service_fee_change_log" cascade;`)
    this.addSql(`drop table if exists "service_fee_line" cascade;`)
    this.addSql(`drop table if exists "service_fee_rule" cascade;`)
    this.addSql(`drop table if exists "service_fee" cascade;`)
  }
}
