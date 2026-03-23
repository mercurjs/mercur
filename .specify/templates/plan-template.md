# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript (strict)
**Foundation**: MedusaJS v2
**Monorepo**: Turborepo with bun
**Frontend**: React + Vite (via @mercurjs/dashboard-sdk)
**Database**: PostgreSQL (via Medusa)
**Testing**: [specify if applicable, e.g., vitest, integration tests]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] Follows block-based architecture (self-contained, installable via CLI)
- [ ] Extends Medusa — does not patch or bypass it
- [ ] Respects package boundaries (see constitution for package responsibilities)
- [ ] API routes use concrete generics (`AuthenticatedMedusaRequest<T>` / `MedusaResponse<T>`)
- [ ] No `any` on public boundaries
- [ ] Minimal complexity — no premature abstractions

## Affected Packages

<!--
  From the spec's "Mercur Context" section.
  For each package, describe what changes.
-->

| Package | Change Description |
|---------|-------------------|
| `packages/core-plugin` | [e.g., "New seller-notifications module"] |
| `packages/registry` | [e.g., "New reviews block"] |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

<!--
  Map where code goes. Use actual Mercur paths.
  Delete rows that don't apply.
-->

```text
packages/core-plugin/
├── src/modules/[module-name]/         # Data models + service
├── src/workflows/[entity]/            # Workflows + steps
├── src/links/                         # Module links
└── src/subscribers/                   # Event subscribers

packages/admin/src/pages/              # Admin dashboard pages (file-based routing)
packages/vendor/src/pages/             # Vendor portal pages (file-based routing)
packages/dashboard-shared/src/         # Shared UI components for admin + vendor

packages/registry/src/[block-name]/    # If this is a registry block
├── modules/
├── workflows/
├── api/
│   ├── admin/
│   ├── vendor/
│   └── store/
├── admin/
│   ├── pages/[resource]/page.tsx      # UI page components
│   └── routes/[resource]/page.tsx     # Route entry points
└── vendor/
    ├── pages/[resource]/page.tsx
    └── routes/[resource]/page.tsx

packages/types/src/                    # Shared type definitions
packages/client/src/                   # API client methods
packages/providers/[provider-name]/    # Pluggable providers (e.g., payout-stripe-connect)
apps/docs/v2/                          # Documentation pages
```

## Mercur-Specific Rules

<!--
  These are hard constraints from the constitution and skills.
  The agent MUST follow them during implementation.
-->

### If this is a registry block:

- Never import from `@components/`, `@hooks/`, `@lib/` — use `@mercurjs/dashboard-shared`
- Registry block pages: `page.tsx` with `export default`
- Admin/vendor pages: `index.ts` exporting `{ Component }` from adjacent named file (e.g., `index.ts` + `feature-name.tsx`)
- Don't create barrel `index.ts` in `workflows/` or `steps/`
- Workflows grouped: `workflows/<entity>/steps/` + `workflows/<entity>/workflows/`
- Multi-resource blocks: root `api/middlewares.ts` aggregates per-resource middleware arrays
- External npm deps go in `dependencies` array in `registry.json`
- Include `docs` field in registry.json with medusa-config, middleware setup, `mercurjs codegen` reminder

### If this touches API routes:

- Route types: `AuthenticatedMedusaRequest<BodyType>` + `MedusaResponse<ResponseType>`
- Codegen reads these generics — they are the source of truth
- Run `mercurjs codegen` after adding/modifying routes
- Seller.id = `auth_context.actor_id` (NOT `members.id`)

### If this touches admin/vendor UI:

- File-based routing via dashboard-sdk
- Use `@medusajs/ui` components
- Follow compound component pattern where applicable
- i18n required for all user-facing strings

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
