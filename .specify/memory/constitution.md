# Mercur Constitution

## Core Principles

### I. Block-Based Architecture

Every marketplace feature is a **block** — a self-contained unit of modules, workflows, API routes, and UI extensions. Blocks are copied into the project via CLI, not linked or imported as dependencies. The developer owns the full source code after installation. No black-box packages.

### II. Medusa Foundation

Mercur **extends** the Medusa framework — it does not replace or patch it. All commerce primitives (products, carts, orders, pricing, fulfillment, payments) come from Medusa. Mercur builds the marketplace layer on top: sellers, commissions, payouts, order splitting, vendor portal. Use Medusa's module/workflow/link/subscriber system. Do not bypass it.

### III. Package Boundaries

Each package has one responsibility. Do not mix concerns across packages:

| Package | Responsibility |
|---------|---------------|
| `packages/core-plugin` | Backend marketplace logic (modules, workflows, providers) |
| `packages/admin` | Admin dashboard UI |
| `packages/dashboard-shared` | Shared UI components for admin and vendor dashboards |
| `packages/registry` | Official block definitions and source code |
| `packages/cli` | Developer and agent-facing CLI tool |
| `packages/dashboard-sdk` | Vite plugin for admin/vendor panel routing |
| `packages/vendor` | Vendor portal UI framework |
| `packages/client` | Type-safe API client |
| `packages/types` | Shared type definitions and contracts |
| `packages/providers/` | Pluggable provider implementations (e.g., `payout-stripe-connect`) |
| `apps/docs` | Mintlify documentation site |
| `templates/basic` | Starter template shipped to users |

A change should touch the minimum number of packages necessary. If a change spans 3+ packages, it likely needs a spec first.

### IV. Typed Contracts

API routes use concrete generics: `AuthenticatedMedusaRequest<BodyType>` and `MedusaResponse<ResponseType>`. No `any` on public boundaries or shared DTOs. Codegen (`mercurjs codegen`) reads these generics to produce client types — they are the source of truth, not documentation.

### V. CLI-Native

The CLI (`mercurjs`) is the primary interface for both developers and AI agents. `add`, `diff`, `codegen`, `search`, `view` — not manual file copying. AI agents interact with the project through CLI commands, not by reverse-engineering file structures.

### VI. Minimal Complexity

YAGNI. Do not add abstractions for hypothetical future needs. Three similar lines of code are better than a premature abstraction. No feature flags, backwards-compatibility shims, or configurability beyond what the current task requires. If you can delete it, delete it.

## Technology Stack

- **Language**: TypeScript (strict)
- **Foundation**: MedusaJS v2 (headless commerce)
- **Monorepo**: Turborepo
- **Package Manager**: bun
- **Frontend**: React + Vite (dashboard-sdk for routing)
- **Database**: PostgreSQL (via Medusa)
- **Docs**: Mintlify (MDX)

## Governance

### Spec-Before-Code

Changes that span multiple packages, alter API contracts, modify data models, or change block installation behavior require a spec before implementation. Use `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`.

### Constitution Hierarchy

Constitution principles override all other guidance. Skills encode domain-specific rules but cannot contradict the constitution. When in conflict: constitution > skills > CLAUDE.md.

### Amendments

Changes to this constitution require team review. Document the change, rationale, and migration impact before amending.

**Version**: 1.0.0 | **Ratified**: 2026-03-23 | **Last Amended**: 2026-03-23
