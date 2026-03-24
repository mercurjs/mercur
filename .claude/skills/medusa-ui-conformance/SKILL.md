---
name: medusa-ui-conformance
description: Keep custom admin and vendor UI aligned with @medusajs/ui and Radix UI. Use when adding or modifying reusable UI, page-level interaction patterns, overlays, menus, form primitives, or any custom component in Mercur dashboards.
---

# Medusa UI Conformance

Use this skill when:
- adding new custom UI in `packages/admin` or `packages/vendor`
- modifying reusable UI components or local wrappers
- introducing dropdowns, dialogs, drawers, tabs, accordions, tooltips, popovers, selects, or other interactive primitives
- deciding whether a new UI need should use an existing component, a wrapper, or a new primitive-based component

This skill is the system-level gate for Mercur dashboard UI.

Apply this decision order:
1. use an existing local wrapper or established package pattern
2. use `@medusajs/ui`
3. compose with `@medusajs/ui` plus existing local wrappers
4. use `Radix UI` primitives only if the previous options do not cover the interaction
5. build a new reusable local component only when the UI gap is real and reusable

## First checks

Before writing custom UI, check:
- whether the same pattern already exists in `components/common`, `components/layout`, `components/modals`, or page-local shared components
- whether `@medusajs/ui` already provides the needed primitive or pattern
- whether the task is really page/form/tab work and should also load `admin-page-ui`, `admin-form-ui`, or `admin-tab-ui`

## Hard rules

1. Do not build a custom dropdown, dialog, drawer, tooltip, popover, select, accordion, tabs, or button if `@medusajs/ui` already covers it.
2. Do not import `radix-ui` or `@radix-ui/*` just because it feels lower-level or more flexible. Use it only when `@medusajs/ui` does not cover the case.
3. Do not add page-local one-off interaction primitives if the pattern is reusable. Put reusable UI in shared components.
4. Do not ship custom interactive UI without keyboard behavior, focus management, and accessible labeling.
5. Do not hardcode visual language outside Mercur and Medusa conventions. Prefer Medusa UI components, tokens, spacing, and composition.
6. Do not use `asChild` with a child component that fails to spread props or forward refs.
7. Do not bypass existing local wrappers such as `Form`, `ActionMenu`, route modal wrappers, or other shared abstractions when they already solve the problem.
8. Do not introduce custom UI copy without i18n and stable `data-testid` coverage for important interaction points.

## Decision tree

### 1. Local wrapper first

Prefer existing Mercur wrappers when the pattern already exists.

Typical examples in this repo:
- `Form` wrappers for field composition and accessibility
- `ActionMenu` for row and section actions
- route-level drawer or modal wrappers
- shared layout primitives such as pages, sections, and empty states

If a local wrapper exists, extend or reuse it instead of rebuilding the interaction from scratch.

### 2. `@medusajs/ui` second

If no local wrapper fits, prefer `@medusajs/ui`.

Use Medusa UI for:
- buttons, inputs, textareas, badges, headings, text
- drawers, modals, prompts, dropdown menus, tooltips, popovers
- containers, tabs, progress tabs, tables, labels, hints

Default assumption:
- visual styling comes from `@medusajs/ui`
- interaction semantics should stay compatible with `@medusajs/ui`

### 3. Compose before inventing

If the exact UI does not exist, first try to compose it from:
- `@medusajs/ui`
- existing local wrappers
- existing package layout primitives

Prefer composition over custom primitives when the behavior is mostly already solved.

### 4. Radix only for genuine gaps

Use Radix only when you need a lower-level primitive not already covered well enough by `@medusajs/ui` or local wrappers.

Good reasons:
- custom composite control behavior
- advanced accordion, dialog, collapsible, popover, or slot composition
- accessibility primitives for a reusable shared component

Bad reasons:
- wanting to restyle a solved Medusa UI component
- avoiding an existing local wrapper
- building page-local novelty UI

## `asChild` and composition rules

Mercur already uses `asChild` heavily. When composing with Medusa UI or Radix:
- the child component must spread incoming props
- the child component must forward the ref
- the child component must preserve semantic element behavior

If those conditions are not true, do not use `asChild`.

## Where new reusable UI should live

If you genuinely need a new shared component:
- place it under the relevant shared components area, usually `components/common`, `components/layout`, or another existing shared subtree
- give it an API that feels consistent with Medusa UI and Mercur wrappers
- keep styling and spacing compatible with existing dashboard patterns
- prefer a reusable abstraction over page-local duplication

If the UI is only page-specific and not reusable, keep it local, but still build it from Medusa UI and existing wrappers.

## Review checklist

Before finishing, check:
- did I reuse a local wrapper where one already exists?
- if not, did I prefer `@medusajs/ui`?
- if I used Radix, is there a concrete gap that justified it?
- if I used `asChild`, does the child spread props and forward refs?
- is the UI translated, accessible, and testable?
- did I avoid introducing a parallel design language or one-off primitive?

## Verification

For non-trivial custom UI:
- run the relevant package lint/build
- manually check keyboard behavior and focus flow
- verify translated copy and labels
- verify visible loading, empty, error, and success behavior where applicable
