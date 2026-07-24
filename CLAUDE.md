# CLAUDE.md -- Quick Reference for Claude Code

## Required Reading

@docs/PRODUCT.md
@docs/ARCHITECTURE.md
@docs/UI-ARCHITECTURE.md

## Skills

- **Design → code (Figma)**: when the task is turning a Figma design into dashboard UI code — the user shares a `figma.com` URL, selects a Figma node, or asks to "convert / implement / build this design / screen / mockup" in `packages/admin` or `packages/vendor` — load the `figma-ui` skill at `.claude/skills/figma-ui/SKILL.md` first. It reads the design from the Figma MCP (`get_screenshot` as the source of truth, `get_metadata` for structure) and maps it onto the design-system conventions in its `references/` (`components.md`, `spacing.md`, `patterns.md`) before writing JSX. Gate: `bun run lint` + `bun run build` stay green.

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

## Testing a Worktree

When the user asks to test a worktree (e.g. "test this worktree", "run this worktree", "spin up <worktree-name>"):

1. Run `./scripts/dev-worktree.sh <worktree-name>` in the background (e.g. `./scripts/dev-worktree.sh spec013-cont`).
2. Once the apps are up, return these URLs to the user:
   - API: http://localhost:9000
   - Admin: http://localhost:7000
   - Vendor: http://localhost:7001

## Writing Code

- NEVER use `any`.
- Do NOT generate AI-like comments. Avoid narrating what the code does,
  explaining the obvious, or leaving tutorial-style commentary. Only add a
  comment when it captures genuinely non-obvious intent (a workaround, a gotcha,
  a "why" that the code can't express). Code must read as human-authored.

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
- Create branches following the convention `<type>/<feature>`, where `<type>` matches the Conventional Commit types (`feat`, `fix`, `docs`, `chore`, etc.) and `<feature>` is a short kebab-case description of the work (e.g. `feat/vendor-payouts`, `fix/order-split-rounding`)
- NEVER name branches or worktrees after the coding agent (`claude`, `claude/...`, `codex`, etc.) or with random/auto-generated names. Branch AND worktree names MUST follow the `<type>/<feature>` convention above and describe the actual work
- PRs target `main`
- NEVER mention AI coding assistants (Claude, Claude Code, Codex, Copilot, Cursor, etc.) in commit messages, PR titles, or PR descriptions. No `Co-Authored-By: Claude` trailers, no "Generated with Claude Code" footers, no "🤖" markers. Commits and PRs must read as human-authored.

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd`.
2. Read `claude-progress.md` for the latest verified state and next step.
3. List `docs/specs/` and pick the highest-priority unfinished spec
   (lowest `priority` value, `status` not `passing`).
4. Review recent commits with `git log --oneline -5`.
5. Run the end-to-end verification before starting new work.

If baseline verification is already failing, fix that first. Do not stack new
spec work on top of a broken starting state.

## Working Rules

- Work on one spec at a time.
- Do not mark a spec `passing` just because code was added.
- Keep changes within the selected spec scope unless a blocker forces a
  narrow supporting fix.
- Do not silently change verification rules during implementation.
- Prefer durable repo artifacts over chat summaries.

## Required Artifacts

- `docs/specs/SPEC-*.md`: source of truth for feature/spec state (see schema below)
- `claude-progress.md`: session log and current verified status
- `session-handoff.md`: optional compact handoff for larger sessions

### `docs/specs/SPEC-*.md`

The spec tracker. One Markdown file per spec, each owning a single feature or
scoped product area. Specs replace the old `feature_list.json` and live at
`docs/specs/SPEC-<NNN>-<kebab-slug>.md`.

**How to use it:**

1. Each spec is its own file under `docs/specs/`.
2. Every spec starts with YAML frontmatter and a `# SPEC-<NNN> Title` heading.
3. Frontmatter fields:
   - `status` — one of `not_started`, `in_progress`, `blocked`, `passing`,
     `live` (use `live` for canonical product specs that are an ongoing
     contract rather than a one-shot feature)
   - `canonical` — boolean; `true` if this is the canonical owner of the area
   - `priority` — integer, lower = higher priority (optional for `live` specs)
   - `area` — which part of the app (e.g. `"chat"`, `"import"`, `"search"`)
   - `created` — ISO date (YYYY-MM-DD)
   - `last_updated` — ISO date (YYYY-MM-DD)
4. Required body sections (mirroring the old JSON schema):
   - **User-Visible Behavior** — what the user should see when it works
   - **Verification** — step-by-step instructions to confirm it works
   - **Evidence** — recorded proof that verification passed (filled in by the agent)
   - **Notes** — any extra context

Canonical product specs (e.g. `SPEC-014`) may use a richer body (Product Scope,
User Experience, Endpoint Contracts, etc.) instead of the simple
Verification/Evidence/Notes shape — pick the shape that fits the spec.

**Status rules:**

- `not_started` — hasn't been touched
- `in_progress` — the one spec currently being worked on (only one at a time)
- `blocked` — can't proceed due to a documented issue
- `passing` — verification passed and evidence is recorded
- `live` — canonical, ongoing contract (no terminal "done" state)

The agent must only have one spec `in_progress` at a time.

## Definition Of Done

A spec is done only when all of the following are true:

- the target behavior is implemented
- the required verification actually ran
- all packages are built
- evidence is recorded in the spec file's **Evidence** section (and noted in
  `claude-progress.md` if appropriate)
- the spec's frontmatter `status` is set to `passing` and `last_updated` is bumped
- the repository remains restartable from the standard startup path

## End Of Session

Before ending a session:

1. Update `claude-progress.md`.
2. Update the relevant `docs/specs/SPEC-*.md` files (status, evidence, `last_updated`).
3. Record any unresolved risk or blocker.
4. Commit with a descriptive message once the work is in a safe state.
5. Leave the repo clean enough for the next session
