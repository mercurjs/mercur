# SPEC-XXX: Title

**Date**: YYYY-MM-DD
**Status**: Draft | In Progress | Done
**Related**: issue / task / PR / n/a

<!-- Minimum viable spec: fill sections 1, 2, 4, 8, 11, 13. Add optional sections as needed. -->

## 1. Summary

2-5 sentences:
- what is changing
- who it is for
- why it matters
- what business or product outcome is expected

## 2. Problem

Describe the current problem in product, operational, or developer terms:
- what is broken, missing, expensive, or confusing today
- who feels the pain
- what the observable symptoms are
- why now is the right time to address it

## 3. Desired Outcome (optional)

After this change:
- users can ...
- admins or vendors can ...
- integrators or developers can ...
- the system guarantees ...

## 4. Scope

In scope:
- ...

Out of scope:
- ...

## 5. Users / Actors (optional)

- Admin:
- Vendor:
- Storefront user:
- Developer / integrator:
- System / automation:

Use `n/a` where appropriate.

## 6. Main Flows (optional)

Describe the 1-3 most important flows in plain language.

1. ...
2. ...
3. ...

## 7. Business Rules (optional)

List the rules that must remain true:
- ...
- ...
- ...

Include permissions, ownership, validation expectations, edge cases, and compatibility rules when relevant.

## 8. Acceptance Criteria

- [ ] ...
- [ ] ...
- [ ] ...

Write these as observable outcomes, not implementation tasks.

## 9. Risks (optional)

- Risk:
  Impact:
  Mitigation:

Add more rows as needed.

## 10. Rollout / Migration Notes (optional)

- Breaking change?
- Migration or compatibility bridge needed?
- Data migration needed?
- Docs, config, codegen, or install changes needed?
- Any staged rollout or communication notes?

## 11. Technical Impact

Affected areas (remove anything not touched):
- packages/core-plugin
- packages/admin
- packages/vendor
- packages/registry
- packages/client
- packages/cli
- packages/types
- apps/docs
- integration-tests

Contracts touched:
- API routes:
- request validation:
- response shape:
- generated `Routes`:
- database schema / migrations:
- public package exports:
- CLI:
- registry install paths:
- docs:

Use `n/a` where appropriate.

## 12. Implementation Approach (optional)

Describe the intended implementation at a high level.

### Phase 1
- [ ] ...
- [ ] ...

### Phase 2
- [ ] ...
- [ ] ...

Add or remove phases as needed.

## 13. Verification

- repo or package checks:
- integration tests:
- migration review:
- docs review:
- manual verification:

## 14. Open Questions (optional)

- ...
- ...

## 15. Changelog (optional)

### YYYY-MM-DD
- Initial draft
