---
name: admin-tab-ui
description: Create or modify tabbed admin workflows in the Mercur basic starter using stable tab structure, validation scope, and i18n-aware wizard conventions.
---

# Admin Tab UI

Use this skill when:
- adding a custom tab to a tabbed admin flow
- extending a multi-step wizard
- reviewing tab layout, validation scope, or navigation behavior

Before introducing custom interactive UI inside a tab, apply `medusa-ui-conformance`.

## Hard rules

1. Do not hardcode tab labels; use i18n-aware metadata.
2. Do not put all fields into one flat tab without section structure.
3. Do not ignore forward-navigation validation scope.
4. Do not break keyboard or submit behavior when adding a tab.
5. Do not assume tabs are static if visibility depends on form state.

## Preferred patterns

- Give each tab a single clear purpose.
- Keep a visible header and grouped sections inside the tab body.
- Keep validation fields scoped to the tab when the flow expects step-by-step validation.
- Preserve navigation behavior when tabs appear or disappear dynamically.

## When to switch skills

- Page shell work -> `admin-page-ui`
- Form field work without wizard concerns -> `admin-form-ui`

## Verification

- confirm the tab label and content are translation-ready
- confirm forward navigation validates the intended fields
- confirm dynamic visibility does not leave the flow in an invalid state
- run admin build or lint after non-trivial tab work
