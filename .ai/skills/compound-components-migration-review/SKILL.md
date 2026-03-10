---
name: compound-components-migration
description: Plan, implement, and review admin page migrations to Compound Components and TabbedForm with strict regression prevention (loading/error gating, keyboard submit paths, dynamic tab visibility, context typing, and dead abstraction APIs). Use when writing or reviewing migration code in packages/admin.
---

# Compound Components Migration (Implementation + Review)

Use this skill when:
- migrating admin pages/forms to `Object.assign(Root, { ... })`
- introducing context providers for detail pages
- migrating manual tab flows to `TabbedForm`
- reviewing diffs from Codex, Claude, or other LLMs for migration regressions

Primary goal:
- prevent behavioral regressions while improving composability

Read next (as needed):
- `references/review-checklist.md` for implementation + review checklist
- `references/common-regressions.md` for known failure modes from this repo

## Modes

- **Implementation mode (default)**: you are writing migration code.
- **Review mode**: you are reviewing someone else's diff.

Start in implementation mode unless the user explicitly asks only for review.

## Workflow (implementation mode)

1. Identify migration type:
- list page (compound only)
- detail page (compound + context)
- tabbed form (`TabbedForm`)
2. Open repo migration source of truth:
- `packages/admin/COMPOUND_COMPONENTS_MIGRATION.md`
3. Find a reference implementation (prefer vendor equivalent) before editing.
4. Implement in small steps, preserving behavior after each step:
- component API / `Root` + `Children.count`
- provider/context boundary (detail pages)
- tab abstraction migration (`TabbedForm`, `_tabMeta`, `validationFields`)
- dynamic tab visibility (`isVisible`) behavior
- submit/keyboard guards + async gating
5. Run a self-check against `references/review-checklist.md` before finalizing.
6. If possible, run targeted tests or at least manual smoke checks for keyboard and dynamic tabs.

## Workflow (review mode)

1. Review `git diff --cached` and `git diff` separately (staged vs unstaged).
2. Identify migration type:
- list page (compound only)
- detail page (compound + context)
- tabbed form (`TabbedForm`)
3. Check regression hotspots first (before style):
- loading / error / ready gating moved or removed
- keyboard submit paths (`Enter`, `Ctrl/Cmd+Enter`)
- dynamic tabs (`isVisible`) + active tab state
- validation scope (`validationFields`)
- context typing (`any`, `Record<string, any>`)
4. Only after behavior is safe, review API ergonomics:
- canonical layout wrapper (`Layout`)
- exported subcomponents shape
- context hook boundaries
5. Recommend tests for new behavior (especially keyboard + dynamic tabs).

## Hard Rules (DO NOT)

1. Do not move fetches into child components without preserving `isPending/isError/ready` behavior.
2. Do not trust button `disabled/isLoading` alone to block submit; keyboard shortcuts can bypass UI.
3. Do not add metadata APIs (`_tabMeta`, `validationFields`) unless runtime logic uses them.
4. Do not assume tabs are static if `isVisible` exists.
5. Do not introduce `any` in context/provider types.
6. Do not export compound subcomponents without a safe wrapper when composition requires provider/layout.
7. Do not widen per-tab validation to full-form validation unless explicitly intended.
8. Do not merge a `TabbedForm` migration without verifying keyboard submit behavior.
9. Do not move query hooks into nested tabs/sections unless submit normalization is still safe when queries are pending.
10. Do not use generic `Children.count(children) > 0` as the only override switch for detail pages that can receive nested route/extension children.
11. Do not keep detail route as direct `:id -> Component: DetailPage` when nested routes exist; use `:id -> Component: Outlet` and `path: "" -> DetailPage`.
12. Do reuse shared composition-guard helper (`src/lib/compound-composition.ts`) instead of copy-pasted local implementations.

## Implementation Checklist (must apply while coding)

1. Preserve runtime behavior first, then improve API shape.
2. Add local submit guards for async dependencies used in payload normalization.
3. If tabs are dynamic (`isVisible`), normalize active tab state when visible tab set changes.
4. If introducing `_tabMeta` / `validationFields`, wire runtime behavior in the same patch.
5. Keep context/provider typed with domain types (`HttpTypes.*` or explicit alias).
6. Export a canonical composition wrapper (`Layout`/`Page`) when subcomponents need provider/layout context.

## Output Format (review mode)

When asked for review:
- Findings first, ordered by severity (`P1`, `P2`, `P3`)
- Include file + line references
- Briefly list what was verified and what remains untested

When no findings:
- Explicitly say no findings
- Mention residual risks / test gaps

## Output Format (implementation mode)

When delivering a migration or fix:
- Summarize what behavior was preserved (especially async gating, keyboard submit, dynamic tabs)
- List files changed
- Mention tests run or not run
- Call out residual risks if behavior was not verified

## Implementation Guidance (when fixing)

Prefer minimal patches that:
- restore previous behavioral guarantees first
- keep new compound API shape intact if possible
- add local guards in submit handlers for critical async dependencies
- add state normalization when dynamic tabs change visibility

## Repo-specific Notes

- Source of truth for migration strategy:
  `packages/admin/COMPOUND_COMPONENTS_MIGRATION.md`
- This repo has already seen regressions in:
- `regions` loading vs submit payload normalization
- `Ctrl/Cmd+Enter` bypassing loading state
- hidden active tab causing invalid tab state in `TabbedForm`
- dead `_tabMeta.validationFields` API (metadata declared but not used by runtime)
- duplicate detail screen rendering due to route topology + broad children override
