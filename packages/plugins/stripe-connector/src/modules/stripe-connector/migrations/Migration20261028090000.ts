import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261028090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "stripe_capture" ("id" text not null, "order_group_id" text not null, "payment_collection_id" text not null, "payment_id" text not null, "currency_code" text not null, "authorized_amount" numeric not null, "raw_authorized_amount" jsonb not null, "capturable_amount" numeric not null, "raw_capturable_amount" jsonb not null, "orders_total" integer not null default 0, "orders_decided" integer not null default 0, "status" text check ("status" in ('pending', 'ready', 'cancelable', 'captured', 'canceled', 'expired', 'failed')) not null default 'pending', "status_reason" text null, "authorized_at" timestamptz null, "expires_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stripe_capture_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_capture_deleted_at" ON "stripe_capture" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_capture_order_group_id" ON "stripe_capture" ("order_group_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_capture_status_expires_at" ON "stripe_capture" ("status", "expires_at") WHERE deleted_at IS NULL;`)

    this.addSql(`alter table if exists "stripe_settlement_line" add column if not exists "payout_id" text null, add column if not exists "payout_reversal_id" text null, add column if not exists "adjustment_id" text null;`)
    this.addSql(`update "stripe_settlement_line" set "payout_id" = "source_id" where "type" = 'payout' and "payout_id" is null;`)
    this.addSql(`update "stripe_settlement_line" set "payout_reversal_id" = "source_id" where "type" = 'reversal' and "payout_reversal_id" is null;`)
    this.addSql(`update "stripe_settlement_line" set "adjustment_id" = "source_id" where "type" in ('adjustment_credit', 'adjustment_debit') and "adjustment_id" is null;`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_stripe_settlement_line_source_id";`)
    this.addSql(`alter table if exists "stripe_settlement_line" drop column if exists "source_id";`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_settlement_line_payout_id" ON "stripe_settlement_line" ("payout_id") WHERE deleted_at IS NULL AND payout_id IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_settlement_line_payout_reversal_id" ON "stripe_settlement_line" ("payout_reversal_id") WHERE deleted_at IS NULL AND payout_reversal_id IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_settlement_line_adjustment_id" ON "stripe_settlement_line" ("adjustment_id") WHERE deleted_at IS NULL AND adjustment_id IS NOT NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "stripe_settlement_line" add column if not exists "source_id" text null;`)
    this.addSql(`update "stripe_settlement_line" set "source_id" = coalesce("payout_id", "payout_reversal_id", "adjustment_id");`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_stripe_settlement_line_payout_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_stripe_settlement_line_payout_reversal_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_stripe_settlement_line_adjustment_id";`)
    this.addSql(`alter table if exists "stripe_settlement_line" drop column if exists "payout_id", drop column if exists "payout_reversal_id", drop column if exists "adjustment_id";`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_settlement_line_source_id" ON "stripe_settlement_line" ("source_id") WHERE deleted_at IS NULL;`)
    this.addSql(`drop table if exists "stripe_capture" cascade;`)
  }
}
