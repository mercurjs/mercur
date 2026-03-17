# Mercur Plans

This directory holds tactical implementation plans for in-progress work.

Plans are short-lived artifacts — they describe **how** to implement something, not **why** (that belongs in a spec).

## When to create a plan

Create a plan when:
- a task has multiple implementation chunks that benefit from upfront sequencing
- you want to share step-by-step instructions with an agent or contributor
- you need a revertible experiment with a clear rollback path

You do **not** need a plan for:
- single-step changes
- work that fits in one commit
- anything already covered by a spec's Implementation Approach section

## Naming convention

```text
YYYY-MM-DD-short-title.md
```

Example: `2026-03-15-sidebar-reskin.md`

## Lifecycle

- Plans older than 30 days should be reviewed — archive or delete if no longer active.
- Once a plan is fully executed, delete it. The git history preserves it.
- Do not accumulate stale plans.

## Relationship to specs

- A **spec** explains the problem, outcome, scope, and acceptance criteria (business-first).
- A **plan** explains the implementation sequence, file map, and commit strategy (execution-first).
- Small features: spec's "Implementation Approach" section is enough — no separate plan needed.
- Large features: spec defines what, plan defines how.
