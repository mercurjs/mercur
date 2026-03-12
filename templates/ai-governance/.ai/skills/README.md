# Shared Skills

This directory is the canonical home for agent-neutral, repo-local skills.

Use `.ai/skills/` for skills that should be available to any agent workflow, regardless of runtime vendor.

## What a skill is for

A skill is worth adding when:
- the workflow is repeated often
- the workflow is fragile enough that reminder-level guidance is not enough
- the project has repo-specific patterns that are easy for agents to miss

A skill is usually not worth adding when:
- it will be used once
- the guidance already fits naturally inside an area guide
- the process is still changing too quickly

## Rules

- create or update the canonical skill in `.ai/skills/` first
- keep runtime-specific mirrors only when a tool expects them
- do not treat runtime-specific folders as the source of truth
- keep skills focused on one workflow or one review surface

## Suggested minimal skill shape

Most skills only need:
- `SKILL.md`
- optional `references/` for detailed checklists or repo-specific pitfalls
- optional `scripts/` only when deterministic automation is truly useful

## Runtime compatibility

If needed, keep mirrors such as:
- `.codex/skills/`
- `.claude/skills/`

But `.ai/skills/` remains the canonical shared source.
