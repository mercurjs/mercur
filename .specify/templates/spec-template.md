# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## Mercur Context *(mandatory)*

<!--
  Identify which parts of the Mercur platform this feature touches.
  This section helps agents understand scope and load the right skills.
-->

### Affected Packages

<!-- Check all that apply and remove the rest -->

- [ ] `packages/core-plugin` — Backend modules, workflows, providers
- [ ] `packages/admin` — Admin dashboard UI
- [ ] `packages/dashboard-shared` — Shared UI components for admin and vendor
- [ ] `packages/registry` — Block definitions (new block or modification)
- [ ] `packages/cli` — CLI commands or behavior
- [ ] `packages/client` — API client types or methods
- [ ] `packages/dashboard-sdk` — Vite plugin, routing, virtual modules
- [ ] `packages/vendor` — Vendor portal UI
- [ ] `packages/types` — Shared type definitions
- [ ] `packages/providers/` — Pluggable provider implementations (e.g., payout-stripe-connect)
- [ ] `apps/docs` — Documentation
- [ ] `templates/basic` — Starter template

### Feature Type

<!-- Pick one -->

- [ ] **New block** — Self-contained feature (module + workflow + API + UI)
- [ ] **Core extension** — Extends existing Mercur/Medusa functionality
- [ ] **CLI feature** — New or modified CLI command
- [ ] **Dashboard feature** — Admin or vendor panel change
- [ ] **Integration** — Third-party service integration
- [ ] **Docs** — Documentation only
- [ ] **Cross-cutting** — Spans multiple feature types

### Medusa Dependencies

<!-- List any Medusa modules, workflows, or hooks this feature depends on or extends -->

- [e.g., "Extends `completeCartWorkflow` via hook", "Uses `ProductModule`", "None"]

## User Scenarios & Testing *(mandatory)*

<!--
  User stories should be PRIORITIZED as user journeys ordered by importance.
  Each story must be INDEPENDENTLY TESTABLE.

  For marketplace features, consider all three actors:
  - Admin (marketplace operator)
  - Vendor (seller)
  - Customer (buyer/storefront user)
-->

### User Story 1 - [Brief Title] (Priority: P1)

**Actor**: [Admin / Vendor / Customer / Developer]

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

**Actor**: [Admin / Vendor / Customer / Developer]

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when [boundary condition]?
- How does system handle [error scenario]?
- What if a vendor/admin doesn't have the required permissions?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [specific capability]
- **FR-002**: System MUST [specific capability]

### API Contract *(include if feature exposes API routes)*

<!--
  List new or modified endpoints.
  Routes must use AuthenticatedMedusaRequest<T> / MedusaResponse<T>.
  Run `mercurjs codegen` after implementation.
-->

- `POST /vendor/[resource]` — [what it does]
- `GET /admin/[resource]` — [what it does]
- `GET /store/[resource]` — [what it does]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

### Block Structure *(include if this is a new registry block)*

<!--
  Blocks follow a specific structure. See packages/registry/src/ for examples.
  Reference blocks: reviews (simple), team-management (complex).
-->

- Module(s): [what data models]
- Workflow(s): [what business processes]
- API route(s): [admin, vendor, store endpoints]
- Admin UI: [pages/extensions, if any]
- Vendor UI: [pages/extensions, if any]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [Measurable metric]
- **SC-002**: [Measurable metric]
