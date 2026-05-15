# Claude Progress -- Mercur.js

## Current Verified State

- **Repository root**: `/Users/viktorholik/Desktop/mercur`
- **Current branch**: `canary` (up to date with `origin/canary`)
- **Current version**: `2.1.2-canary.5`
- **Standard startup path**: `bun install && bun run dev`
- **Standard verification path**: `bun run build`, `bun run lint` (oxlint), `bun run test:integration:http -- <pattern>`
- **Highest priority unfinished work**: finalize the lint/tooling refactor (oxlint migration, template-sync removal, meilisearch test removal) currently staged in the working tree, then verify and commit.
- **Current blocker**: none -- working tree has uncommitted refactor (see Session 2 below) that has not yet been verified end-to-end.

## Session Log

### Session 1: 2026-05-11 -- i18n coverage and onboarding extensibility (#919)

**Goal**: Close i18n gaps in admin + vendor, and make seller onboarding extensible.

#### Completed

- Expanded vendor `pl.json` (+425 lines) and `en.json` translation catalogs; updated translation `$schema.json`.
- Added i18n for order fulfillment, payment, summary sections, payouts, and product create/edit flows in `packages/vendor`.
- Made onboarding wizard extensible via `useOnboarding` hook and new dashboard-sdk types/plugin hook.
- Tightened admin + vendor seller validators (`packages/core/src/api/admin/sellers/validators.ts`, `packages/core/src/api/vendor/sellers/validators.ts`).
- Adjusted shared dashboard components: `country-select`, `data-grid-toggleable-number-cell`, payout columns/filters.
- Bumped dashboard-sdk, dashboard-shared, payout-stripe-connect, types, vendor packages.
- 69 files changed, +1673 / -277.

#### Verification

- Merged via PR #919 onto `canary` (commit `a15dc78f`).

### Session 2: 2026-05-12 -- canary patch fixes (canary.1 -> canary.5)

**Goal**: Ship a series of small fixes on top of the i18n PR for the canary.2 -> canary.5 releases.

#### Completed

- `b77c9ce9` fix(vendor): improve PL translations for order statuses and columns.
- `e886d5bd` fix(vendor): correct thumbnail size in order summary.
- `89370c1f` fix(admin): improve PL translations for order statuses and columns.
- `c4912156` fix(vendor): translate commission label in order summary.
- `3c4e9ac5` fix(dashboard-sdk): dedupe `i18next` and `react` in vite `resolve` to fix duplicate-instance hook errors.
- Cut version bumps: `2.1.2-canary.1` -> `2.1.2-canary.5` (chore commits `bfac174c`, `b93fa95c`, `706321fc`, `a005f1c2`, `19779278`).

#### Verification

- Each fix shipped as its own commit on `canary`. No regression report from downstream consumers as of 2026-05-15.

#### Known risks

- The dashboard-sdk dedupe fix changes Vite resolve config -- consumers with custom `vite.config` may need to merge the new resolve aliases when upgrading.

### Session 3: 2026-05-15 (in progress) -- Tooling + repo cleanup

**Goal**: Replace ESLint with oxlint, drop unused tooling/docs/tests, and rewrite CLAUDE.md as a quick-reference doc.

#### Completed (uncommitted)

- Root `package.json`: replaced `eslint` script with `oxlint`; replaced `turbo run test:integration:http` wrapper with a direct call into `integration-tests`; added `oxlint ^1.64.0`; dropped `format` and `check-types` root scripts.
- Added `.oxlintrc.json` at repo root with `typescript`, `react`, `import`, `jsx-a11y` plugins and `correctness=error / suspicious=warn / perf=warn` categories. Disabled `react/react-in-jsx-scope` (obsolete under React 17+ automatic JSX runtime).
- Switched `packages/admin/package.json` and `apps/admin-test/package.json` `lint` scripts from `eslint` to `oxlint`.
- `turbo.json`: `build` outputs now `dist/**` and `.medusa/**` (was `.next/**`); `dev` now depends on `^build`.
- Deleted unused docs: `docs/seller.md`, `docs/seller-members.md`, `docs/subscriptions.md`.
- Deleted unused tooling: `tools/template-sync/check.ts`, `tools/template-sync/config.ts`.
- Removed dead integration tests + middleware: `integration-tests/src/api/admin/meilisearch/route.ts`, `integration-tests/src/api/store/meilisearch/products/search/route.ts`, `integration-tests/src/api/middlewares.ts`; removed `test:integration:meilisearch` script from `integration-tests/package.json`.
- Deleted `AGENTS.md`.
- Rewrote `CLAUDE.md` (~284 -> ~101 lines) as a quick-reference for Claude Code with build/run commands, project structure, working rules, and the standard startup/verification path.
- Added new docs: `docs/ARCHITECTURE.md` (system + layer diagram of the Mercur plugin on top of Medusa), `docs/PRODUCT.md` (product description + audiences + feature list), `packages/core/ARCHITECTURE.md` (core plugin internals).
- `bun.lock` updated to reflect oxlint addition and eslint drop.

#### Verification run

- `bunx oxlint --quiet` (2026-05-15): **0 errors, 1190 warnings** across 4390 files (152 rules, 961ms).
- Still outstanding before this session can be considered done:
  - `bun install` after the lockfile change.
  - `bun run build` across all packages -- confirm the `turbo.json` output path change does not break caching.
  - `bun run test:integration:http -- <pattern>` on at least one suite to confirm the meilisearch test removal did not leave dangling references.
  - Triage the 1190 warnings (`suspicious` + `perf` + style) -- decide which to fix vs. silence in `.oxlintrc.json`.

#### Evidence recorded

- `git status` shows: 17 modified/deleted files + 4 new files (`.oxlintrc.json`, `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `packages/core/ARCHITECTURE.md`).
- `git diff --stat HEAD`: 19 files changed, +138 / -1040.

#### Known risks

- **Lint coverage gap**: oxlint does not implement every ESLint rule. Some violations previously caught (e.g. custom plugin rules) may silently pass now. Spot-check the diff against prior `eslint --max-warnings 0` baseline.
- **Turbo cache invalidation**: changing `build.outputs` from `.next/**` to `dist/**, .medusa/**` will invalidate every package's build cache on first run after merge -- expect a slow first CI build.
- **`dev` now depends on `^build`**: this means `bun run dev` will block on upstream builds. Acceptable for the dashboard-sdk dedupe fix to work, but watch DX impact.
- **Removed docs are not yet replaced**: the seller/seller-members/subscriptions pages were deleted but no replacement entry was added to the docs index -- confirm `apps/docs` navigation no longer references them before publishing.

#### Next best action

1. `bun install` to refresh the lockfile cleanly.
2. Triage the 1190 oxlint warnings -- decide bulk-fix (`bunx oxlint --fix`) vs. silencing categories in `.oxlintrc.json`.
3. `bun run build` end-to-end.
4. Run one integration-test suite (e.g. `bun run test:integration:http -- product`) to confirm Jest config still resolves after the meilisearch deletions.
5. Verify `apps/docs/docs.json` does not reference the three deleted markdown files.
6. Once green, commit as one logical change set (suggested: `chore(repo): migrate from eslint to oxlint and drop unused tooling`) plus a separate docs commit for the new ARCHITECTURE/PRODUCT pages.

## Required Artifacts (status)

- `claude-progress.md` -- this file (created 2026-05-15).
- `feature_list.json` -- **not present**. Mercur tracks work via GitHub PRs / issues rather than a feature_list.json; if a feature-tracking JSON is desired for agent work, create one in a future session.
- `session-handoff.md` -- not present; not yet needed.

## Definition Of Done (reminder)

A change is done only when:

- target behavior is implemented
- `bun run build` and `bun run lint` pass
- a relevant integration test was run (for behavior changes)
- evidence is recorded in this file
- the repo remains restartable from `bun install && bun run dev`
