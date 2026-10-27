import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261027180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_provider_account_id";`)
    this.addSql(`alter table if exists "payout_account" rename column "provider_account_id" to "external_id";`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_external_id" ON "payout_account" ("external_id") WHERE deleted_at IS NULL AND external_id IS NOT NULL;`)
    this.addSql(`alter table if exists "payout_account" drop column if exists "requirements";`)

    this.addSql(`update "payout" set "data" = coalesce("data", '{}'::jsonb) || jsonb_build_object('provider', coalesce("data"->'provider', '{}'::jsonb) || jsonb_build_object('id', "provider_payout_id")) where "provider_payout_id" is not null;`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_provider_payout_id";`)
    this.addSql(`alter table if exists "payout" drop column if exists "provider_payout_id";`)

    this.addSql(`update "payout_reversal" set "data" = coalesce("data", '{}'::jsonb) || jsonb_build_object('provider', coalesce("data"->'provider', '{}'::jsonb) || jsonb_build_object('id', "provider_reversal_id")) where "provider_reversal_id" is not null;`)
    this.addSql(`alter table if exists "payout_reversal" drop column if exists "provider_reversal_id";`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "payout_reversal" add column if not exists "provider_reversal_id" text null;`)
    this.addSql(`update "payout_reversal" set "provider_reversal_id" = "data"->'provider'->>'id' where "data"->'provider'->>'id' is not null;`)

    this.addSql(`alter table if exists "payout" add column if not exists "provider_payout_id" text null;`)
    this.addSql(`update "payout" set "provider_payout_id" = "data"->'provider'->>'id' where "data"->'provider'->>'id' is not null;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payout_provider_payout_id" ON "payout" ("provider_payout_id") WHERE deleted_at IS NULL AND provider_payout_id IS NOT NULL;`)

    this.addSql(`alter table if exists "payout_account" add column if not exists "requirements" jsonb null;`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_payout_account_external_id";`)
    this.addSql(`alter table if exists "payout_account" rename column "external_id" to "provider_account_id";`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_account_provider_account_id" ON "payout_account" ("provider_account_id") WHERE deleted_at IS NULL AND provider_account_id IS NOT NULL;`)
  }
}
