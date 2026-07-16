# Claude Progress -- Mercur.js

This is the session log and current-state tracker. Keep it short: prune old
session detail aggressively. The per-spec source of truth lives in
`docs/specs/SPEC-*.md` (status + Evidence) — this file is just the running log.

## Current Verified State

- **Repository root**: `/Users/viktorholik/Desktop/mercur`
- **Current branch**: `main`
- **Current version**: `2.2.0-rc.1`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint),
  `bun run test:integration:http -- <pattern>`
- **Current blocker**: none
- **Active spec**: _(none in progress — pick the highest-priority unfinished
  `docs/specs/SPEC-*.md`)_

## Session Log

Newest first. One entry per session, kept to a few lines: goal, what landed,
how it was verified, what's owed/next. Move durable facts into
`docs/specs/SPEC-*.md` Evidence or into memory — not here.

### Session: 2026-07-15 -- SPEC-025 admin product-approval toggle (#1238)

- **Goal.** Let operators toggle vendor-product approval at runtime from Admin.
- **Landed.**
  - Runtime setting backed by `store.metadata.require_product_approval`;
    new helper `packages/core/src/utils/require-product-approval.ts`
    (store metadata overrides `PRODUCT_REQUEST` flag as fallback).
  - Site A: `resolveRequireProductApprovalStep` + reworked `when` in
    `auto-confirm-product-change.ts` (no longer reads the static flag).
  - Site B: removed the sync `superRefine` flag check from vendor products
    `validators.ts`; enforced in async `vendor/products` POST `route.ts`.
  - Admin UI: `MarketplaceApprovalSection` (SwitchBox → `useUpdateStore`)
    on Settings → Marketplace; i18n keys under `marketplace.productApproval`
    (+ `$schema.json`).
  - Tests: `integration-tests/http/product/vendor/product-approval-setting.spec.ts`
    (both sites, both states).
- **Verified.** `bun run build` passes for all packages (vendor needs
  `NODE_OPTIONS=--max-old-space-size=8192` due to an env JS-heap OOM, not a
  code issue). Integration tests are WRITTEN but NOT yet executed this run
  (need Postgres/Redis): `bun run test:integration:http -- product-approval-setting`.
- **Owed/next.** Run the new integration spec; then flip SPEC-025 to
  `passing` and record evidence. Other locale JSONs not updated (English
  canonical).

### Template

### Session NN: YYYY-MM-DD -- <spec / short title>

- **Goal.** One line.
- **Landed.** Key files/behavior (terse).
- **Verified.** build / lint / test result.
- **Owed / next.** What the next session should pick up.

## Definition Of Done

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
