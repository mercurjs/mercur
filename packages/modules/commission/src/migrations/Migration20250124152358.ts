import { Migration } from '@mikro-orm/migrations';

export class Migration20250124152358 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "commission_line" ("id" text not null, "item_line_id" text not null, "rule_id" text not null, "currency_code" text not null, "value" numeric not null, "raw_value" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_line_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_commission_line_deleted_at" ON "commission_line" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "commission_rule" ("id" text not null, "name" text not null, "reference" text not null, "reference_id" text not null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_rule_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_commission_rule_deleted_at" ON "commission_rule" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "commission_rate" ("id" text not null, "type" text not null, "percentage_rate" integer not null, "include_tax" boolean not null, "price_set_id" text not null, "max_price_set_id" text not null, "min_price_set_id" text not null, "rule_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "commission_rate_pkey" primary key ("id"));');
    this.addSql('alter table if exists "commission_rate" add constraint "commission_rate_rule_id_unique" unique ("rule_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_commission_rate_rule_id" ON "commission_rate" (rule_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_commission_rate_deleted_at" ON "commission_rate" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "commission_rate" add constraint "commission_rate_rule_id_foreign" foreign key ("rule_id") references "commission_rule" ("id") on update cascade on delete set null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "commission_rate" drop constraint if exists "commission_rate_rule_id_foreign";');

    this.addSql('drop table if exists "commission_line" cascade;');

    this.addSql('drop table if exists "commission_rule" cascade;');

    this.addSql('drop table if exists "commission_rate" cascade;');
  }

}
