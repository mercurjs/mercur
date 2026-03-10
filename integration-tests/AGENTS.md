# Integration Tests Guide

This guide covers work in `integration-tests`.

Read this guide when a task touches:
- backend API behavior
- request validation or response shape
- auth, permissions, or route access rules
- anything that could cause contract drift between implementation and public usage

## Scope

`integration-tests` owns:
- HTTP behavior verification across admin, vendor, store, and hook routes
- regression coverage for public contract changes
- shared test helpers for user setup and auth context

## When tests are expected

Add or update integration coverage when a change:
- modifies route behavior, validation, or response shape
- changes auth, access, or ownership rules
- changes pagination, filtering, or query semantics
- changes a public flow consumed by admin or vendor packages

You usually do not need new integration coverage for:
- purely internal refactors with unchanged route behavior
- docs-only changes
- package-local UI changes with no backend contract impact

## Preferred Patterns

- Keep tests close to the affected HTTP surface area.
- Reuse shared helpers for admin, seller, and customer setup.
- Assert both status codes and response structure for contract-sensitive changes.
- Prefer explicit fixtures created inside the test over implicit assumptions.
- Cover authorization and ownership boundaries when relevant.

## Avoid

- Updating backend contracts without updating the corresponding tests
- Asserting only happy paths when auth or validation behavior changed
- Overfitting tests to unstable implementation details instead of public behavior

## Verification

For API-facing changes, verify the smallest relevant set:
- `bun run check-types`
- `bun run test:integration:http` from `integration-tests` for targeted route coverage
- any additional scenario needed to prove changed validation, auth, or ownership rules

If no integration test was added for a contract-sensitive change, explain why in the task summary or spec.
