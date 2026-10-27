import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261027160000 extends Migration {
  override async up(): Promise<void> {
    // Databases that ran an earlier draft of this migration carry tables and
    // columns the payout module no longer has.
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_settlement_id_foreign";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_settlement_id";`)
    this.addSql(`alter table if exists "payout" drop column if exists "settlement_id";`)
    this.addSql(`drop table if exists "transfer" cascade;`)
    this.addSql(`drop table if exists "adjustment" cascade;`)
    this.addSql(`drop table if exists "settlement" cascade;`)
    this.addSql(`drop table if exists "payout_checkpoint" cascade;`)
    this.addSql(`drop table if exists "payout_job_run" cascade;`)
    this.addSql(`drop table if exists "payout_notification" cascade;`)
    this.addSql(`drop table if exists "payout_provider" cascade;`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_provider_account_id";`)
    this.addSql(`alter table if exists "payout_account" drop column if exists "provider_id", drop column if exists "ignored";`)

    this.addSql(`alter table if exists "payout_account" add column if not exists "provider_account_id" text null, add column if not exists "kyc_status" text check ("kyc_status" in ('pending_submission', 'pending_approval', 'approved', 'refused')) null, add column if not exists "payouts_enabled" boolean not null default false, add column if not exists "charges_enabled" boolean not null default false, add column if not exists "details_submitted" boolean not null default false, add column if not exists "disabled_reason" text null, add column if not exists "requirements" jsonb null, add column if not exists "onboarding_token" text null, add column if not exists "last_synced_at" timestamptz null;`)
    this.addSql(`update "payout_account" set "provider_account_id" = "data"->>'id' where "provider_account_id" is null and "data"->>'id' is not null;`)
    this.addSql(`update "payout_account" set "payouts_enabled" = true, "charges_enabled" = true, "details_submitted" = true where "status" = 'active';`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_provider_account_id" ON "payout_account" ("provider_account_id") WHERE deleted_at IS NULL AND provider_account_id IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_onboarding_token" ON "payout_account" ("onboarding_token") WHERE deleted_at IS NULL AND onboarding_token IS NOT NULL;`)

    this.addSql(`alter table if exists "payout" add column if not exists "order_id" text null, add column if not exists "status_reason" text null, add column if not exists "provider_payout_id" text null, add column if not exists "metadata" jsonb null;`)
    this.addSql(`update "payout" set "order_id" = "data"->>'order_id' where "order_id" is null and "data"->>'order_id' is not null;`)
    this.addSql(`update "payout" set "provider_payout_id" = "data"->>'id' where "provider_payout_id" is null and "data"->>'id' is not null;`)
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_status_check";`)
    this.addSql(`update "payout" set "status" = 'aborted' where "status" = 'canceled';`)
    this.addSql(`alter table if exists "payout" add constraint "payout_status_check" check ("status" in ('pending', 'on_hold', 'processing', 'paid', 'failed', 'aborted'));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_order_id" ON "payout" ("order_id") WHERE deleted_at IS NULL AND order_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_provider_payout_id" ON "payout" ("provider_payout_id") WHERE deleted_at IS NULL AND provider_payout_id IS NOT NULL;`)

    this.addSql(`create table if not exists "payout_reversal" ("id" text not null, "refund_id" text null, "amount" numeric not null, "raw_amount" jsonb not null, "status" text check ("status" in ('pending', 'on_hold', 'processing', 'paid', 'failed', 'aborted')) not null default 'pending', "status_reason" text null, "provider_reversal_id" text null, "data" jsonb null, "payout_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_reversal_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_reversal_deleted_at" ON "payout_reversal" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_reversal_payout_id" ON "payout_reversal" ("payout_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_reversal_refund_id" ON "payout_reversal" ("refund_id") WHERE deleted_at IS NULL AND refund_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_reversal_status_created_at" ON "payout_reversal" ("status", "created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`alter table if exists "payout_reversal" add constraint "payout_reversal_payout_id_foreign" foreign key ("payout_id") references "payout" ("id") on update cascade on delete cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payout_reversal" cascade;`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_order_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_provider_payout_id";`)
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_status_check";`)
    this.addSql(`update "payout" set "status" = 'canceled' where "status" = 'aborted';`)
    this.addSql(`update "payout" set "status" = 'pending' where "status" = 'on_hold';`)
    this.addSql(`alter table if exists "payout" add constraint "payout_status_check" check ("status" in ('pending', 'processing', 'paid', 'failed', 'canceled'));`)
    this.addSql(`alter table if exists "payout" drop column if exists "order_id", drop column if exists "status_reason", drop column if exists "provider_payout_id", drop column if exists "metadata";`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_provider_account_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_onboarding_token";`)
    this.addSql(`alter table if exists "payout_account" drop column if exists "provider_account_id", drop column if exists "kyc_status", drop column if exists "payouts_enabled", drop column if exists "charges_enabled", drop column if exists "details_submitted", drop column if exists "disabled_reason", drop column if exists "requirements", drop column if exists "onboarding_token", drop column if exists "last_synced_at";`)
  }
}
