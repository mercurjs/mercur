---
name: admin-form-ui
description: Create or modify admin forms in the Mercur basic starter using stable form structure, validation, submission guards, and dashboard UI conventions.
---

# Admin Form UI

Use this skill when:
- adding or editing an admin form
- wiring page-level create or edit flows
- reviewing submission, validation, or field structure

## Core rule

Prefer the existing Mercur admin form pattern already present in the screen or package. Do not introduce a parallel form system just because it is locally convenient.

Before introducing custom field wrappers, selectors, overlays, or other interactive form UI, apply `medusa-ui-conformance`.

## Hard rules

1. Do not hardcode labels, hints, or button text; use i18n.
2. Do not ship forms without explicit validation behavior.
3. Do not rely only on button disabled state; submission guards must also protect non-button submit paths.
4. Do not flatten large forms into one unstructured wall of fields.
5. Do not add ad hoc field wrappers when the existing project already has a preferred form composition.

## Preferred patterns

- Use schema-driven validation when the form is non-trivial.
- Group related fields together and keep labels, hints, and errors predictable.
- Preserve loading, pending, success, and failure behavior in submission flows.
- When extending an existing Mercur form, follow its established wrapper, field, and footer shape.

## When to switch skills

- If the task is mainly page structure, use `admin-page-ui`.
- If the task is mainly a tabbed wizard, use `admin-tab-ui`.

## Verification

- confirm validation fires on the expected fields
- confirm the submit path is guarded during pending async work
- confirm translated copy, hints, and errors remain coherent
- run admin build or lint after non-trivial form changes
