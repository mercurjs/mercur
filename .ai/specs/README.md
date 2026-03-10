# Mercur Specs

This directory contains lightweight business-first specifications for non-trivial Mercur work.

Specs are used to capture:
- the product or operational problem being solved
- the desired outcome for users, operators, or developers
- scope, non-goals, and business rules
- acceptance criteria, risks, and rollout notes
- the technical impact and verification appendix needed to implement the change safely

## When specs are required

Mercur uses a medium spec threshold.

Create or update a spec when a change:
- spans more than one package
- changes API behavior, validation, or response shape
- changes generated route/client behavior
- changes shared DTOs or public types consumed across packages
- changes registry installation behavior or copied file layout
- changes a persistent data model or requires database migrations
- changes a major admin or vendor flow
- changes docs and code contracts together
- needs migration or compatibility notes

You usually do not need a spec for:
- typo fixes
- isolated refactors with no behavior change
- very small package-local bug fixes with no public contract impact

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

Examples:
- `SPEC-001-vendor-register-flow.md`
- `SPEC-002-registry-route-codegen-guardrails.md`

## Mercur spec philosophy

In Mercur, a spec is primarily a product and business artifact with an implementation appendix.

Specs should start with:
- the problem
- the desired outcome
- the scope and non-goals
- the business rules
- the acceptance criteria

Only after that should they describe:
- touched packages
- contract surfaces
- implementation phases
- verification details

It is not:
- a manually maintained duplicate of the runtime HTTP contract
- a replacement for route validators, handlers, or generated `Routes`
- a substitute for integration tests

If a spec starts with routes, DTOs, or file paths before it explains the user or business problem, it is too low-level.

Use specs to describe why the change matters, what behavior should exist afterwards, and how the implementation will be verified. Let source code, generated route types, docs, and integration tests prove the final contract.

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

Do not add extra companion artifacts in this rollout such as:
- `plan.md`
- `tasks.md`
- `analysis/`
