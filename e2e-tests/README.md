# @mercurjs/e2e-tests

## What it does

On `bun run e2e`, Playwright's `global-setup.ts` boots a full stack:

1. **DB** — a random-named Postgres database is created from the `DB_*` vars in
   `.env.test`, migrated (`medusa db:migrate`) with core migrations + links.
2. **Medusa** — started in-process via `@medusajs/test-utils` `startApp` on a
   random port; the returned container is used to **seed** a known admin + seller.
3. **Admin + Vendor** — each booted programmatically with Vite's JS API
   (`createServer`) on random ports, pointed at the Medusa URL.

The live URLs are written to `.stack.json`; journeys read them via
`journeys/fixtures.ts`. `global-teardown.ts` shuts all three down and drops the DB.

## Commands

```bash
bun install                 # from repo root
cd e2e-tests
bun run e2e:install         # one-time: playwright chromium
bun run e2e                 # boot stack + run journeys
bun run e2e:ui              # interactive Playwright UI
```

Requires a local Postgres reachable at the `.env.test` `DB_*` connection.