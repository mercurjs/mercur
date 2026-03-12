# AI Governance Starter Template

This template is a lightweight starter kit for projects that want to work with AI agents in a structured way from day one.

It is designed around four ideas:
- `AGENTS.md` is the primary workflow guide
- specs are business-first, not implementation-first
- shared skills live in `.ai/skills/`
- local area guides tell agents how to work in each major part of the repo

This template does not include `CONTRIBUTING.md` on purpose. Some projects need it, some do not. The goal here is to give every new project a clean AI operating model without forcing contributor process choices too early.

## What is included

- `AGENTS.md`
- `.ai/specs/README.md`
- `.ai/specs/TEMPLATE.md`
- `.ai/skills/README.md`
- `guides/AREA-AGENTS.template.md`

## What this gives you

- one obvious place for agents to start
- a clear rule for when specs are required
- a business-first spec format that helps AI reason about intent before implementation
- a shared location for agent-neutral skills
- a repeatable structure for package, app, or domain guides

## How to adopt in a new project

1. Copy `AGENTS.md` and the `.ai/` folder into the new repo root.
2. Replace the example Task Router entries in `AGENTS.md` with the real repo areas.
3. Create 3-5 local area guides from `guides/AREA-AGENTS.template.md`.
4. Adjust public contract surfaces to match the project.
5. Set the spec threshold to match the expected pace of change.
6. Add repo-local skills only when a workflow is repeated often enough to justify one.
7. Run the first real feature through the process and trim anything that feels ceremonial.

## Recommended first customization

For a brand-new project, update these sections first:
- `AGENTS.md` -> `Task Router`
- `AGENTS.md` -> `Public Contract Surfaces`
- `AGENTS.md` -> `Source Of Truth Layers`
- `.ai/specs/README.md` -> spec threshold examples

## Suggested starter shape

For most repos, this is enough:
- one root `AGENTS.md`
- one `.ai/specs/` folder
- one `.ai/skills/` folder
- three to five local area guides

You do not need:
- many skills on day one
- separate `plan.md` and `tasks.md` files
- ADR-heavy process before the product is real
- agent-specific governance files as the primary source of truth

## Runtime compatibility

Use `.ai/skills/` as the canonical shared home for skills.

If a specific tool expects its own folder layout, keep a runtime-specific mirror such as:
- `.codex/skills/`
- `.claude/skills/`

But keep `.ai/skills/` as the source of truth.
