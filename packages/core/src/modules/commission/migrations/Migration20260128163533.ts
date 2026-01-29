import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260128163533 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "commission_rate" drop constraint if exists "commission_rate_code_unique";`);
    this.addSql(`create table if not exists "commission_line" ("id" text not null, "item_id" text not null, "commission_rate_id" text null, "code" text not null, "rate" real not null, "amount" numeric not null, "description" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_line_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_line_deleted_at" ON "commission_line" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "commission_rate" ("id" text not null, "is_enabled" boolean not null default true, "priority" integer not null default 0, "currency_code" text null, "name" text not null, "code" text not null, "type" text check ("type" in ('fixed', 'percentage')) not null, "target" text check ("target" in ('item', 'shipping')) not null default 'item', "value" numeric not null, "min_amount" numeric null, "include_tax" boolean not null default false, "raw_value" jsonb not null, "raw_min_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_rate_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_commission_rate_code_unique" ON "commission_rate" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_rate_deleted_at" ON "commission_rate" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "commission_rule" ("id" text not null, "reference" text not null, "reference_id" text not null, "commission_rate_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_rule_commission_rate_id" ON "commission_rule" ("commission_rate_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_commission_rule_deleted_at" ON "commission_rule" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "commission_rule" add constraint "commission_rule_commission_rate_id_foreign" foreign key ("commission_rate_id") references "commission_rate" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "commission_rule" drop constraint if exists "commission_rule_commission_rate_id_foreign";`);

    this.addSql(`drop table if exists "commission_line" cascade;`);

    this.addSql(`drop table if exists "commission_rate" cascade;`);

    this.addSql(`drop table if exists "commission_rule" cascade;`);
  }

}
