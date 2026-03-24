# Compound Components / TabbedForm Migration Checklist (Implementation + Review)

Use this checklist during coding and again before merge.

## 0. Before Coding (design checks)

- Did you identify the migration type (list / detail+context / tabbed form)?
- Did you open the vendor/admin reference implementation first?
- Did you list the current behavioral contracts that must not change (loading/error gating, keyboard shortcuts, dynamic tab visibility)?
- If moving fetches between components, did you decide where `ready/isPending/isError` logic will live after migration?

## 1. During Coding (behavior-preserving changes)

- `Root` supports child override (`Children.count(children) > 0`)?
- For detail pages with nested routes/extensions, is override guard explicit (compound nodes only) and not just `Children.count(children) > 0`?
- Default composition still renders the same page anatomy?
- Provider wraps default composition (detail pages)?
- `useContext` hook throws outside provider?
- Context/provider types remain domain-safe (no new `any`)?
- If exporting `Main`/`Sidebar`/sections, is there a safe/canonical wrapper (`Layout`)?

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
- Canonical usage example exists (inline comment, doc, or obvious exported `Layout`)?
- Custom composition path preserves provider/layout/data requirements?
- Detail route topology for nested pages follows `:id -> Outlet` + child `path: "" -> DetailPage`?

## 6. Typing

- No new `any` or `Record<string, any>` in context/providers?
- Domain types use `HttpTypes.*` or explicit local aliases?
- New abstraction APIs are typed and constrained?

## 7. Regression Validation (before merge)

- Manual smoke test default page composition
- Manual smoke test one custom composition (if API changed)
- Manual smoke test that detail sections/layout are not duplicated
- Manual or automated test for keyboard submit
- Manual or automated test for dynamic tab visibility (if present)
- Manual or automated test for one async-loading submit dependency path (if present)
