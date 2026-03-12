---
name: compound-components-migration
description: Plan, implement, and review admin page migrations to Compound Components and TabbedForm with strict regression prevention. Use when writing or reviewing migration code in packages/admin — loading/error gating, keyboard submit paths, dynamic tab visibility, context typing, dead abstraction APIs.
---

# Compound Components Migration (Implementation + Review)

Use this skill when:
- migrating admin pages/forms to `Object.assign(Root, { ... })`
- migrating detail pages (no context — data passed as props from Root to sections)
- migrating manual tab flows to `TabbedForm`
- reviewing diffs from Codex/Claude/other LLMs for migration regressions

Primary goal: prevent behavioral regressions while improving composability.

Read next (as needed):
- `references/reference-implementations.md` for verified correct implementations — **start here** when coding
- `references/review-checklist.md` for implementation + review checklist
- `references/common-regressions.md` for known failure modes from this repo

## Modes

- **Implementation mode (default)**: you are writing migration code.
- **Review mode**: you are reviewing someone else's diff.

Start in implementation mode unless the user explicitly asks only for review.

## Workflow (implementation mode)

1. Identify migration type:
   - list page (compound only)
   - detail page (compound only — no context, data as props)
   - tabbed form (`TabbedForm`)
2. Read `references/reference-implementations.md` — find the matching pattern and use it as template. Check vendor reference for correct naming/structure conventions (Page suffix, Main/Sidebar prefix, nested header compounds, no context/Layout).
3. Open repo migration source of truth: `packages/admin/COMPOUND_COMPONENTS_MIGRATION.md`
4. Implement in small steps, preserving behavior after each step:
   - component API / `Root` + `Children.count`
   - sections accept data as props (no context/provider)
   - tab abstraction migration (`TabbedForm`, `defineTabMeta`, `validationFields`)
   - dynamic tab visibility (`isVisible`) behavior
   - submit/keyboard guards + async gating
5. Run a self-check against `references/review-checklist.md` before finalizing.
6. If possible, run targeted tests or at least manual smoke checks for keyboard and dynamic tabs.

## Workflow (review mode)

1. Review `git diff --cached` and `git diff` separately (staged vs unstaged).
2. Identify migration type:
   - list page (compound only)
   - detail page (compound only — no context, data as props)
   - tabbed form (`TabbedForm`)
3. Check regression hotspots first (before style):
   - loading / error / ready gating moved or removed
   - keyboard submit paths (`Enter`, `Ctrl/Cmd+Enter`)
   - dynamic tabs (`isVisible`) + active tab state
   - validation scope (`validationFields`)
   - prop typing (`any`, `Record<string, any>`)
4. Only after behavior is safe, review API ergonomics:
   - no Layout wrapper (TwoColumnPage inlined in Root)
   - no context/provider (data as props)
   - exported subcomponents shape
5. Recommend tests for new behavior (especially keyboard + dynamic tabs).

## Hard Rules (DO NOT)

1. Do NOT move fetches into child components without preserving `isPending/isError/ready` behavior.
2. Do NOT trust button `disabled/isLoading` alone to block submit; keyboard shortcuts can bypass UI.
3. Do NOT add metadata APIs (`_tabMeta`, `validationFields`) unless runtime logic uses them.
4. Do NOT assume tabs are static if `isVisible` exists.
5. Do NOT introduce `any` in prop types.
6. Do NOT create context/provider for detail pages — pass data as props from Root to sections (vendor standard).
7. Do NOT widen per-tab validation to full-form validation unless explicitly intended.
8. Do NOT merge a `TabbedForm` migration without verifying keyboard submit behavior.
9. Do NOT move query hooks into nested tabs/sections unless submit normalization is still safe when queries are pending.
10. Do NOT use render props for overridable sections — use nested compound components with `Children.count` override at each granularity level.
11. Do NOT forget `Main`/`Sidebar` prefix on detail page section slot names (e.g., `MainGeneralSection`, `SidebarCustomerSection`).
12. Do NOT forget `Page` suffix on compound root names (`XxxDetailPage`, not `XxxDetail`).
13. Do NOT forget to add new CC pages to `src/pages/index.ts` export barrel.
14. Do NOT use `Record<string, any>` for prop types — always use `HttpTypes.AdminXxx`.
15. Do NOT create a separate `Layout` wrapper in detail pages — inline `TwoColumnPage` directly in Root.
16. Do NOT use raw `Children.count(children) > 0` as the only switch for detail-page override when nested routes/extensions may inject non-compound children.
17. Do NOT define `:id` detail routes as direct page components when the page has nested routes — use `Component: Outlet` on `:id` and render the detail page at child `path: ""`.
18. DO reuse shared composition guard helper (`src/lib/compound-composition.ts`) instead of ad-hoc local checks.

## Implementation Checklist (must apply while coding)

1. Preserve runtime behavior first, then improve API shape.
2. Add local submit guards for async dependencies used in payload normalization.
3. If tabs are dynamic (`isVisible`), normalize active tab state when visible tab set changes.
4. If introducing `_tabMeta` / `validationFields`, wire runtime behavior in the same patch.
5. Keep prop types typed with domain types (`HttpTypes.*` or explicit alias).
6. No Layout wrapper, no context — sections receive data as props from Root.

## Output Format (review mode)

When asked for review:
- Findings first, ordered by severity (`P1`, `P2`, `P3`)
- Include file + line references
- Briefly list what was verified and what remains untested

When no findings:
- Explicitly say no findings
- Mention residual risks / test gaps

## Output Format (implementation mode)

When delivering a migration/fix:
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

- Source of truth for migration strategy: `packages/admin/COMPOUND_COMPONENTS_MIGRATION.md`
- Hard rules and checklist also in: `packages/admin/CLAUDE.md`
- This repo has already seen regressions in:
  - `regions` loading vs submit payload normalization
  - `Ctrl/Cmd+Enter` bypassing loading state
- hidden active tab causing invalid tab state in `TabbedForm`
- dead `_tabMeta.validationFields` API (metadata declared but not used by runtime)
- duplicate detail page rendering caused by route topology (`:id` direct component) + overly broad children override
