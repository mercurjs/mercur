# Compound Components / TabbedForm Migration Checklist (Implementation + Review)

Use this checklist during coding and again before merge.

## 0. Before Coding (design checks)

- Did you identify the migration type (list / detail / tabbed form)?
- Did you open the vendor/admin reference implementation first?
- Did you list the current behavioral contracts that must not change (loading/error gating, keyboard shortcuts, dynamic tab visibility)?
- If moving fetches between components, did you decide where `ready/isPending/isError` logic will live after migration?

## 1. During Coding (behavior-preserving changes)

- `Root` supports child override (`Children.count(children) > 0`)?
- If detail page has nested routes/extensions, is override guard explicit (compound nodes only) rather than generic `Children.count(children) > 0`?
- Default composition still renders the same page anatomy?
- No context/provider — Root passes data as props to sections?
- No `Layout` wrapper — `TwoColumnPage` inlined in Root?
- Prop types remain domain-safe (no new `any`)?

## 2. Data / Async Safety

- If fetch moved from parent to child, were `ready`, `isPending`, and `isError` behaviors preserved?
- Can submit run before required query data exists?
- Does submit logic have a guard for required async dependencies?

## 3. Keyboard Paths

- `Enter` behavior still matches previous UX?
- `Ctrl/Cmd+Enter` respects loading/disabled state?
- Keyboard shortcuts do not bypass critical validation or loading guards?

## 4. TabbedForm / Wizard Behavior

- `validationFields` are actually used by runtime logic?
- Forward navigation validates only intended tab scope?
- Backward navigation is unblocked?
- Dynamic tab visibility (`isVisible`) handles active tab disappearing?
- No crash when visible tab set changes?
- If tab metadata was introduced, was runtime wiring added in the same patch?

## 5. Compound Component API

- Exported subcomponents are named consistently and are hard to misuse?
- Custom composition path works (Root renders children as-is when present)?
- Slot names use `Main`/`Sidebar` prefix for detail pages?
- Root component uses `Page` suffix (`XxxDetailPage`, `XxxListPage`)?
- List headers use nested compounds (not render props)?
- Page exported from `src/pages/index.ts`?
- Detail route topology for nested routes uses vendor pattern (`:id` parent with `Component: Outlet`, detail page at child `path: ""`)?

## 6. Typing

- No new `any` or `Record<string, any>` in prop types?
- Domain types use `HttpTypes.*` or explicit local aliases?
- New abstraction APIs are typed and constrained?
- Section props use `HttpTypes.AdminXxx` (not `Record<string, any>`)?

## 7. Regression Validation (before merge)

- Manual smoke test default page composition
- Manual smoke test one custom composition (if API changed)
- Manual smoke test that detail page sections are rendered once (no duplicate layout/sections)
- Manual or automated test for keyboard submit
- Manual or automated test for dynamic tab visibility (if present)
- Manual or automated test for one async-loading submit dependency path (if present)
