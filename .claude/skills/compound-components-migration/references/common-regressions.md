# Common Migration Regressions (Repo-specific)

These are recurring failure modes seen during `packages/admin` migrations to Compound Components / `TabbedForm`.

## 1. Fetch moved to child, gating left behind

Pattern:
- parent used to block rendering/submit until query was ready
- query moved into child form/section
- submit logic still depends on query-derived data

Impact:
- invalid payloads (e.g. missing mapping data)
- race conditions visible only under slow network

What to check:
- search for moved hooks like `useRegions`, `useStore`, `usePricePreferences`
- check submit handlers for derived maps or normalization dependencies

How to prevent while coding:
- move `isPending/isError` handling together with the query
- add submit guard when normalization depends on query data
- verify keyboard submit path, not only button clicks

## 2. Keyboard submit bypasses loading state

Pattern:
- buttons show `isLoading` / disabled
- `KeyboundForm` / keyboard handler still calls `onSubmit`

Impact:
- submit during async preload
- duplicate submit paths not protected by UI state

What to check:
- `Enter`, `Ctrl/Cmd+Enter`, custom keyboard handlers
- logic-level guard in submit handler

How to prevent while coding:
- add a submit-level guard for critical async dependencies
- if `TabbedForm`/keyboard wrapper exists, ensure it checks loading before calling `onSubmit`

## 3. Dynamic tabs hide active tab

Pattern:
- `isVisible` changes based on form values
- active tab disappears
- tab state logic assumes active tab still exists

Impact:
- inconsistent UI state
- runtime errors (`findIndex` = `-1`, invalid array access)

What to check:
- normalization of `activeTabId` when `visibleTabs` changes
- guards around `currentIndex === -1`

How to prevent while coding:
- treat `visibleTabs` as dynamic from day one
- add fallback active-tab resolution in effect/state sync code before wiring validation ranges

## 4. Dead abstraction API

Pattern:
- new metadata/props introduced (`validationFields`, etc.)
- runtime logic ignores them

Impact:
- false confidence
- regressions hidden behind "cleaner" API

What to check:
- trace new API from declaration -> read -> actual behavior

How to prevent while coding:
- never commit metadata-only changes without runtime integration in the same patch
- add at least one usage path/test/manual verification for the new abstraction field

## 5. Unnecessary context/provider introduced

Pattern:
- prop drilling replaced with context/provider
- adds complexity without benefit (Root already has the data)

Impact:
- extra abstraction layer for no gain
- consumers can't access data without being inside provider
- diverges from vendor standard

What to check:
- detail pages should NOT have context/provider
- sections should accept data as props from Root
- no `useXxxDetailContext()` hooks

How to prevent while coding:
- keep existing prop drilling pattern — Root fetches, passes as props
- never introduce context for detail page compounds

## 6. Duplicate page rendering after CC migration (detail pages)

Pattern:
- detail page switched to compound pattern
- route remains `:id -> Component: DetailPage` while nested routes are also attached
- `Root` uses broad override check (`Children.count(children) > 0`) and treats any child as custom composition

Impact:
- same detail sections can render twice
- visual duplication of entire screen or duplicated section stacks
- hard-to-debug behavior varying by route extension setup

What to check:
- route topology in `get-route-map.tsx`:
  - `:id` should usually be `Component: Outlet`
  - detail page should be child route at `path: ""`
- override guard in detail root:
  - custom composition should activate only for known compound nodes (`Layout`, `Main`, `Sidebar`, etc.)
  - avoid generic `Children.count(children) > 0` for this decision
- verify against extension/custom route merge behavior

How to prevent while coding:
- use explicit composition guard (`hasExplicitCompoundComposition`) with allowed types
- reuse shared helper in `src/lib/compound-composition.ts`
- keep route structure aligned with vendor detail pattern (`Outlet` parent + index child)
