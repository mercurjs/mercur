import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261028120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_settlement_id_foreign";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_settlement_id";`)
    this.addSql(`alter table if exists "payout" drop column if exists "settlement_id";`)
    this.addSql(`alter table if exists "payout_account" drop column if exists "provider_id", drop column if exists "ignored", drop column if exists "requirements";`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_provider_account_id";`)
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payout_account' AND column_name = 'provider_account_id') THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payout_account' AND column_name = 'external_id') THEN
            UPDATE "payout_account" SET "external_id" = "provider_account_id" WHERE "external_id" IS NULL;
            ALTER TABLE "payout_account" DROP COLUMN "provider_account_id";
          ELSE
            ALTER TABLE "payout_account" RENAME COLUMN "provider_account_id" TO "external_id";
          END IF;
        END IF;
      END $$;
    `)
    this.addSql(`alter table if exists "payout_account" add column if not exists "external_id" text null, add column if not exists "kyc_status" text check ("kyc_status" in ('pending_submission', 'pending_approval', 'approved', 'refused')) null, add column if not exists "payouts_enabled" boolean not null default false, add column if not exists "charges_enabled" boolean not null default false, add column if not exists "details_submitted" boolean not null default false, add column if not exists "disabled_reason" text null, add column if not exists "onboarding_token" text null, add column if not exists "onboarding_token_issued_at" timestamptz null, add column if not exists "last_synced_at" timestamptz null;`)
    this.addSql(`update "payout_account" set "external_id" = "data"->>'id' where "external_id" is null and "data"->>'id' is not null;`)
    this.addSql(`update "payout_account" set "payouts_enabled" = true, "charges_enabled" = true, "details_submitted" = true where "status" = 'active' and "last_synced_at" is null;`)
    this.addSql(`update "payout_account" set "onboarding_token_issued_at" = now() where "onboarding_token" is not null and "onboarding_token_issued_at" is null;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_external_id" ON "payout_account" ("external_id") WHERE deleted_at IS NULL AND external_id IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_onboarding_token" ON "payout_account" ("onboarding_token") WHERE deleted_at IS NULL AND onboarding_token IS NOT NULL;`)

    this.addSql(`alter table if exists "payout" add column if not exists "order_id" text null, add column if not exists "status_reason" text null, add column if not exists "metadata" jsonb null;`)
    // Payouts created before order_id existed kept the Stripe transfer as data,
    // with the order id as its transfer_group. Several rows could carry the same
    // transfer for one order, so only the oldest gets the order id.
    this.addSql(`
      with derived as (
        select "id", coalesce("data"->>'order_id', "data"->>'transfer_group', "data"->'metadata'->>'order_id') as "derived_order_id",
          row_number() over (partition by coalesce("data"->>'order_id', "data"->>'transfer_group', "data"->'metadata'->>'order_id') order by "created_at") as "position"
        from "payout"
        where "order_id" is null and "deleted_at" is null
      )
      update "payout" set "order_id" = derived."derived_order_id"
      from derived
      where "payout"."id" = derived."id"
        and derived."derived_order_id" is not null
        and derived."position" = 1
        and not exists (select 1 from "payout" taken where taken."order_id" = derived."derived_order_id" and taken."deleted_at" is null);
    `)
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payout' AND column_name = 'provider_payout_id') THEN
          EXECUTE 'UPDATE "payout" SET "data" = coalesce("data", ''{}''::jsonb) || jsonb_build_object(''provider'', coalesce("data"->''provider'', ''{}''::jsonb) || jsonb_build_object(''id'', "provider_payout_id")) WHERE "provider_payout_id" IS NOT NULL';
        END IF;
      END $$;
    `)
    this.addSql(`update "payout" set "data" = "data" || jsonb_build_object('provider', jsonb_build_object('id', "data"->>'id')) where "data"->'provider' is null and "data"->>'id' is not null;`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_provider_payout_id";`)
    this.addSql(`alter table if exists "payout" drop column if exists "provider_payout_id";`)
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_status_check";`)
    this.addSql(`update "payout" set "status" = 'aborted' where "status" = 'canceled';`)
    this.addSql(`alter table if exists "payout" add constraint "payout_status_check" check ("status" in ('pending', 'on_hold', 'processing', 'paid', 'failed', 'aborted'));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_order_id" ON "payout" ("order_id") WHERE deleted_at IS NULL AND order_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_account_id_created_at" ON "payout" ("account_id", "created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_status_created_at" ON "payout" ("status", "created_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "payout_reversal" ("id" text not null, "refund_id" text null, "amount" numeric not null, "raw_amount" jsonb not null, "status" text check ("status" in ('pending', 'on_hold', 'processing', 'paid', 'failed', 'aborted')) not null default 'pending', "status_reason" text null, "data" jsonb null, "payout_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payout_reversal_pkey" primary key ("id"));`)
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'payout_reversal' AND column_name = 'provider_reversal_id') THEN
          EXECUTE 'UPDATE "payout_reversal" SET "data" = coalesce("data", ''{}''::jsonb) || jsonb_build_object(''provider'', coalesce("data"->''provider'', ''{}''::jsonb) || jsonb_build_object(''id'', "provider_reversal_id")) WHERE "provider_reversal_id" IS NOT NULL';
        END IF;
      END $$;
    `)
    this.addSql(`alter table if exists "payout_reversal" drop column if exists "provider_reversal_id";`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_reversal_deleted_at" ON "payout_reversal" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_reversal_payout_id" ON "payout_reversal" ("payout_id") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_reversal_refund_id" ON "payout_reversal" ("refund_id") WHERE deleted_at IS NULL AND refund_id IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_reversal_status_created_at" ON "payout_reversal" ("status", "created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`alter table if exists "payout_reversal" drop constraint if exists "payout_reversal_payout_id_foreign";`)
    this.addSql(`alter table if exists "payout_reversal" add constraint "payout_reversal_payout_id_foreign" foreign key ("payout_id") references "payout" ("id") on update cascade on delete cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payout_reversal" cascade;`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_order_id";`)
    this.addSql(`alter table if exists "payout" drop constraint if exists "payout_status_check";`)
    this.addSql(`update "payout" set "status" = 'canceled' where "status" = 'aborted';`)
    this.addSql(`update "payout" set "status" = 'pending' where "status" = 'on_hold';`)
    this.addSql(`alter table if exists "payout" add constraint "payout_status_check" check ("status" in ('pending', 'processing', 'paid', 'failed', 'canceled'));`)
    this.addSql(`alter table if exists "payout" drop column if exists "order_id", drop column if exists "status_reason", drop column if exists "metadata";`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_external_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_onboarding_token";`)
    this.addSql(`alter table if exists "payout_account" drop column if exists "external_id", drop column if exists "kyc_status", drop column if exists "payouts_enabled", drop column if exists "charges_enabled", drop column if exists "details_submitted", drop column if exists "disabled_reason", drop column if exists "onboarding_token", drop column if exists "onboarding_token_issued_at", drop column if exists "last_synced_at";`)
  }
}
