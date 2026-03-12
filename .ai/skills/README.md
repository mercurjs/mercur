# Mercur Shared Skills

This directory contains the canonical, agent-neutral skills for Mercur.

Use `.ai/skills/` as the shared home for skills that should be available to any agent workflow, regardless of runtime vendor.

## Canonical vs compatibility copies

Mercur currently supports two concepts:
- canonical shared skills in `.ai/skills/`
- runtime-specific compatibility mirrors in `.codex/skills/` when a tool expects that layout

Rules:
- create or update the canonical skill in `.ai/skills/` first
- keep `.codex/skills/` only as a compatibility mirror while needed
- do not treat `.codex/skills/` as the source of truth for long-term governance

## Available shared skills

- `mercur-cli` — use Mercur CLI commands correctly for create/init/add/search/view/diff flows
- `mercur-blocks` — discover, evaluate, add, and verify blocks safely using `blocks.json`
- `medusa-ui-conformance` — keep custom dashboard UI aligned with local wrappers, `@medusajs/ui`, and Radix primitives
- `compound-components-migration-review` — review admin Compound Component migrations
- `cc-alignment` — align CC pages to vendor standard naming/structure, fix DTS build blockers
- `admin-ui-review` — review admin UI code for pattern consistency, anti-patterns, i18n
- `admin-page-ui` — enforce correct page/section UI patterns (list, detail, Container, action menus)
- `admin-form-ui` — enforce correct form UI patterns (Form.Field, drawers, modals, submit guards)
- `admin-tab-ui` — enforce correct tab UI patterns for TabbedForm wizards (defineTabMeta, layout)

## Adding future skills

Add a new shared skill here when it is:
- broadly useful across agents
- stable enough to be reused
- specific enough to reduce repeated prompting or review overhead

Do not add speculative skills before the workflow needs them.
