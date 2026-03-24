# Mercur Skills

This directory contains skills for Mercur development — reusable prompt modules that encode domain knowledge, checklists, and workflows.

`.claude/skills/` is the canonical location. It is tracked in git.

## How skills are loaded

An agent loads a skill when:
- the user invokes it via slash command (e.g., `/admin-ui-review`)
- the agent's routing logic matches a task to a skill description
- the user explicitly asks to use a skill by name

## Discovering skills

1. Browse this directory — each subdirectory is a skill
2. Use slash command autocomplete in Claude Code (type `/` and search)
3. Read the `description` field in each skill's `SKILL.md` frontmatter

## Naming conventions

- **Directory name**: `kebab-case`, must match the `name` field in frontmatter
- **Skill file**: always `SKILL.md` (uppercase)
- **Description**: one sentence starting with a verb — this is the primary trigger mechanism
- **References**: additional files go in a `references/` subdirectory

## Skill file anatomy

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

[The main content]

## Output Format

[What the skill produces]
```

## Frontmatter fields

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Must match directory name |
| `description` | Yes | Primary trigger — agents use this to decide relevance |
| `allowed-tools` | No | Restrict tools (e.g., `Read, Grep, Glob` for review-only skills) |
| `argument-hint` | No | Hint for slash command args (e.g., `"[block-name]"`) |
| `disable-model-invocation` | No | Prevent auto-trigger — manual `/slash-command` only |

## Using with other AI tools

Skills are plain markdown. For tools other than Claude Code:

**Codex**: symlink `.codex/skills/` → `.claude/skills/`
```bash
mkdir -p .codex && ln -s ../.claude/skills .codex/skills
```

**Cursor**: copy skills as `.cursor/rules/`
```bash
cp .claude/skills/mercur-blocks/SKILL.md .cursor/rules/mercur-blocks.md
```

## When to create a skill

Add a skill when:
- You've given the same correction 3+ times
- A regression keeps recurring
- A workflow has 5+ steps easy to forget
- A review keeps catching the same anti-patterns

Do not create speculative skills.

## Relationship to spec-kit

Skills encode **domain knowledge** (how to build forms, how to review code, how blocks work). Spec-kit commands (`/speckit.*`) encode **workflow** (specify → plan → tasks → implement). They complement each other — spec-kit plans may reference skills for implementation guidance, but skills do not depend on spec-kit.
