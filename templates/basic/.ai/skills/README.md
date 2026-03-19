# Mercur Basic Starter Skills

This directory contains the canonical, starter-safe skills shipped with the `basic` Mercur template.

Use these skills for repeated workflows in a project created from this starter.

## Available skills

- `mercur-cli`
- `mercur-blocks`
- `medusa-ui-conformance`
- `dashboard-page-ui`
- `dashboard-form-ui`
- `dashboard-tab-ui`

## Linking to your agent runtime

`.ai/skills/` is the single source of truth. Link it to your runtime:

### Claude Code

```bash
mkdir -p .claude
ln -s ../.ai/skills .claude/skills
```

### Codex

```bash
mkdir -p .codex
ln -s ../.ai/skills .codex/skills
```

### Verify

```bash
# Claude Code — type /skills to see available skills
# Codex — type /skills to see available skills
```
