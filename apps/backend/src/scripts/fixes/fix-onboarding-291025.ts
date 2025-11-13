import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * IMPORTANT: Use this script only if you are affected by the issue described below.
 *
 *
 * This script fixes the "onboarding" table from "payout" module, which may be accidentally dropped by a migration.
 * The table may be missing, if the database was set up using affected Mercur versions: 1.3.0, 1.4.0
 *
 * Place this script in your backend project's src/scripts/fixes directory, and run it with:
 * ```
 * npx medusa exec ./src/scripts/fixes/fix-onboarding-291025.ts
 * ```
 */

export default async function fixOnboardingTable291025({
  container
}: ExecArgs) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  await pg.raw(
    `create table if not exists "onboarding" ("id" text not null, "data" jsonb null, "context" jsonb null, "payout_account_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "onboarding_pkey" primary key ("id"));`
  )
  await pg.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_onboarding_payout_account_id_unique" ON "onboarding" (payout_account_id) WHERE deleted_at IS NULL;`
  )
  await pg.raw(
    `CREATE INDEX IF NOT EXISTS "IDX_onboarding_deleted_at" ON "onboarding" (deleted_at) WHERE deleted_at IS NULL;`
  )
  await pg.raw(
    `alter table if exists "onboarding" add constraint "onboarding_payout_account_id_foreign" foreign key ("payout_account_id") references "payout_account" ("id") on update cascade;`
  )
}
