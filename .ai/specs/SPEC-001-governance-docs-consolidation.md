# SPEC-001: AI Governance Docs Consolidation

**Date**: 2026-03-13
**Status**: In Progress
**Related**: n/a

## 1. Summary

Consolidate AI governance docs to eliminate duplication, establish clear source-of-truth rules, and add automated consistency checks. Skills, specs, and plans each get a single canonical location with no content duplication across runtime-specific directories.

## 2. Problem

- Skills are duplicated across `.ai/skills/`, `.claude/skills/`, and `.codex/skills/` with no sync mechanism — content drifts silently.
- The skill list is maintained in both `AGENTS.md` and `.ai/skills/README.md` — adding a new skill requires updating two files.
- `.ai/plans/` has no conventions (naming, lifecycle, cleanup) — agents don't know how to use it.
- The spec template has 15 sections with no guidance on which are required — agents may skip the template as too heavy or fill it mechanically.
- No automated check ensures governance docs stay consistent.
- No quick-start path for agents — every task requires reading 4-5 files before starting.

## 4. Scope

In scope:
- Quick Reference table in `AGENTS.md` for fast task routing
- Plans directory README with naming/lifecycle conventions
- Skills README deduplication (single list in `AGENTS.md`)
- `.codex/skills/` replacement with pointer files
- Spec template required/optional section split
- `tools/check-ai-governance.sh` consistency script
- First real spec (this document) to validate the workflow

Out of scope:
- Merging or splitting individual skills
- Changes to package-level `AGENTS.md` files
- CI pipeline integration (script is ready, pipeline wiring is separate)
- Template AGENTS.md sync automation

## 8. Acceptance Criteria

- [ ] `AGENTS.md` has a Quick Reference table mapping task types to guides and skills
- [ ] `.ai/plans/README.md` defines naming convention and 30-day lifecycle
- [ ] `.ai/skills/README.md` links to `AGENTS.md` for skill list instead of maintaining its own
- [ ] `.codex/skills/` contains only pointer files (<15 lines), no duplicated content or references/
- [ ] `AGENTS.md` "Source of truth" section clearly states `.ai/skills/` as canonical
- [ ] Spec template marks sections as required vs optional
- [ ] `tools/check-ai-governance.sh` passes with exit 0
- [ ] At least one real spec exists in `.ai/specs/`

## 11. Technical Impact

Affected areas:
- `.ai/` (specs, skills, plans)
- `.codex/skills/`
- `AGENTS.md`
- `tools/`

Contracts touched:
- API routes: n/a
- request validation: n/a
- response shape: n/a
- generated `Routes`: n/a
- database schema / migrations: n/a
- public package exports: n/a
- CLI: n/a
- registry install paths: n/a
- docs: n/a

## 13. Verification

- governance check script: `bash tools/check-ai-governance.sh` — PASSED
- manual review: all changed files reviewed for accuracy
- no code changes — docs and tooling only
