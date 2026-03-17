# Lessons

Operational lessons learned from working in the mercur codebase.
Update this file after corrections, regressions, or non-obvious discoveries.

## How to add a lesson

- State the rule clearly as the heading
- Explain why (rationale)
- Note when it applies (scope)
- Give a concrete example if available

## Lessons

### 1. `as const` on tuple arrays breaks `indexOf` type narrowing with enums

**Why**: TypeScript infers `readonly ["a", "b"]` which makes `indexOf` return `number` instead of narrowing — enum comparisons then fail.
**Scope**: Any array used with `.indexOf()` or `.includes()` alongside enum values.
**Fix**: Use explicit `Type[]` annotation instead of `as const`.

### 2. 491+ pre-existing TS errors in core-admin — do not treat as regressions

**Why**: The admin codebase (claims, exchanges, order-edits, etc.) has long-standing type errors that predate current work. Treating them as regressions wastes time and blocks unrelated PRs.
**Scope**: `packages/admin/` — when running `bun run check-types` or reviewing CI failures.

### 3. Form components expect extended types, not base HTTP types

**Why**: Admin forms often need fields beyond what `HttpTypes.AdminProduct` provides (e.g., `shipping_profile`, `sales_channels`). Using the base type causes missing-property errors in form context.
**Scope**: Any admin form that passes data through context or compound component props.
**Example**: Use `AdminProduct & { shipping_profile?: HttpTypes.AdminShippingProfile }` instead of bare `AdminProduct`.

### 4. `useRouteModal()` must be inside `<RouteDrawer>`, not at top-level

**Why**: The hook reads context provided by `RouteDrawer` or `RouteFocusModal`. Calling it outside that tree returns undefined and crashes at runtime.
**Scope**: Any drawer/modal form component in admin or vendor.

### 5. `Seller.id` equals `auth_context.actor_id`, not `members.id`

**Why**: The auth system sets `actor_id` to the seller entity, not the member. Using `members.id` in authorization checks silently fails or returns wrong data.
**Scope**: Backend routes and workflows that need the current seller identity.

### 6. SDK does not support multipart/form-data — file uploads require raw fetch

**Why**: `@mercurjs/client` is generated from typed route contracts that assume JSON bodies. The SDK has no multipart encoding path.
**Scope**: Any feature requiring file upload (images, CSVs, imports).
**Fix**: Use raw `fetch()` with `FormData` for upload endpoints.

### 7. Never import from `@components/`, `@hooks/`, `@lib/` in registry blocks

**Why**: Registry blocks are copied into user projects. Path aliases like `@components/` resolve differently (or not at all) in the target project. Only `@mercurjs/dashboard-shared` is guaranteed to resolve.
**Scope**: All files under `packages/registry/src/`.

### 8. Never create barrel `index.ts` in `workflows/` or `steps/`

**Why**: The CLI copies block files into user projects. A barrel `index.ts` in `workflows/` or `steps/` overwrites existing barrels from other installed blocks, breaking their exports.
**Scope**: Registry block development — `packages/registry/src/*/workflows/` and `steps/`.

### 9. CLI `resolveNestedFilePath()` finds the last path segment — directory structure matters

**Why**: The CLI resolver matches the final directory segment of a target path against the block's file paths. Non-standard nesting causes files to land in wrong locations during `add`.
**Scope**: Registry block file layout — naming directories and nesting depth.

### 10. Guard keyboard submit in handler, not just button UI

**Why**: `KeyboundForm` fires `Ctrl/Cmd+Enter` directly to `onSubmit`. If the guard is only on the button (`disabled={isPending}`), keyboard users can submit while async work is in flight.
**Scope**: Every form using `KeyboundForm` in admin and vendor.
**Fix**: Add `if (isPending) return` at the top of the submit handler function.

### 11. Dynamic tab hiding can leave an invalid active tab

**Why**: When a tab's `isVisible` changes to `false` while it is the active tab, `TabbedForm` does not auto-select a valid tab. The UI shows a blank panel.
**Scope**: Any `TabbedForm` with conditional `isVisible` on tabs.
**Fix**: After visibility changes, normalize active tab to the first visible tab.

### 12. Do not declare metadata APIs unless runtime uses them

**Why**: Adding `_tabMeta.validationFields` or similar metadata without wiring the runtime validation creates a false sense of safety — the fields are declared but never checked.
**Scope**: `TabbedForm` migrations and any pattern that introduces declarative metadata.
**Fix**: Wire runtime behavior in the same patch that introduces the metadata.

### 13. `Children.count(children) > 0` catches nested route children — use composition guard

**Why**: In detail pages, React Router renders `<Outlet />` as a child. `Children.count` returns `> 0` even when no explicit override children are passed, triggering the wrong render path.
**Scope**: Compound component detail pages with nested routes.
**Fix**: Use the shared composition-guard helper from `src/lib/compound-composition.ts`.

### 14. Route type codegen reads generics from request/response types

**Why**: The CLI codegen extracts types from `AuthenticatedMedusaRequest<BodyType>` and `MedusaResponse<ResponseType>` generics. If you use `any` or omit the generic, the generated client types lose safety.
**Scope**: All API route handlers in `packages/core-plugin/` and `packages/registry/`.
**Fix**: Always specify concrete generic types on request and response parameters.

### 15. `docs` field in registry.json must include setup instructions

**Why**: Users installing blocks need to know about `medusa-config.ts` changes, middleware setup, `isQueryable` configuration, and codegen steps. Missing docs means broken installs.
**Scope**: Every block entry in `registry.json`.
**Include**: medusa-config changes, middleware setup, `isQueryable` if applicable, `mercurjs codegen` reminder.
