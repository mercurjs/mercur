---
status: passing
canonical: true
priority: 1
area: core/migrations
created: 2026-05-15
last_updated: 2026-05-15
---

# SPEC-001 Drop Medusa Global Unique Constraints Blocking Multi-Vendor

## User-Visible Behavior

Two or more sellers can create fulfillment sets, shipping profiles, and service
zones with the same name (e.g. "Standard Delivery", "US Domestic") without the
second creation failing with a unique constraint violation.

## Verification

1. Spin up a fresh DB and run all Medusa + Mercur migrations.
2. Run `bunx medusa db:migrate:scripts` from the project (apps/api). Medusa
   auto-discovers every plugin's `<plugin.resolve>/migration-scripts/*.js` and
   tracks executed runs in `script_migrations` so it runs once per project.
   `@mercurjs/core` ships the script under `.medusa/server/src/migration-scripts/`.
3. Verify the three partial unique indexes are gone:
   - `IDX_fulfillment_set_name_unique`
   - `IDX_shipping_profile_name_unique`
   - `IDX_service_zone_name_unique`

   Query:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE indexname IN (
     'IDX_fulfillment_set_name_unique',
     'IDX_shipping_profile_name_unique',
     'IDX_service_zone_name_unique'
   );
   ```
   Must return 0 rows.
4. Integration test: create two sellers, have each create a fulfillment set
   named "Standard Delivery", a shipping profile named "Standard Delivery", and
   a service zone named "US Domestic". Both must succeed. Covered by
   `integration-tests/http/migrations/drop-fulfillment-global-unique-indexes.spec.ts`.
5. Re-running the script must be idempotent (uses `DROP INDEX IF EXISTS`).
   Covered by the same spec.

## Evidence

- **Implemented at:** 2026-05-15
- **Source:** `packages/core/src/migration-scripts/drop-fulfillment-global-unique-indexes.ts`
- **Build artifact:** `packages/core/.medusa/server/src/migration-scripts/drop-fulfillment-global-unique-indexes.js`
  (compiled via `tsc --outDir .medusa/server`).
- **Auto-discovery:** Confirmed in
  `/Users/viktorholik/Desktop/medusa/packages/medusa/src/commands/db/run-scripts.ts:52-55`
  — `scriptsSourcePaths` includes `join(plugin.resolve, "migration-scripts")`
  for every loaded plugin. Plugin `resolve` is `<pkg>/.medusa/server/src/` per
  `/Users/viktorholik/Desktop/medusa/packages/core/utils/src/common/get-resolved-plugins.ts:86`.
  Tracking table is `script_migrations` so each script runs at most once per
  project.
- **Test:** `integration-tests/http/migrations/drop-fulfillment-global-unique-indexes.spec.ts`
- **Test strategy:** Test does not import the migration script directly. It
  instantiates Medusa's `MigrationScriptsMigrator` and points it at
  `<@mercurjs/core>/.medusa/server/src/migration-scripts/` (resolved via
  `require.resolve('@mercurjs/core/package.json')`). That is the same discovery
  path Medusa walks in `db:migrate:scripts`, so the test verifies the script is
  wired in through plugin auto-attach.
- **Test run pending:** Run via
  `bun run test:integration:http -- migrations/drop-fulfillment-global-unique-indexes`
  after `bun run build`. Requires Postgres + Redis.

## Notes

Constraint sources in the Medusa codebase (`/Users/viktorholik/Desktop/medusa`):

- `medusa/packages/modules/fulfillment/src/migrations/Migration20240311145700_InitialSetupMigration.ts:48`
  → `IDX_fulfillment_set_name_unique` on `(name) WHERE deleted_at IS NULL`
- same migration L58 → `IDX_service_zone_name_unique` on `(name) WHERE deleted_at IS NULL`
- same migration L103 → `IDX_shipping_profile_name_unique` on `(name) WHERE deleted_at IS NULL`

Impact: every seller creates these resources during onboarding. Common names
collide on the second seller — day-one blocker for any marketplace with >1
seller. Customers never see these names, so dropping the global uniqueness is
safe.

Implementation:

- `packages/core/src/migration-scripts/drop-fulfillment-global-unique-indexes.ts`
  — single transaction issuing three `DROP INDEX IF EXISTS` statements via the
  `PG_CONNECTION` knex instance.
- No module-install gate is needed: the fulfillment module is always installed
  in a Mercur marketplace, and `DROP INDEX IF EXISTS` no-ops on missing indexes.
- Mounted automatically because Medusa's `db:migrate:scripts` walks
  `join(plugin.resolve, "migration-scripts")` for each plugin — the file lives
  at `packages/core/src/migration-scripts/` and compiles to the corresponding
  location under `.medusa/server/src/`.

Application-layer workaround already used: auto-prefix names with seller
handle/ID. This migration removes the need for that workaround at the DB level.
