# Admin Package Companion Notes

Operational package workflow now lives in [`AGENTS.md`](AGENTS.md).

Use this file as a compatibility bridge and specialized companion note for compound component and `TabbedForm` migrations. It intentionally focuses on a narrow topic and should not replace the package workflow guide.

## Compound Components Migration

When migrating admin pages/forms to Compound Components or `TabbedForm`, or reviewing such migrations, follow these rules strictly.

### Migration Types

- **List page**: compound only (`Object.assign(Root, { ... })`)
- **Detail page**: compound only — Root fetches data and passes as props to sections (NO context/provider)
- **Tabbed form**: `TabbedForm` with `_tabMeta` / `defineTabMeta`

### Vendor Standard Conventions

These conventions align admin CC with the vendor package reference standard:

- **Naming**: Use `Page` suffix for compound roots — `XxxDetailPage`, `XxxListPage` (not `XxxDetail`, `XxxList`)
- **Slot naming**: Detail page sections use `Main`/`Sidebar` prefix matching their layout position — `MainGeneralSection`, `SidebarCustomerSection` (not unprefixed `GeneralSection`)
- **List header anatomy**: Nested compounds with `Children.count` at every level — `Header` → `Title` + `Actions` → individual buttons. NO render props (`header={<Custom />}`) for header customization.
- **Table compound**: Separate `Table` (Header + DataTable) and `DataTable` (raw data grid) as distinct slots on list pages
- **Exports**: All CC pages MUST be exported from `src/pages/index.ts` barrel.
- **No context/provider**: Detail pages do NOT use context. Root fetches data and passes it as props to section components. This matches vendor standard and keeps the data flow explicit.

### Hard Rules

1. Do NOT move fetches into child components without preserving `isPending/isError/ready` behavior.
2. Do NOT trust button `disabled/isLoading` alone to block submit — keyboard shortcuts (`Ctrl/Cmd+Enter`) can bypass UI.
3. Do NOT add metadata APIs (`_tabMeta`, `validationFields`) unless runtime logic uses them.
4. Do NOT assume tabs are static if `isVisible` exists — handle active tab disappearing.
5. Do NOT introduce `any` in prop types — use `HttpTypes.*` or explicit domain types.
6. Do NOT create context/provider for detail page compounds — pass data as props from Root to sections (vendor standard).
7. Do NOT widen per-tab validation to full-form validation unless explicitly intended.
8. Do NOT use render props (`header={<Custom />}`) for overridable sections — use nested compound components with `Children.count` at each granularity level.
9. Do NOT create a separate `Layout` wrapper component in detail pages — inline `TwoColumnPage` directly in Root's default composition (vendor standard).
10. DO keep section components accepting data as props (`{ customer }: { customer: HttpTypes.AdminCustomer }`) — NOT via context.

### Implementation Checklist

**Component API:**
- `Root` supports child override (`Children.count(children) > 0`)
- Default composition renders the same page anatomy as before
- Root fetches data and passes as props to sections (no context/provider)
- No `Layout` wrapper — `TwoColumnPage` inlined directly in Root

**Data / Async Safety:**
- If fetch moved from parent to child, preserve `ready`, `isPending`, `isError` behaviors
- Submit logic must have a guard for required async dependencies (e.g. `if (isRegionsPending) return`)
- Verify both button click AND keyboard submit paths

**Keyboard Paths:**
- `Enter` behavior matches previous UX
- `Ctrl/Cmd+Enter` respects loading/disabled state
- Keyboard shortcuts do not bypass critical validation or loading guards

**TabbedForm / Wizard:**
- `validationFields` are actually used by runtime logic (via `defineTabMeta`)
- Forward navigation validates only intended tab scope
- Backward navigation is unblocked (no validation)
- Dynamic tab visibility (`isVisible`) handles active tab disappearing
- Tab metadata introduced with runtime wiring in the same patch

**Typing:**
- No new `any` or `Record<string, any>` in prop types
- Domain types use `HttpTypes.*` or explicit local aliases

### Common Regressions

1. **Fetch moved to child, gating left behind** — submit sends invalid payloads (e.g. `currency_code: undefined` when `regions` not loaded)
2. **Keyboard submit bypasses loading state** — `Ctrl/Cmd+Enter` calls `onSubmit` even when buttons are disabled
3. **Dynamic tabs hide active tab** — `isVisible` changes, active tab disappears, `findIndex` returns `-1` causing crash
4. **Dead abstraction API** — `validationFields` declared but never read by runtime
5. **Context introduced unnecessarily** — detail pages should use props, not context/provider

### TabbedForm API

```typescript
import { defineTabMeta } from "@components/tabbed-form/types"

const MyTab = () => { /* ... */ }
MyTab._tabMeta = defineTabMeta<MyFormSchema>({
  id: "details",
  labelKey: "products.create.tabs.details",
  validationFields: ["title", "handle"],  // per-tab validation
})
```

- `defineTabMeta<T>(meta)` — type-safe helper with dev warnings
- `validationFields` — fields validated on forward navigation; omit for full-form validation
- `isVisible` — predicate for dynamic tab visibility
