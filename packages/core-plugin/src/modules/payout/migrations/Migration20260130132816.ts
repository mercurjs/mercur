import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260130132816 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "onboarding" drop constraint if exists "onboarding_account_id_unique";`);
    this.addSql(`create table if not exists "payout_account" ("id" text not null, "status" text check ("status" in ('pending', 'active', 'restricted', 'rejected')) not null default 'pending', "data" jsonb not null, "context" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_account_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_account_deleted_at" ON "payout_account" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payout" ("id" text not null, "currency_code" text not null, "amount" numeric not null, "data" jsonb null, "account_id" text not null, "status" text check ("status" in ('pending', 'processing', 'paid', 'failed', 'canceled')) not null default 'pending', "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_account_id" ON "payout" ("account_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_deleted_at" ON "payout" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "onboarding" ("id" text not null, "data" jsonb null, "context" jsonb null, "account_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "onboarding_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_onboarding_account_id_unique" ON "onboarding" ("account_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_onboarding_deleted_at" ON "onboarding" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payout_balance" ("id" text not null, "currency_code" text not null, "totals" jsonb not null, "account_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_balance_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_balance_account_id" ON "payout_balance" ("account_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_balance_deleted_at" ON "payout_balance" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_balance_account_currency" ON "payout_balance" ("account_id", "currency_code") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payout_transaction" ("id" text not null, "amount" numeric not null, "currency_code" text not null, "reference" text null, "reference_id" text null, "account_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_transaction_account_id" ON "payout_transaction" ("account_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_transaction_deleted_at" ON "payout_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_transaction_reference" ON "payout_transaction" ("reference", "reference_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "payout" add constraint "payout_account_id_foreign" foreign key ("account_id") references "payout_account" ("id") on update cascade;`);

    this.addSql(`alter table if exists "onboarding" add constraint "onboarding_account_id_foreign" foreign key ("account_id") references "payout_account" ("id") on update cascade;`);

    this.addSql(`alter table if exists "payout_balance" add constraint "payout_balance_account_id_foreign" foreign key ("account_id") references "payout_account" ("id") on update cascade;`);

    this.addSql(`alter table if exists "payout_transaction" add constraint "payout_transaction_account_id_foreign" foreign key ("account_id") references "payout_account" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_account_id_foreign";`);

    this.addSql(`alter table if exists "onboarding" drop constraint if exists "onboarding_account_id_foreign";`);

    this.addSql(`alter table if exists "payout_balance" drop constraint if exists "payout_balance_account_id_foreign";`);

    this.addSql(`alter table if exists "payout_transaction" drop constraint if exists "payout_transaction_account_id_foreign";`);

    this.addSql(`drop table if exists "payout_account" cascade;`);

    this.addSql(`drop table if exists "payout" cascade;`);

    this.addSql(`drop table if exists "onboarding" cascade;`);

    this.addSql(`drop table if exists "payout_balance" cascade;`);

    this.addSql(`drop table if exists "payout_transaction" cascade;`);
  }

}
