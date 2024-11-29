import { Migration } from '@mikro-orm/migrations'

export class Migration20241127154133 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "order_set" ("id" text not null, "display_id" serial not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_set_pkey" primary key ("id"));'
    )
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "order_set" cascade;')
  }
}
