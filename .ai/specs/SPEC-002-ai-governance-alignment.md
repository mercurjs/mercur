# SPEC-002: AI Governance Structure Alignment with Open-Mercato Reference

**Date**: 2026-03-13
**Status**: Draft
**Related**: SPEC-001 (governance docs consolidation)

## 1. Summary

Align mercur's AI governance structure with the open-mercato reference project. Key additions: `lessons.md` (operational knowledge capture), enriched skills README with installation/linking guide, symlink-based skill discovery for Claude Code and Codex, priority meta-skills (`code-review`, `spec-writing`), and AGENTS.md enrichment (core principles, self-improvement loop, critical rules, backward compatibility contract).

## 2. Problem

Comparison with the open-mercato reference project reveals structural gaps:

1. **No `lessons.md`** — open-mercato captures 29 operational lessons. Mercur has zero. Hard-won knowledge lives only in MEMORY.md (per-user, not shared) and scattered across skill references.
2. **Skills README too thin** — 27 lines vs 224 in reference. Missing: naming conventions, installation/linking guide, when-to-create guidance, skill anatomy, anti-patterns.
3. **No symlink-based skill discovery** — open-mercato symlinks `.claude/skills` and `.codex/skills` to `.ai/skills/`, giving all runtimes native auto-discovery (slash commands, auto-trigger). Mercur has separate copies (`.claude/skills/compound-components-migration/` with richer content) and pointer stubs (`.codex/skills/`). This causes content drift and breaks native discovery.
4. **No meta-skills** — mercur lacks workflow skills. No general code-review framework (only `admin-ui-review` for UI). No spec-writing workflow (template exists but no guidance on *how* to write a spec).
5. **AGENTS.md missing patterns** — no core principles section, no self-improvement mechanism (lessons.md feedback loop), no critical rules distilled from scattered sources, no backward compatibility classification.

## 4. Scope

### In scope

- Create `.ai/lessons.md` seeded with 15 lessons from existing project knowledge
- Expand `.ai/skills/README.md` from 27 to ~150 lines with installation/linking guide
- Merge `.claude/skills/compound-components-migration/` richer content into `.ai/skills/compound-components-migration-review/`
- Delete `.claude/skills/` and `.codex/skills/` directories, replace with symlinks to `.ai/skills/`
- Create `code-review` and `spec-writing` meta-skills
- Enrich root `AGENTS.md` with core principles, self-improvement, critical rules, BC contract
- Update `tools/check-ai-governance.sh` with new checks
- Delete stray `.ai/Untitled`

### Out of scope

- Changes to package-level AGENTS.md files
- Claude Code frontmatter enrichment (deferred — `name`+`description` only for now, like open-mercato)
- Creating `.claude/agents/`
- Creating `implement-spec` skill (deferred — only 1 spec exists)
- Creating `specs/analysis/` or `specs/enterprise/` directories

---

## 5. Design

### Phase 1: Create `.ai/lessons.md`

**New file**: `.ai/lessons.md` (~180 lines)

Structure (following open-mercato pattern):
```markdown
# Lessons

Operational lessons learned from working in the mercur codebase.
Update this file after corrections, regressions, or non-obvious discoveries.

## How to add a lesson
- State the rule clearly as the heading
- Explain why (rationale)
- Note when it applies (scope)

## Lessons

### 1. Rule statement
**Why**: ...
**Scope**: ...
```

Seed with 15 lessons extracted from MEMORY.md and skill references:

| # | Lesson | Source |
|---|--------|--------|
| 1 | `as const` on tuple arrays breaks `indexOf` type narrowing with enums — use `Type[]` | MEMORY.md |
| 2 | 491+ pre-existing TS errors in core-admin — do not treat as regressions | MEMORY.md |
| 3 | Form components expect extended types (`AdminProduct & { shipping_profile? }`) | MEMORY.md |
| 4 | `useRouteModal()` must be inside `<RouteDrawer>`, not at top-level | MEMORY.md |
| 5 | `Seller.id = auth_context.actor_id`, not `members.id` | MEMORY.md |
| 6 | SDK does not support multipart/form-data — file uploads require raw fetch | MEMORY.md |
| 7 | Never import from `@components/`, `@hooks/`, `@lib/` in registry blocks | MEMORY.md |
| 8 | Don't create barrel `index.ts` in `workflows/` or `steps/` — overwrites other blocks | MEMORY.md |
| 9 | CLI `resolveNestedFilePath()` finds last segment — path structure matters | MEMORY.md |
| 10 | Keyboard submit bypasses button `isLoading` — guard in handler not just UI | CC migration skill |
| 11 | Dynamic tab hiding causes invalid active tab — normalize after visibility change | CC migration skill |
| 12 | Dead metadata APIs create false safety — wire runtime in same patch | CC migration skill |
| 13 | `Children.count(children) > 0` catches nested route children — use composition guard | cc-alignment skill |
| 14 | Route type codegen reads `AuthenticatedMedusaRequest<Body>` + `MedusaResponse<Resp>` generics | MEMORY.md |
| 15 | `docs` field in registry.json must include medusa-config, middleware setup, `isQueryable`, codegen reminder | MEMORY.md |

---

### Phase 2: Expand `.ai/skills/README.md`

**Modified file**: `.ai/skills/README.md` (27 → ~150 lines)

New sections:

1. **Purpose** — expanded intro
2. **Discovering skills** — slash commands, AGENTS.md quick reference
3. **Naming conventions** — kebab-case dir, `SKILL.md`, description with "Use when..."
4. **When to create a new skill** — repeated pattern (3+ tasks), stable, not speculative
5. **When to update** — new hard rule, changed reference, expanded scope
6. **Skill file anatomy** — frontmatter, "Use when", core rules, workflow, output format
7. **Frontmatter field reference** — table of all Claude Code fields with mercur usage guidance:

| Field | Required | When to use in mercur |
|-------|----------|-----------------------|
| `name` | Yes | Always, must match directory name |
| `description` | Yes | Always, trigger mechanism for auto-invocation |
| `allowed-tools` | No | Review-only skills (restrict to `Read, Grep, Glob`) |
| `argument-hint` | No | Skills that accept an argument (e.g. `[block-name]`) |
| `disable-model-invocation` | No | Skills too risky for auto-trigger |
| `context` | No | Skills needing subagent isolation (`fork`) |
| `agent` | No | Subagent type when using `context: fork` |
| `user-invocable` | No | Background knowledge skills (hide from `/` menu) |

8. **References directory** — when to add `references/`, what belongs there
9. **Relationship to AGENTS.md** — AGENTS.md maps tasks→skills; README has creation guidance
10. **Anti-patterns** — too broad, duplicating AGENTS.md, no clear trigger

---

### Phase 3: Symlink skill discovery + merge Claude-specific content

**Goal**: Single source of truth (`.ai/skills/`) with native runtime discovery via symlinks.

#### Step 1: Merge richer content from `.claude/skills/compound-components-migration/` into `.ai/skills/`

The `.claude/` version has content NOT present in `.ai/`:
- 18 hard rules (vs 10 in `.ai/` version)
- `references/reference-implementations.md` (206 lines — verified implementation templates)
- More specific rules: `Page` suffix, `Main`/`Sidebar` prefix, no context/provider, route topology

**Action**: Merge the `.claude/` version's extra content into `.ai/skills/compound-components-migration-review/`:
- Update `SKILL.md` with the 8 additional hard rules from `.claude/` version
- Copy `references/reference-implementations.md` to `.ai/skills/compound-components-migration-review/references/`
- Ensure `references/common-regressions.md` has the 6th regression (duplicate detail page rendering) from `.claude/` version

#### Step 2: Delete runtime-specific skill directories

```bash
rm -rf .claude/skills/
rm -rf .codex/skills/
```

#### Step 3: Create symlinks (open-mercato pattern)

```bash
ln -s ../.ai/skills .claude/skills
ln -s ../.ai/skills .codex/skills
```

#### Step 4: Add install-skills script

Create `tools/install-skills.sh` (like open-mercato's `yarn install-skills`):
```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for runtime in .claude .codex; do
  dir="$REPO_ROOT/$runtime"
  mkdir -p "$dir"
  target="$dir/skills"
  if [ -L "$target" ]; then
    echo "ℹ️  $runtime/skills already linked"
  elif [ -d "$target" ]; then
    echo "⚠️  $runtime/skills is a real directory — remove it first"
    exit 1
  else
    ln -s ../.ai/skills "$target"
    echo "✅  Linked $runtime/skills → .ai/skills"
  fi
done

echo "🎉  Skills installation complete."
```

#### Step 5: Update `.gitignore`

Add symlinks so they're not committed (each dev/CI runs `install-skills.sh`):
```
.claude/skills
.codex/skills
```

#### Result after Phase 3:

```
.ai/skills/           ← single source of truth (committed)
.claude/skills → .ai/skills   ← symlink (gitignored, created by install-skills.sh)
.codex/skills → .ai/skills    ← symlink (gitignored, created by install-skills.sh)
```

- Claude Code: auto-discovers all skills, slash commands work (`/admin-form-ui`, `/code-review`)
- Codex: auto-discovers all skills (`$admin-form-ui`)
- Zero duplication, zero drift, zero pointer files

---

### Phase 4: Create priority meta-skills

#### 4a. `code-review` (HIGH priority)

**New files**:
- `.ai/skills/code-review/SKILL.md` (~120 lines)
- `.ai/skills/code-review/references/review-checklist.md` (~80 lines)

**Frontmatter** (name + description only, consistent with open-mercato convention):
```yaml
---
name: code-review
description: Review code changes for contract compliance, type safety, and regression risk. Use after completing any non-trivial implementation, before merging PRs, or when asked to review code quality across any mercur package.
---
```

**Content outline**:
- **When to use**: After implementation, before merge, when asked to review
- **Checklist sections**: API contract compliance, type safety, public exports stability, i18n, codegen impact, block path stability, test coverage
- **Severity**: P1 (blocker), P2 (should fix), P3 (suggestion) — consistent with `admin-ui-review`
- **Output format**: Findings by severity with file + line + fix, or "no findings" with verification summary
- **References**: `review-checklist.md` with mercur-specific items

#### 4b. `spec-writing` (HIGH priority)

**New file**: `.ai/skills/spec-writing/SKILL.md` (~100 lines)

**Frontmatter**:
```yaml
---
name: spec-writing
description: Write or review Mercur specifications following the skeleton-first approach. Use when creating a new spec, refining an existing spec, or reviewing spec quality before implementation.
---
```

**Content outline**:
- **Skeleton-first**: fill required sections (Summary, Problem, Scope, Acceptance Criteria, Technical Impact, Verification) BEFORE optional ones
- **Open Questions gate**: HARD STOP if critical unknowns exist — do not proceed to design until resolved
- **Business-first**: explain "why" before "how" — problem and outcome before routes/DTOs
- **Review lens**: Is the scope tight enough? Are acceptance criteria testable? Are contracts identified?
- **Links**: `specs/TEMPLATE.md`, `specs/README.md`

#### Deferred skills (and why):

| Skill | Why defer |
|-------|-----------|
| `implement-spec` | Only 1 spec exists — create when 3+ specs |
| `skill-creator` | Enriched README (Phase 2) provides sufficient guidance |
| `create-agents-md` | Package AGENTS.md files exist, pattern established |
| `fix-specs` | 1 spec, premature optimization |
| `pre-implement-spec` | Fold BC audit into future `implement-spec` |
| `integration-tests` | HTTP-based (not Playwright), covered by `integration-tests/AGENTS.md` |

---

### Phase 5: Enrich root AGENTS.md

**Modified file**: `AGENTS.md` (200 → ~260 lines)

#### 5a. Core Principles (after "Purpose", ~15 lines)

```markdown
## Core Principles

- **Spec-first**: qualifying changes start with a spec, not code
- **Behavior preservation**: refactors must not change observable behavior
- **Minimal impact**: smallest change that achieves the goal
- **Verify before closing**: state what was verified, not verified, and residual risk
- **Self-improvement**: update `.ai/lessons.md` after corrections or non-obvious discoveries
```

#### 5b. Self-Improvement Mechanism (after Core Principles, ~10 lines)

```markdown
## Self-Improvement

When you discover a non-obvious lesson, regression pattern, or correction:
1. Check if `.ai/lessons.md` already covers it
2. If not, add a new lesson with: rule, rationale, scope
3. If the lesson affects a skill's hard rules, update that skill too
```

#### 5c. Critical Rules (before "Verification Expectations", ~15 lines)

```markdown
## Critical Rules

- Never import from `@components/`, `@hooks/`, `@lib/` in registry blocks — use `@mercurjs/dashboard-shared`
- Never create barrel `index.ts` in `workflows/` or `steps/` — overwrites other blocks during install
- Always guard keyboard submit paths in handler, not just button UI
- Route type codegen reads `AuthenticatedMedusaRequest<Body>` + `MedusaResponse<Resp>` generics — these are the contract
- SDK does not support multipart/form-data — file uploads require raw fetch
- 491+ pre-existing TS errors in admin — do not treat as regressions from current work
```

#### 5d. Stability Classification (after "Public Contract Surfaces", ~10 lines)

```markdown
### Stability Classification

- **Frozen** (breaking change requires spec + migration notes): API route paths, response envelope shapes, generated Routes types, CLI command names, registry block file layout
- **Stable** (can tighten not loosen, document changes): request validation, public package exports, dashboard configuration surfaces
- **Internal** (free to change): implementation details, private utilities, test helpers
```

#### 5e. Update Quick Reference table

Add rows:
```markdown
| Code review (any package) | this file + touched package guides | `code-review` |
| Writing a spec | this file | `spec-writing` |
```

#### 5f. Update Repo-Local Skills table

Add `code-review` and `spec-writing` to shared skills table.

---

### Phase 6: Cleanup

#### 6a. Delete `.ai/Untitled`
Contains informal Polish notes about client migration. Not governance content.

#### 6b. Update `tools/check-ai-governance.sh`
Add checks:
- `.ai/lessons.md` exists and is non-empty
- No stray files in `.ai/` root (only `lessons.md` and directories allowed)
- Every SKILL.md has `name` and `description` in frontmatter

---

## 6. Sequencing

```
Phase 1 (lessons.md)     ─┐
Phase 2 (skills README)  ─┤── parallel, no dependencies
                           │
Phase 3 (symlink+merge)  ─── depends on Phase 2 (README documents install)
Phase 4a (code-review)   ─┐
Phase 4b (spec-writing)  ─┤── parallel, after Phase 3 (skills go into .ai/)
                           │
Phase 5 (AGENTS.md)      ─── depends on Phase 1 (references lessons.md)
                             + Phase 3 (updates source of truth section)
                             + Phase 4 (adds new skills to table)
Phase 6 (cleanup)        ─── last
```

---

## 8. Acceptance Criteria

- [ ] `.ai/lessons.md` exists with 15+ seed lessons, following open-mercato structure
- [ ] `.ai/skills/README.md` expanded to ~150 lines with installation/linking guide and skill creation conventions
- [ ] `.claude/skills/compound-components-migration/` richer content merged into `.ai/skills/compound-components-migration-review/`
- [ ] `.claude/skills/` and `.codex/skills/` are symlinks to `.ai/skills/` (not real directories)
- [ ] `tools/install-skills.sh` creates symlinks for both runtimes
- [ ] `.gitignore` excludes `.claude/skills` and `.codex/skills` symlinks
- [ ] `.ai/skills/code-review/SKILL.md` exists with checklist and `references/review-checklist.md`
- [ ] `.ai/skills/spec-writing/SKILL.md` exists with skeleton-first workflow and open questions gate
- [ ] `AGENTS.md` has: Core Principles, Self-Improvement, Critical Rules, Stability Classification sections
- [ ] `AGENTS.md` Quick Reference and Repo-Local Skills tables include `code-review` and `spec-writing`
- [ ] `AGENTS.md` source of truth section updated to reflect symlink approach
- [ ] `.ai/Untitled` deleted
- [ ] `tools/check-ai-governance.sh` checks for lessons.md, stray files, symlinks, frontmatter fields
- [ ] `bash tools/check-ai-governance.sh` passes with exit 0

## 11. Technical Impact

Affected areas:
- `.ai/` (lessons, skills, no code changes)
- `AGENTS.md` (enrichment)
- `tools/` (governance script)

Contracts touched:
- API routes: n/a
- request validation: n/a
- response shape: n/a
- generated Routes: n/a
- database schema / migrations: n/a
- public package exports: n/a
- CLI: n/a
- registry install paths: n/a
- docs: n/a

## 13. Verification

- `bash tools/check-ai-governance.sh` → exit 0
- All SKILL.md frontmatter parses as valid YAML (`name` + `description`)
- Symlinks work: `ls -la .claude/skills` and `ls -la .codex/skills` point to `../.ai/skills`
- `bash tools/install-skills.sh` runs cleanly on fresh clone
- New skills follow consistent format with existing ones
- `lessons.md` contains 15+ entries
- Skills README includes installation/linking guide
- AGENTS.md quick reference includes new skills
- No stray files in `.ai/` root
- No real directories at `.claude/skills/` or `.codex/skills/` (only symlinks)
