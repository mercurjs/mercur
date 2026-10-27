import { Migration } from "@medusajs/framework/mikro-orm/migrations"

const PAYOUT_STATUSES = `'pending', 'on_hold', 'processing', 'paid', 'failed', 'aborted'`
const TIMESTAMPS = `"created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null`

export class Migration20261027120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "connector_checkpoint" ("id" text not null, "key" text not null, "value" text null, ${TIMESTAMPS}, constraint "connector_checkpoint_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_connector_checkpoint_key_unique" ON "connector_checkpoint" ("key") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_connector_checkpoint_deleted_at" ON "connector_checkpoint" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "connector_job_run" ("id" text not null, "job" text not null, "trigger" text check ("trigger" in ('schedule', 'manual', 'subscriber')) not null default 'schedule', "status" text check ("status" in ('running', 'succeeded', 'failed')) not null default 'running', "started_at" timestamptz not null, "finished_at" timestamptz null, "stats" jsonb null, "error" text null, ${TIMESTAMPS}, constraint "connector_job_run_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_connector_job_run_job_started_at" ON "connector_job_run" ("job", "started_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_connector_job_run_deleted_at" ON "connector_job_run" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "connector_notification" ("id" text not null, "type" text not null, "url" text not null, "payload" jsonb not null, "attempts" integer not null default 0, "response_status" integer null, "error" text null, "delivered" boolean not null default false, ${TIMESTAMPS}, constraint "connector_notification_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_connector_notification_created_at" ON "connector_notification" ("created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_connector_notification_deleted_at" ON "connector_notification" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "stripe_settlement" ("id" text not null, "display_id" serial, "account_id" text not null, "currency_code" text not null, "period_start" timestamptz not null, "period_end" timestamptz not null, "payouts_total" numeric not null, "raw_payouts_total" jsonb not null, "reversals_total" numeric not null, "raw_reversals_total" jsonb not null, "adjustments_total" numeric not null, "raw_adjustments_total" jsonb not null, "amount" numeric not null, "raw_amount" jsonb not null, "status" text check ("status" in ('open', 'paid_out', 'failed', 'aborted')) not null default 'open', "payout_status" text check ("payout_status" in (${PAYOUT_STATUSES})) null, "provider_payout_id" text null, "status_reason" text null, "data" jsonb null, ${TIMESTAMPS}, constraint "stripe_settlement_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_settlement_account_currency_period_end" ON "stripe_settlement" ("account_id", "currency_code", "period_end") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_settlement_status" ON "stripe_settlement" ("status") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_settlement_provider_payout_id" ON "stripe_settlement" ("provider_payout_id") WHERE deleted_at IS NULL AND provider_payout_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_settlement_deleted_at" ON "stripe_settlement" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "stripe_settlement_line" ("id" text not null, "type" text check ("type" in ('payout', 'reversal', 'adjustment_credit', 'adjustment_debit')) not null, "source_id" text not null, "amount" numeric not null, "raw_amount" jsonb not null, "settlement_id" text not null, ${TIMESTAMPS}, constraint "stripe_settlement_line_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_settlement_line_source_id" ON "stripe_settlement_line" ("source_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_settlement_line_settlement_id" ON "stripe_settlement_line" ("settlement_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_settlement_line_deleted_at" ON "stripe_settlement_line" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`alter table if exists "stripe_settlement_line" add constraint "stripe_settlement_line_settlement_id_foreign" foreign key ("settlement_id") references "stripe_settlement" ("id") on update cascade on delete cascade;`)

    this.addSql(`create table if not exists "stripe_adjustment" ("id" text not null, "account_id" text not null, "type" text check ("type" in ('subscription', 'extra_invoice', 'extra_credit')) not null, "amount" numeric not null, "raw_amount" jsonb not null, "currency_code" text not null, "reason" text null, "created_by" text null, "status" text check ("status" in (${PAYOUT_STATUSES})) not null default 'pending', "status_reason" text null, "provider_transfer_id" text null, "data" jsonb null, ${TIMESTAMPS}, constraint "stripe_adjustment_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_adjustment_account_id_status" ON "stripe_adjustment" ("account_id", "status") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_adjustment_deleted_at" ON "stripe_adjustment" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "stripe_adjustment" cascade;`)
    this.addSql(`drop table if exists "stripe_settlement_line" cascade;`)
    this.addSql(`drop table if exists "stripe_settlement" cascade;`)
    this.addSql(`drop table if exists "connector_notification" cascade;`)
    this.addSql(`drop table if exists "connector_job_run" cascade;`)
    this.addSql(`drop table if exists "connector_checkpoint" cascade;`)
  }
}
