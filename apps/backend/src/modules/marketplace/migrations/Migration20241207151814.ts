import { Migration } from '@mikro-orm/migrations'

export class Migration20241207151814 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "order_set" ("id" text not null, "display_id" serial, "sales_channel_id" text not null, "cart_id" text not null, "customer_id" text null, "payment_collection_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_set_pkey" primary key ("id"));'
    )
    this.addSql(
      'CREATE INDEX IF NOT EXISTS "IDX_order_set_deleted_at" ON "order_set" (deleted_at) WHERE deleted_at IS NULL;'
    )
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "order_set" cascade;')
  }
}
