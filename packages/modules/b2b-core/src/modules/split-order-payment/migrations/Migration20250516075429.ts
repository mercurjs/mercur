import { Migration } from '@mikro-orm/migrations';

export class Migration20250516075429 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "split_order_payment" ("id" text not null, "status" text not null, "currency_code" text not null, "authorized_amount" numeric not null, "captured_amount" numeric not null, "refunded_amount" numeric not null, "payment_collection_id" text not null, "raw_authorized_amount" jsonb not null, "raw_captured_amount" jsonb not null, "raw_refunded_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "split_order_payment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_split_order_payment_deleted_at" ON "split_order_payment" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "split_order_payment" cascade;`);
  }

}
