import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261022120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payout_provider" ("id" text not null, "is_enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_provider_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_provider_deleted_at" ON "payout_provider" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`alter table if exists "payout_account" add column if not exists "provider_id" text not null default 'pop_system_default', add column if not exists "provider_account_id" text null, add column if not exists "kyc_status" text check ("kyc_status" in ('pending_submission', 'pending_approval', 'approved', 'refused')) null, add column if not exists "payouts_enabled" boolean not null default false, add column if not exists "charges_enabled" boolean not null default false, add column if not exists "details_submitted" boolean not null default false, add column if not exists "disabled_reason" text null, add column if not exists "requirements" jsonb null, add column if not exists "ignored" boolean not null default false, add column if not exists "onboarding_token" text null, add column if not exists "last_synced_at" timestamptz null;`)
    this.addSql(`update "payout_account" set "provider_account_id" = "data"->>'id' where "provider_account_id" is null and "data"->>'id' is not null;`)
    this.addSql(`update "payout_account" set "provider_id" = 'pop_stripe-connect_stripe' where "provider_id" = 'pop_system_default' and "data"->>'object' = 'account';`)
    this.addSql(`update "payout_account" set "payouts_enabled" = true, "charges_enabled" = true, "details_submitted" = true where "status" = 'active';`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_provider_account_id" ON "payout_account" ("provider_id", "provider_account_id") WHERE deleted_at IS NULL AND provider_account_id IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_onboarding_token" ON "payout_account" ("onboarding_token") WHERE deleted_at IS NULL AND onboarding_token IS NOT NULL;`)

    this.addSql(`create table if not exists "settlement" ("id" text not null, "provider_id" text not null, "currency_code" text not null, "period_start" timestamptz not null, "period_end" timestamptz not null, "transfers_total" numeric not null, "raw_transfers_total" jsonb not null, "reversals_total" numeric not null, "raw_reversals_total" jsonb not null, "adjustments_total" numeric not null, "raw_adjustments_total" jsonb not null, "amount" numeric not null, "raw_amount" jsonb not null, "status" text check ("status" in ('open', 'paid_out', 'failed', 'aborted')) not null default 'open', "account_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "settlement_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_settlement_account_id" ON "settlement" ("account_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_settlement_deleted_at" ON "settlement" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_settlement_account_currency_period_end" ON "settlement" ("account_id", "currency_code", "period_end") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_settlement_status" ON "settlement" ("status") WHERE deleted_at IS NULL;`)
    this.addSql(`alter table if exists "settlement" add constraint "settlement_account_id_foreign" foreign key ("account_id") references "payout_account" ("id") on update cascade;`)

    this.addSql(`create table if not exists "transfer" ("id" text not null, "provider_id" text not null, "type" text check ("type" in ('order', 'tax', 'refund_reversal', 'adjustment_credit', 'adjustment_debit')) not null, "order_id" text null, "adjustment_id" text null, "reverses_transfer_id" text null, "refund_id" text null, "source_payment_id" text null, "provider_transfer_id" text null, "amount" numeric not null, "raw_amount" jsonb not null, "currency_code" text not null, "status" text check ("status" in ('pending', 'created', 'failed', 'on_hold', 'aborted', 'ignored')) not null default 'pending', "status_reason" text null, "source_created_at" timestamptz null, "data" jsonb null, "account_id" text not null, "settlement_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "transfer_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_transfer_account_id" ON "transfer" ("account_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_transfer_settlement_id" ON "transfer" ("settlement_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_transfer_deleted_at" ON "transfer" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_transfer_order_id_type" ON "transfer" ("order_id", "type") WHERE deleted_at IS NULL AND order_id IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_transfer_refund_id" ON "transfer" ("refund_id") WHERE deleted_at IS NULL AND refund_id IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_transfer_adjustment_id" ON "transfer" ("adjustment_id") WHERE deleted_at IS NULL AND adjustment_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_transfer_status_created_at" ON "transfer" ("status", "created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_transfer_account_id_status" ON "transfer" ("account_id", "status") WHERE deleted_at IS NULL;`)
    this.addSql(`alter table if exists "transfer" add constraint "transfer_account_id_foreign" foreign key ("account_id") references "payout_account" ("id") on update cascade;`)
    this.addSql(`alter table if exists "transfer" add constraint "transfer_settlement_id_foreign" foreign key ("settlement_id") references "settlement" ("id") on update cascade on delete set null;`)

    this.addSql(`create table if not exists "adjustment" ("id" text not null, "type" text check ("type" in ('subscription', 'extra_invoice', 'extra_credit')) not null, "amount" numeric not null, "raw_amount" jsonb not null, "currency_code" text not null, "reason" text null, "created_by" text null, "transfer_id" text null, "account_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "adjustment_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_adjustment_account_id" ON "adjustment" ("account_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_adjustment_deleted_at" ON "adjustment" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_adjustment_account_id_transfer_id" ON "adjustment" ("account_id", "transfer_id") WHERE deleted_at IS NULL;`)
    this.addSql(`alter table if exists "adjustment" add constraint "adjustment_account_id_foreign" foreign key ("account_id") references "payout_account" ("id") on update cascade;`)

    this.addSql(`create table if not exists "payout_checkpoint" ("id" text not null, "key" text not null, "value" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_checkpoint_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_checkpoint_key_unique" ON "payout_checkpoint" ("key") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_checkpoint_deleted_at" ON "payout_checkpoint" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "payout_job_run" ("id" text not null, "job" text not null, "trigger" text check ("trigger" in ('schedule', 'manual', 'subscriber')) not null default 'schedule', "status" text check ("status" in ('running', 'succeeded', 'failed')) not null default 'running', "started_at" timestamptz not null, "finished_at" timestamptz null, "stats" jsonb null, "error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_job_run_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_job_run_job_started_at" ON "payout_job_run" ("job", "started_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_job_run_deleted_at" ON "payout_job_run" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "payout_notification" ("id" text not null, "type" text not null, "url" text not null, "payload" jsonb not null, "attempts" integer not null default 0, "response_status" integer null, "error" text null, "delivered" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_notification_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_notification_created_at" ON "payout_notification" ("created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_notification_deleted_at" ON "payout_notification" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`alter table if exists "payout" add column if not exists "provider_payout_id" text null, add column if not exists "status_reason" text null, add column if not exists "settlement_id" text null;`)
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_status_check";`)
    this.addSql(`alter table if exists "payout" add constraint "payout_status_check" check ("status" in ('pending', 'processing', 'paid', 'failed', 'canceled', 'on_hold', 'aborted'));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_settlement_id" ON "payout" ("settlement_id") WHERE deleted_at IS NULL AND settlement_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_provider_payout_id" ON "payout" ("provider_payout_id") WHERE deleted_at IS NULL AND provider_payout_id IS NOT NULL;`)
    this.addSql(`alter table if exists "payout" add constraint "payout_settlement_id_foreign" foreign key ("settlement_id") references "settlement" ("id") on update cascade on delete set null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_settlement_id_foreign";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_settlement_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_provider_payout_id";`)
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_status_check";`)
    this.addSql(`alter table if exists "payout" add constraint "payout_status_check" check ("status" in ('pending', 'processing', 'paid', 'failed', 'canceled'));`)
    this.addSql(`alter table if exists "payout" drop column if exists "provider_payout_id", drop column if exists "status_reason", drop column if exists "settlement_id";`)

    this.addSql(`drop table if exists "payout_notification" cascade;`)
    this.addSql(`drop table if exists "payout_job_run" cascade;`)
    this.addSql(`drop table if exists "payout_checkpoint" cascade;`)
    this.addSql(`drop table if exists "adjustment" cascade;`)
    this.addSql(`drop table if exists "transfer" cascade;`)
    this.addSql(`drop table if exists "settlement" cascade;`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_provider_account_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_onboarding_token";`)
    this.addSql(`alter table if exists "payout_account" drop column if exists "provider_id", drop column if exists "provider_account_id", drop column if exists "kyc_status", drop column if exists "payouts_enabled", drop column if exists "charges_enabled", drop column if exists "details_submitted", drop column if exists "disabled_reason", drop column if exists "requirements", drop column if exists "ignored", drop column if exists "onboarding_token", drop column if exists "last_synced_at";`)

    this.addSql(`drop table if exists "payout_provider" cascade;`)
  }
}
