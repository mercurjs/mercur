# CLAUDE.md -- Quick Reference for Claude Code

## Required Reading

@docs/PRODUCT.md
@docs/ARCHITECTURE.md

## Project Overview

Mercur.js is open source marketplace platform repository built using Medusa.js + Typescript + React. It adds a marketplace layer on top of Medusa.js. This repository is designed for long-running coding-agent work. The goal is not to maximize raw code output. The goal is to leave the repo in a state where the next session can continue without guessing.

## Build & Run

```bash
bun install        # Install dependencies
bun run lint      # Type-check without emitting
bun run build      # Compile all packages
bun run dev        # Build + launch api, admin + vendor panels
bun run test:integration:tests       # Run integration tests
```

## Project Structure

- `packages/core` - Medusa.js plugin with core marketplace logic
- `packages/cli` - Mercur CLI
- `packages/client` - Type-safe fetch wrapper for the Mercur API
- `packages/types` - Shared TypeScript type definitions
- `packages/dashboard-sdk` - Vite plugin and types for extending admin/vendor panels
- `packages/dashboard-shared` - Shared dashboard primitives consumed by admin + vendor
- `packages/admin` - Admin panel UI package
- `packages/vendor` - Vendor panel UI package
- `packages/registry` - Private workspace for the Mercur blocks registry
- `packages/providers/payout-stripe-connect` - Stripe Connect payout provider
- `apps/api` - Starter Medusa server wired to `@mercurjs/core`
- `apps/admin-test` - Starter admin Vite app (port 7000)
- `apps/vendor` - Starter vendor Vite app (port 7001)
- `apps/docs` - Documentation site (Mintlify)
- `integration-tests` - Cross-package Jest integration suites

## Commands

- ALWAYS use `bun` (never npm, yarn, or pnpm)
- NEVER run `bun run test:integration:http` (runs all packages). Use `bun run test:integration:http -- <pattern>`

## Writing Code

- NEVER use `any`.

## Testing

- Tests use Jest;
- Use `medusaIntegrationTestRunner` from `@medusajs/test-utils`.
- Helpers for creating admin users, sellers, customers are in the `integration-tests/helpers`
- Tests are splitted by different endpoint groups: `admin`, `vendor`, `store`. Example: `http/product/vendor/product.spec.ts`, `http/product/admin/product.spec.ts`.

## Important Development Notes

- Bug fixes and new features MUST include tests
- For bug fixes: if the issue is reproducible in a test, write a failing test first, then implement the fix
- Ensure `bun run build` passes before finishing
- DO NOT COMMIT unless the user explicitly asks
- Conventional Commits: `feat(scope):`, `fix(scope):`, `docs:`, `chore:`. Use `!` for breaking changes (e.g. `feat(auth)!:`)
- PRs target `canary`

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd`.
2. Read `claude-progress.md` for the latest verified state and next step.
3. Read `feature_list.json` and choose the highest-priority unfinished feature.
4. Review recent commits with `git log --oneline -5`.
5. Run the end-to-end verification before starting new work.

If baseline verification is already failing, fix that first. Do not stack new
feature work on top of a broken starting state.

## Working Rules

- Work on one feature at a time.
- Do not mark a feature complete just because code was added.
- Keep changes within the selected feature scope unless a blocker forces a
  narrow supporting fix.
- Do not silently change verification rules during implementation.
- Prefer durable repo artifacts over chat summaries.

## Required Artifacts

- `feature_list.json`: source of truth for feature state (see schema below)
- `claude-progress.md`: session log and current verified status
- `session-handoff.md`: optional compact handoff for larger sessions

### `feature_list.json`

The feature tracker. A machine-readable list of every feature the agent needs
to implement, along with its status, verification steps, and evidence.

**How to use it:**

1. Lives at the project root.
2. Each feature entry has the following fields:
   - `id` — short unique identifier
   - `priority` — integer, lower = higher priority
   - `area` — which part of the app (e.g. `"chat"`, `"import"`, `"search"`)
   - `title` — short description
   - `user_visible_behavior` — what the user should see when it works
   - `status` — one of `not_started`, `in_progress`, `blocked`, `passing`
   - `verification` — step-by-step instructions to confirm it works
   - `evidence` — recorded proof that verification passed (filled in by the agent)
   - `notes` — any extra context

**Status rules:**

- `not_started` — hasn't been touched
- `in_progress` — the one feature currently being worked on (only one at a time)
- `blocked` — can't proceed due to a documented issue
- `passing` — verification passed and evidence is recorded

The agent must only have one feature `in_progress` at a time.

## Definition Of Done

A feature is done only when all of the following are true:

- the target behavior is implemented
- the required verification actually ran
- evidence is recorded in `feature_list.json` or `claude-progress.md`
- the repository remains restartable from the standard startup path

## End Of Session

Before ending a session:

1. Update `claude-progress.md`.
2. Update `feature_list.json`.
3. Record any unresolved risk or blocker.
4. Commit with a descriptive message once the work is in a safe state.
5. Leave the repo clean enough for the next session
