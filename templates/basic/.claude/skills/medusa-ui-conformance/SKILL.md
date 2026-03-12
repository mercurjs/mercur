---
name: medusa-ui-conformance
description: Keep custom admin and vendor UI in the Mercur basic starter aligned with local wrappers and @medusajs/ui. Use when adding reusable UI, interactive primitives, overlays, menus, selectors, or custom dashboard components.
---

# Medusa UI Conformance

Use this skill when:
- adding custom admin or vendor UI
- creating reusable components
- deciding whether to build, reuse, or compose an interaction pattern

This starter does not assume direct Radix usage on day one.

Use this order:
1. existing local wrapper
2. `@medusajs/ui`
3. composition of existing wrappers plus `@medusajs/ui`
4. only then add a lower-level primitive if the project genuinely needs it

## Hard rules

1. Do not build a custom dropdown, dialog, drawer, tooltip, popover, tabs, accordion, or select if `@medusajs/ui` already covers the interaction.
2. Do not add a new shared component when an existing local wrapper already solves the pattern.
3. Do not introduce custom interactive UI without keyboard behavior, focus handling, i18n, and stable `data-testid` coverage.
4. Do not create a one-off visual language that fights the rest of the dashboard.
5. Do not treat low-level primitives as the default starting point for UI work.

## Decision checks

Before creating custom UI, ask:
- does this pattern already exist in shared components?
- can `@medusajs/ui` solve this directly?
- can I compose the solution from existing wrappers and Medusa UI components?
- if not, is the gap real and reusable enough to justify a new shared component?

## Review checklist

- reused an existing wrapper where possible
- preferred `@medusajs/ui` over custom primitives
- kept copy translation-ready
- kept interaction accessible and testable
- kept the component reusable if the pattern is shared

## Verification

- run the relevant app lint/build
- manually check keyboard and focus behavior for non-trivial interactions
- verify translated copy and labels
