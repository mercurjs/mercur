# CC Alignment Checklist

Step-by-step workflow for aligning an existing CC page to vendor standard.

## Pre-flight

- [ ] Read current component file — identify export name, slot names, missing slots
- [ ] Read current `index.ts` — identify `as Component` export
- [ ] Read `pages/index.ts` — identify current barrel export
- [ ] Check if testing registry has consumer pages for this component

## Detail Page Alignment

### 1. Component file (`xxx-detail.tsx`)

- [ ] Rename export: `XxxDetail` → `XxxDetailPage`
- [ ] Prefix main slots: `GeneralSection` → `MainGeneralSection`, etc.
- [ ] Prefix sidebar slots: `SalesChannelSection` → `SidebarSalesChannelSection`, etc.
- [ ] Add missing slots (e.g., `SidebarSellerSection` if seller section exists in default composition)
- [ ] Remove dead slots (e.g., references to non-existent components)
- [ ] Verify: NO context/provider — Root fetches data and passes as props to sections
- [ ] Verify: NO `Layout` wrapper — `TwoColumnPage` inlined directly in Root's default composition (with `data`, `hasOutlet`, `showJSON`, `showMetadata`)
- [ ] Verify: `Main`, `Sidebar` slots remain on compound (NO `useContext`, NO `Layout`)
- [ ] Verify: default composition JSX unchanged (only Object.assign keys change)
- [ ] If detail page can receive nested route/extension children, use explicit compound composition guard (not generic `Children.count(children) > 0`)
- [ ] Prefer shared helper: `src/lib/compound-composition.ts`

### 2. Route index (`xxx-detail/index.ts`)

- [ ] `XxxDetail as Component` → `XxxDetailPage as Component`
- [ ] Remove any `export type { XxxDetailContextValue }` (no context)

### 2.5 Route map topology (`get-route-map.tsx`)

- [ ] For nested detail pages, `:id` route uses `Component: Outlet` (not detail page component directly)
- [ ] Detail page is mounted at child route `path: ""`
- [ ] Nested drawers/modals (`edit`, `metadata`, etc.) remain children of that `path: ""` detail node

### 3. Barrel (`pages/index.ts`)

- [ ] Replace old named export with new: `export { XxxDetailPage } from "..."`
- [ ] Remove any context type exports (no context)

### 4. Testing registry consumer

- [ ] Remove fallback aliases (e.g., `?? AdminPages.ProductDetail`)
- [ ] Use new slot names directly: `ProductDetailPage.MainGeneralSection`
- [ ] Import directly: `import { ProductDetailPage } from "@mercurjs/admin/pages"`

## List Page Alignment

### 1. Table component file (`xxx-list-table.tsx`)

- [ ] Extract individual button components (`CreateButton`, `ExportButton`, etc.)
- [ ] Extract `XxxListTitle` component
- [ ] Extract `XxxListActions` with `Children.count` override
- [ ] Extract `XxxListHeader` with `Children.count` override
- [ ] Extract `XxxListDataTable` (data grid without header)
- [ ] Refactor `XxxListTable` from `header?: ReactNode` prop to `children?: ReactNode`
- [ ] Verify: `location.search` preserved on export/import links
- [ ] Verify: `<Outlet />` still rendered in Table

### 2. Table barrel (`xxx-list-table/index.ts`)

- [ ] Export all new sub-components

### 3. Root component file (`xxx-list.tsx`)

- [ ] Rename export: `XxxList` → `XxxListPage`
- [ ] `Object.assign` exposes: `Table`, `Header`, `HeaderTitle`, `HeaderActions`, `HeaderCreateButton`, `HeaderExportButton`, `HeaderImportButton`, `DataTable`

### 4. Route index, barrel, testing registry — same as detail page

## Post-flight

- [ ] `npx tsup` passes (ESM + DTS)
- [ ] Dev server rebuilt/reloaded after package changes (to avoid stale bundle false positives)
- [ ] Grep: no old export names in `pages/index.ts`
- [ ] Grep: no dead slot references (e.g., `AdditionalAttributeSection`)
- [ ] `dist/pages/index.js` contains new exports
- [ ] `dist/pages/index.d.ts` exists and has types
- [ ] Testing registry imports resolve without `implicit any` error
- [ ] Customer/Product/Order detail pages do not render duplicated section stacks
- [ ] Grep: no `Layout` wrapper in any `*-detail.tsx` compound (vendor standard: inline `TwoColumnPage` in Root)
- [ ] Grep: no `.Layout` usage in testing registry consumer pages
