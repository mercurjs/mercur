import { Migration } from '@mikro-orm/migrations';

export class Migration20241212134610 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table if not exists "payment_account" ("id" text not null, "status" text check ("status" in (\'pending\', \'active\', \'disabled\')) not null default \'pending\', "reference_id" text null, "data" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_account_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_payment_account_deleted_at" ON "payment_account" (deleted_at) WHERE deleted_at IS NULL;');

    this.addSql('create table if not exists "transfer" ("id" text not null, "status" text check ("status" in (\'succeeded\', \'failed\')) not null, "currency_code" text not null, "amount" numeric not null, "data" jsonb not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "transfer_pkey" primary key ("id"));');
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_transfer_deleted_at" ON "transfer" (deleted_at) WHERE deleted_at IS NULL;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "payment_account" cascade;');

    this.addSql('drop table if exists "transfer" cascade;');
  }

}
