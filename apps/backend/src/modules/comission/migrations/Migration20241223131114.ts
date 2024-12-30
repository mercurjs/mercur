import { Migration } from '@mikro-orm/migrations';

export class Migration20241223131114 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "comission_line" ("id" text not null, "item_line_id" text not null, "rule_id" text not null, "currency_code" text not null, "value" numeric not null, "raw_value" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "comission_line_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_comission_line_deleted_at" ON "comission_line" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "comission_line" cascade;');
  }

}
