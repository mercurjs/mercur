# Mercur Shared Skills

This directory contains the canonical, agent-neutral skills for Mercur.

Use `.ai/skills/` as the shared home for skills that should be available to any agent workflow, regardless of runtime vendor.

## Purpose

Skills are reusable prompt modules that encode domain knowledge, checklists, and workflows. They reduce repeated prompting, catch known regressions, and enforce patterns that are easy to forget under time pressure.

An agent loads a skill when:
- the user invokes it via slash command (e.g., `/admin-ui-review`)
- the agent's routing logic matches a task to a skill (see Quick Reference in `AGENTS.md`)
- the user explicitly asks to use a skill by name

## Discovering skills

The authoritative skill list with usage triggers is maintained in the root [`AGENTS.md`](../../AGENTS.md) under "Repo-Local Skills". Do not duplicate that full list here.

To find a skill:
1. Check the Quick Reference table in `AGENTS.md` — it maps task types to skills
2. Browse this directory — each subdirectory is a skill
3. Use slash command autocomplete in Claude Code (type `/` and search)

## Source of truth

`.ai/skills/` is the single source of truth for all shared skill content.

Runtime-specific directories (`.claude/skills/`, `.codex/skills/`) may contain mirrors or runtime-specific skills, but shared skill content must always be created and updated here first.

## Runtime linking

`.ai/skills/` is the canonical location. Runtime-specific directories must link to it, not duplicate content.

### Claude Code (`.claude/skills/`)

Option A — symlink (preferred):

```bash
mkdir -p .claude
ln -s ../.ai/skills .claude/skills
```

Option B — settings.json:

```json
{
  "skills": {
    "directory": ".ai/skills"
  }
}
```

Claude Code also supports **runtime-specific skills** that don't belong in `.ai/`. Place these directly in `.claude/skills/<skill-name>/SKILL.md` (not symlinked). Example: `compound-components-migration` lives only in `.claude/skills/` because it uses Claude Code-specific features.

### Codex (`.codex/skills/`)

Symlink:

```bash
mkdir -p .codex
ln -s ../.ai/skills .codex/skills
```

### Pointer files (when symlink is not used)

If a runtime directory cannot use symlinks, create a **pointer file** — a short `SKILL.md` that redirects to the canonical source:

```markdown
---
name: skill-name
description: Compatibility mirror. Canonical source is `.ai/skills/skill-name/SKILL.md`.
---

# Skill Name

This is a **compatibility mirror** for runtime discovery.

**Canonical source:** [`.ai/skills/skill-name/SKILL.md`](../../../.ai/skills/skill-name/SKILL.md)

Read the canonical source for all skill content.
```

Pointer files must be under 15 lines. The governance check flags longer files as duplicated content.

### Verify

```bash
# Claude Code
claude
> /skills
# Should list all skills from .ai/skills/

# Codex
codex
> /skills
```

## Naming conventions

- **Directory name**: `kebab-case`, must match the `name` field in frontmatter
- **Skill file**: always `SKILL.md` (uppercase)
- **Description**: one sentence starting with a verb, should convey when to trigger (e.g., "Review admin UI code for...")
- **References**: additional files go in a `references/` subdirectory

## Skill file anatomy

Every `SKILL.md` follows this structure:

```markdown
---
name: skill-name
description: One sentence. Use when [trigger condition].
---

# Skill Title

Use this skill when:
- [trigger 1]
- [trigger 2]

## [Core Rules / Hard Rules / Checklist]

[The main content — rules, checklists, workflow steps]

## Output Format

[What the skill produces — review findings, implementation summary, etc.]
```

### Sections

| Section | Purpose |
|---------|---------|
| Frontmatter | Machine-readable metadata for discovery and runtime behavior |
| "Use this skill when" | Human-readable trigger conditions |
| Core rules / Hard rules | Non-negotiable constraints |
| Workflow steps | Ordered process to follow |
| Checklist | Items to verify |
| Output format | Expected output structure |
| Anti-patterns / Avoid | Common mistakes |

## Frontmatter field reference

| Field | Required | Type | When to use |
|-------|----------|------|-------------|
| `name` | Yes | string | Always. Must match the directory name |
| `description` | Yes | string | Always. This is the primary trigger mechanism — agents use it to decide relevance |
| `allowed-tools` | No | comma-separated | Review-only or read-only skills. Restricts to `Read, Grep, Glob` to prevent accidental edits |
| `argument-hint` | No | string | Skills that accept an argument via slash command (e.g., `"[block-name]"`, `"[SPEC-XXX]"`) |
| `disable-model-invocation` | No | boolean | Skills that should NOT auto-trigger — only manual `/slash-command` |
| `context` | No | `fork` | Skills that need an isolated agent context |
| `agent` | No | string | Subagent type when `context: fork` is set |
| `user-invocable` | No | boolean | Set to `false` for background knowledge skills (hidden from `/` menu) |

### Guidance

- Start with just `name` + `description`. Add other fields only when they change runtime behavior.
- `allowed-tools` is valuable for review skills — prevents the reviewer from accidentally modifying code.
- `argument-hint` improves UX for skills where the user passes a target (block name, spec ID, command).
- Avoid `disable-model-invocation` unless the skill is genuinely risky to auto-trigger.

## When to create a new skill

Add a new shared skill here when it is:
- **Broadly useful**: applicable across agents and runtimes
- **Stable**: the pattern has been validated in at least 2-3 tasks
- **Specific**: reduces repeated prompting or catches known regressions
- **Not already covered**: check existing skills first — extending is better than duplicating

Do not add speculative skills before the workflow needs them.

### Signal that a skill is needed

- You've given the same correction 3+ times
- A regression keeps recurring despite being fixed
- A workflow has 5+ steps that are easy to forget or reorder
- A review keeps catching the same anti-patterns

## When to update an existing skill (vs create new)

Update when:
- A new hard rule is discovered after a regression
- A reference pattern changes (e.g., new component API)
- The scope expands to a closely related use case
- A step is missing or outdated

Create new when:
- The use case is genuinely different (different trigger, different output)
- The existing skill would become too broad or lose focus

## References directory

Add a `references/` subdirectory when:
- The skill needs supporting checklists, examples, or lookup tables
- Reference material would make the main `SKILL.md` too long (> 200 lines)
- Multiple reference files serve different purposes (e.g., `review-checklist.md` + `common-regressions.md`)

Keep reference files focused and named descriptively.

## Relationship to AGENTS.md

- **`AGENTS.md`** owns the mapping from task type → skill (Quick Reference table)
- **This README** owns the guidance for creating, naming, and structuring skills
- When you add a new skill, update both: the skill directory here AND the tables in `AGENTS.md`

## Anti-patterns

| Anti-pattern | Why it's bad |
|-------------|--------------|
| Skill too broad (covers 5+ unrelated areas) | Hard to trigger accurately, becomes a dumping ground |
| Duplicating AGENTS.md content | Creates drift — AGENTS.md is the routing authority |
| Skill without clear trigger | Never gets loaded, wastes maintenance effort |
| Adding a skill for a one-time task | Skills are for recurring patterns |
| Putting all rules in references/ | Core rules belong in SKILL.md — references are supplementary |
| Copying skill content into .codex/skills/ | Creates divergence — .codex should have pointers only |

After creating a skill, add it to the skill table in root `AGENTS.md`.
