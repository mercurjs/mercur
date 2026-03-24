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
- regressions hidden behind “cleaner” API

What to check:
- trace new API from declaration -> read -> actual behavior

How to prevent while coding:
- never commit metadata-only changes without runtime integration in the same patch
- add at least one usage path/test/manual verification for the new abstraction field

## 5. Context typing degraded

Pattern:
- prop drilling removed
- context added with `Record<string, any>`

Impact:
- type safety lost across all sections
- future migrations easier to break

What to check:
- context types in `context.tsx`
- provider value type and hook return type

How to prevent while coding:
- copy the concrete page/domain type first, then refactor sections
- treat context/provider files as typed API boundaries, not temporary plumbing

## 6. Duplicate detail page rendering after CC migration

Pattern:
- detail page route remains direct (`:id -> Component: DetailPage`) while nested routes are attached
- `Root` override check uses only `Children.count(children) > 0`
- non-compound children from route/extensions are treated as full custom composition

Impact:
- duplicated sections/layout on detail screen
- visual "double page" rendering

What to check:
- route topology in `get-route-map.tsx`:
  - parent `:id` should render `Outlet`
  - detail page should be child `path: ""`
- detail root override guard:
  - activates only for known compound nodes (`Layout`, `Main`, `Sidebar`, etc.)
  - does not switch to custom mode for arbitrary children

How to prevent while coding:
- use explicit composition guard and shared helper (`src/lib/compound-composition.ts`)
- follow vendor route structure for nested detail pages
