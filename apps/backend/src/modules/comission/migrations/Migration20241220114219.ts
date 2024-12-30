import { Migration } from '@mikro-orm/migrations';

export class Migration20241220114219 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "comission_rule" ("id" text not null, "name" text not null, "reference" text not null, "reference_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "comission_rule_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_comission_rule_deleted_at" ON "comission_rule" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "comission_rate" ("id" text not null, "type" text not null, "percentage_rate" integer not null, "is_default" boolean not null, "include_tax" boolean not null, "include_shipping" boolean not null, "price_set_id" text not null, "max_price_set_id" text not null, "min_price_set_id" text not null, "rule_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "comission_rate_pkey" primary key ("id"));');
    this.addSql('alter table if exists "comission_rate" add constraint "comission_rate_rule_id_unique" unique ("rule_id");');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_comission_rate_rule_id" ON "comission_rate" (rule_id) WHERE deleted_at IS NULL;');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_comission_rate_deleted_at" ON "comission_rate" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('alter table if exists "comission_rate" add constraint "comission_rate_rule_id_foreign" foreign key ("rule_id") references "comission_rule" ("id") on update cascade on delete set null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "comission_rate" drop constraint if exists "comission_rate_rule_id_foreign";');

    this.addSql('drop table if exists "comission_rule" cascade;');

    this.addSql('drop table if exists "comission_rate" cascade;');
  }

}
