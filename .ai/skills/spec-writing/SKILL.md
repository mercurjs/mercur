---
name: spec-writing
description: Write or review Mercur specifications following the skeleton-first approach. Use when creating a new spec, refining an existing spec, or reviewing spec quality before implementation.
argument-hint: "[SPEC-XXX or topic]"
---

# Spec Writing

Use this skill when:
- creating a new specification for a qualifying change
- refining or completing a draft spec
- reviewing spec quality before implementation begins
- unsure whether a change needs a spec (check the threshold below)

## Spec Threshold

A spec is required when a change:
- spans more than one package
- changes API behavior, request validation, or response shape
- changes generated route/client behavior
- changes shared DTOs or public types consumed across packages
- changes registry block installation behavior or copied file layout
- changes a persistent data model or requires database migrations
- changes a major admin or vendor user flow
- changes docs and code contracts together
- introduces migration, compatibility, or rollout concerns

A spec is usually NOT required for:
- typo fixes
- isolated refactors with no behavior change
- small bug fixes contained to one package
- styling-only or copy-only UI edits

## Workflow: Writing a Spec

### 1. Pick a spec ID

Format: `SPEC-XXX-short-description.md` in `.ai/specs/`.
Check existing specs to pick the next number.

### 2. Start with the skeleton

Copy `.ai/specs/TEMPLATE.md` and fill the **required sections first**:

| Section | Required | Purpose |
|---------|----------|---------|
| Summary | Yes | One paragraph — what and why |
| Problem Statement | Yes | What's wrong or missing today |
| Scope | Yes | In-scope and out-of-scope boundaries |
| Acceptance Criteria | Yes | How we know it's done |
| Technical Impact | Yes | Touched packages, contracts, migrations |
| Verification | Yes | How to prove the change works |
| Open Questions | Yes | Unknowns that must be resolved before implementation |
| Alternatives Considered | No | Other approaches and why they were rejected |
| Implementation Phases | No | Phased delivery plan |
| Rollout & Migration | No | Only if backward compatibility is a concern |

### 3. Business-first, then technical

Write the **why** before the **how**:
- Summary and Problem Statement explain the business need
- Scope sets boundaries so implementation doesn't creep
- Acceptance Criteria define done in user/business terms
- Technical Impact and Implementation Phases come last

### 4. Open Questions gate

**STOP** if there are critical unknowns in the Open Questions section.

Do not begin implementation with unresolved questions about:
- data model changes
- cross-package contract impact
- user-facing behavior decisions
- migration requirements

Mark the spec as `Draft` until critical questions are resolved.

### 5. Mark status

Use the Status field in the spec header:
- **Draft**: being written, has open questions
- **Ready**: all critical questions resolved, ready for implementation
- **In Progress**: implementation underway
- **Done**: implemented and verified

## Workflow: Reviewing a Spec

### Check for completeness

1. Are all required sections filled?
2. Does the Summary clearly state what AND why?
3. Is Scope explicit about what's out-of-scope?
4. Are Acceptance Criteria testable (not vague)?
5. Does Technical Impact list all touched packages and contracts?
6. Is Verification concrete (commands, checks, not "test it")?
7. Are Open Questions either resolved or explicitly blocking?

### Check for quality

1. **Business-first**: Does the spec lead with the problem, not the solution?
2. **Minimal scope**: Is the scope the smallest that solves the problem?
3. **No implementation leak**: Are Acceptance Criteria about behavior, not code structure?
4. **Contract awareness**: Are public contract surfaces identified?
5. **Migration notes**: If frozen surfaces change, are migration notes present?

## Output Format

### When writing a spec:

Produce the spec file following the template. Mark it `Draft` if open questions remain.

### When reviewing a spec:

```
## Spec Review: SPEC-XXX

### Missing
- [required sections or information that's absent]

### Concerns
- [quality issues, scope creep, vague criteria]

### Ready for implementation?
[Yes / No — with reason if No]
```

## References

- Spec template: `.ai/specs/TEMPLATE.md`
- Spec directory: `.ai/specs/`
- Spec threshold: root `AGENTS.md` → "When A Spec Is Required"
