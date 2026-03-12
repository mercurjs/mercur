# Project Specs

This directory contains lightweight business-first specifications for non-trivial project work.

Specs are used to capture:
- the product, business, or operational problem being solved
- the desired outcome for users, operators, or developers
- scope, non-goals, and business rules
- acceptance criteria, risks, and rollout notes
- the technical impact and verification appendix needed to implement the change safely

## When specs are required

This template uses a medium spec threshold.

Create or update a spec when a change:
- spans more than one major area
- changes a public API, validation, or response shape
- changes generated client, SDK, or contract behavior
- changes shared DTOs or public types consumed across areas
- changes installation, scaffolding, or integration behavior
- changes a persistent data model or requires database migrations
- changes a major user or operator flow
- changes docs and code contracts together
- needs migration, compatibility, rollout, or operational notes

You usually do not need a spec for:
- typo fixes
- isolated refactors with no behavior change
- very small area-local bug fixes with no public contract impact

## Naming convention

Use:

```text
SPEC-XXX-short-title.md
```

Where:
- `XXX` is the next zero-padded sequence number chosen in this directory
- `short-title` is a concise kebab-case summary

Rules:
- scan this directory before creating a new spec
- do not reuse or renumber existing spec IDs
- keep IDs stable once a spec is referenced from a PR or task

## Spec philosophy

In this template, a spec is primarily a product and business artifact with an implementation appendix.

Specs should start with:
- the problem
- the desired outcome
- the scope and non-goals
- the business rules
- the acceptance criteria

Only after that should they describe:
- touched areas
- contract surfaces
- implementation phases
- verification details

It is not:
- a manually maintained duplicate of the runtime HTTP contract
- a replacement for validators, handlers, or generated contracts
- a substitute for tests

If a spec starts with routes, DTOs, file paths, or implementation steps before it explains the user or business problem, it is too low-level.

Use specs to describe why the change matters, what behavior should exist afterwards, and how the implementation will be verified. Let source code, generated contracts, docs, and tests prove the final result.

## Recommended section order

Use the template in this order:

1. Summary
2. Problem
3. Desired Outcome
4. Scope
5. Users / Actors
6. Main Flows
7. Business Rules
8. Acceptance Criteria
9. Risks
10. Rollout / Migration Notes
11. Technical Impact
12. Implementation Approach
13. Verification
14. Open Questions
15. Changelog

## Required template

Create new specs from [`TEMPLATE.md`](TEMPLATE.md).

Do not add extra companion artifacts in the first rollout such as:
- `plan.md`
- `tasks.md`
- `analysis/`
