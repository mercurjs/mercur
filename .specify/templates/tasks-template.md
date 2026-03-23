---
description: "Task list template for Mercur feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation. Within each story, tasks follow Mercur's package layering: core → types → client → UI → docs.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/packages, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths using Mercur package structure

## Mercur Package Layering

Tasks within each story should follow this dependency order:

1. **Core** (`packages/core-plugin/`) — Modules, links, workflows, subscribers
2. **Types** (`packages/types/`) — Shared type definitions
3. **Client** (`packages/client/`) — API client methods
4. **Registry** (`packages/registry/`) — Block definition (if applicable)
5. **Dashboard Shared** (`packages/dashboard-shared/`) — Shared UI components
6. **Admin** (`packages/admin/src/pages/`) — Admin dashboard pages
7. **Vendor** (`packages/vendor/src/pages/`) — Vendor portal pages
8. **Docs** (`apps/docs/`) — Documentation pages
9. **Template** (`templates/basic/`) — Starter template updates

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities)
  - Affected packages from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  - Mercur-specific rules from plan.md

  Tasks MUST use actual Mercur paths (packages/core-plugin/src/modules/..., etc.)
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared dependencies

- [ ] T001 Create module directory structure in `packages/core-plugin/src/modules/[name]/`
- [ ] T002 [P] Add type definitions to `packages/types/src/`
- [ ] T003 [P] Add module link definitions in `packages/core-plugin/src/links/`

---

## Phase 2: Core Backend

**Purpose**: Modules, workflows, and API routes — MUST be complete before UI work

- [ ] T004 Implement data model in `packages/core-plugin/src/modules/[name]/models/`
- [ ] T005 Implement module service in `packages/core-plugin/src/modules/[name]/service.ts`
- [ ] T006 [P] Create workflows in `packages/core-plugin/src/workflows/[entity]/workflows/`
- [ ] T007 [P] Create workflow steps in `packages/core-plugin/src/workflows/[entity]/steps/`
- [ ] T008 Add API routes with typed request/response generics
- [ ] T009 Add route middleware and validation
- [ ] T010 Run `mercurjs codegen` to generate client types
- [ ] T011 [P] Add event subscribers if needed

**Checkpoint**: Backend functional — API routes return correct data

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Brief description]
**Actor**: [Admin / Vendor / Customer]
**Independent Test**: [How to verify]

### Implementation

- [ ] T012 [US1] Create admin/vendor page: `packages/admin/src/pages/[path]/index.ts` (exports `{ Component }`) + `packages/admin/src/pages/[path]/[name].tsx` (component file)
- [ ] T013 [US1] Implement data fetching with typed API client
- [ ] T014 [US1] Add form/interaction components using `@medusajs/ui`
- [ ] T015 [US1] Add i18n translations
- [ ] T016 [US1] Wire up to workflows via API calls

**Checkpoint**: User Story 1 independently testable end-to-end

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description]
**Actor**: [Admin / Vendor / Customer]
**Independent Test**: [How to verify]

### Implementation

- [ ] T017 [P] [US2] Create page/components
- [ ] T018 [US2] Implement interaction and data flow
- [ ] T019 [US2] Add i18n translations

**Checkpoint**: User Stories 1 AND 2 both work independently

---

[Add more user story phases as needed]

---

## Phase N: Polish & Cross-Cutting

**Purpose**: Documentation, template updates, registry configuration

- [ ] TXXX [P] Add documentation page in `apps/docs/v2/`
- [ ] TXXX [P] Update `registry.json` with block metadata and `docs` field (if block)
- [ ] TXXX [P] Update starter template if needed (`templates/basic/`)
- [ ] TXXX Run final `mercurjs codegen` and verify types
- [ ] TXXX Verify block install with `mercurjs add [block-name]` (if block)

---

## Dependencies & Execution Order

### Package Dependencies

- **Core** (Phase 2): No dependencies — can start after setup
- **Types/Client**: Depend on core module definitions
- **UI** (Phase 3+): Depends on backend being functional + codegen complete
- **Docs/Template** (Phase N): Depends on feature being stable

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 backend
- **User Story 2 (P2)**: Can start after Phase 2 backend — independent of US1
- Stories can be worked on in parallel if they touch different packages

### Parallel Opportunities

- All `[P]` tasks within a phase can run in parallel
- Type definitions and link definitions can be created in parallel
- Different user stories can be implemented in parallel after backend is done
- Documentation and template updates can run in parallel with final polish

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Core Backend
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test end-to-end independently
5. Continue to remaining stories

### Post-Implementation Checklist

- [ ] All API routes have typed generics (no `any`)
- [ ] `mercurjs codegen` runs clean
- [ ] No imports from `@components/`, `@hooks/`, `@lib/` (if block)
- [ ] No barrel `index.ts` in `workflows/` or `steps/` (if block)
- [ ] `registry.json` has `docs` field (if block)
- [ ] i18n for all user-facing strings
- [ ] Routing conventions followed (admin/vendor: `index.ts` exporting `Component` from adjacent file; registry blocks: `page.tsx` with `export default`)
