---
name: code-review
description: Review code changes for contract compliance, type safety, and regression risk. Use after completing any non-trivial implementation, before merging PRs, or when asked to review code quality across any mercur package.
allowed-tools: Read, Grep, Glob
---

# Code Review

Use this skill when:
- reviewing a PR or diff across any mercur package
- completing a non-trivial implementation and want a self-check
- asked to review code quality, contract compliance, or regression risk
- `admin-ui-review` is too narrow (backend, registry, cross-package changes)

For admin UI-specific review, prefer `admin-ui-review` — it has deeper UI pattern coverage.

## Review Process

1. Identify all changed files (staged + unstaged if relevant)
2. Classify each change by area: API, types, registry, admin, vendor, config, docs
3. Run the area-specific checks from `references/review-checklist.md`
4. Report findings ordered by severity
5. State what was verified and what remains untested

## Severity Levels

- **P1 (Blocker)**: breaks a public contract, introduces runtime error, security issue, data loss risk
- **P2 (Should fix)**: type safety gap, missing validation, inconsistent pattern, missing i18n
- **P3 (Suggestion)**: naming, style, minor improvement, documentation gap

## Hard Rules

1. Do not approve changes that silently alter public contract surfaces (see constitution)
2. Do not approve `any` types on public API boundaries or shared DTOs
3. Do not approve registry blocks that import from `@components/`, `@hooks/`, `@lib/`
4. Do not approve barrel `index.ts` in registry `workflows/` or `steps/`
5. Do not approve route handlers without concrete generics on `AuthenticatedMedusaRequest<T>` / `MedusaResponse<T>`
6. Flag keyboard submit paths that lack handler-level guards
7. Flag missing migration/compatibility notes when frozen surfaces change

## What to Check First

Prioritize checks by blast radius:

1. **Contract changes** — API paths, response shapes, generated types, CLI commands
2. **Type safety** — `any` on boundaries, missing generics, type widening
3. **Registry integrity** — import paths, barrel files, file layout, docs field
4. **Behavioral regression** — submit guards, loading states, error handling
5. **Cross-package impact** — changes that touch multiple package boundaries
6. **Pattern consistency** — last, after safety is confirmed

## Output Format

### When findings exist:

```
## Code Review: [scope description]

### P1 (Blocker)
1. **[Issue]** in `file:line` — [description]
   Fix: [concrete suggestion]

### P2 (Should fix)
1. **[Issue]** in `file:line` — [description]

### P3 (Suggestion)
1. **[Issue]** in `file:line` — [description]

### Verified
- [what was checked]

### Not verified
- [what was skipped and why]

### Residual risk
- [any remaining concerns]
```

### When no findings:

```
## Code Review: [scope description]

No findings. Changes are consistent with mercur patterns and contracts.

### Verified
- [list of checks performed]

### Not verified
- [anything skipped]
```

## Cross-Package Reviews

When changes span multiple packages:
1. Check each package against constitution package boundaries
2. Verify contract surfaces at package boundaries
3. Check that codegen inputs/outputs are consistent
4. Flag any missing spec (changes spanning 3+ packages require a spec per constitution governance)

## Self-Review Mode

When reviewing your own implementation:
1. Step back from implementation mindset
2. Re-read the original request/spec
3. Check if you introduced anything beyond what was asked
4. Run the checklist as if reviewing someone else's code
5. Be honest about what you didn't test
