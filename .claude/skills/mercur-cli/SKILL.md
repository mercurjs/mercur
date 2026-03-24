---
name: mercur-cli
description: Use Mercur CLI commands correctly for project setup, block discovery, block installation, and starter maintenance. Use when working with `create`, `init`, `add`, `search`, `view`, or `diff`.
argument-hint: "[command]"
---

# Mercur CLI

Use this skill when:
- creating a new Mercur project
- initializing `blocks.json`
- searching for blocks
- viewing block details before installation
- adding blocks to a project
- diffing installed blocks against the registry

## Command map

- `create` — create a new Mercur project from a template
- `init` — create `blocks.json` in an existing project
- `search` — search block names and descriptions
- `view` — inspect a block before adding it
- `add` — install one or more blocks into a project
- `diff` — compare installed block files with the registry version

## Workdir rules

- Run CLI registry commands from the project root where `blocks.json` lives.
- Run backend verification from the backend workspace after installation if the block touched backend code.
- Prefer the package manager selected by the project instead of hardcoding `npm`.

## Starter flows

### Create a new project

```bash
npx @mercurjs/cli@canary create my-mercur --template basic
```

### Initialize block config in an existing project

```bash
npx @mercurjs/cli@canary init
```

### Discover and inspect blocks

```bash
npx @mercurjs/cli@canary search --query review
npx @mercurjs/cli@canary view reviews
```

### Add a block

```bash
npx @mercurjs/cli@canary add reviews
```

### Check a block against the registry

```bash
npx @mercurjs/cli@canary diff reviews
```

## After `add`

Always inspect what changed:
- where files landed based on `blocks.json` aliases
- whether `medusa-config.ts` needs a module or config update
- whether route or SDK types require codegen
- whether build or tests need to run in touched workspaces

## Avoid

- guessing block names without `search` or `view`
- running `add` outside the project root
- assuming blocks are UI-only; many also add backend modules, routes, or workflows
- skipping post-install review of changed files and configuration

## Output expectations

When using the CLI in a task summary:
- name the command used
- explain why that command was chosen instead of another
- call out any follow-up verification still required
