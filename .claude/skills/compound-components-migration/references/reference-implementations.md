# Reference Implementations

Verified, correct implementations to use as templates when migrating or reviewing code.
All paths relative to `packages/admin/src/`.

---

## 1. TabbedForm Infrastructure

The core engine. Read these to understand how tabs, validation, and keyboard submit work.

### `components/tabbed-form/types.ts` — Tab contract + `defineTabMeta`

Key patterns:
- `TabDefinition<T>` typed with `FieldPath<T>` for `validationFields`
- `defineTabMeta<T>()` helper with dev-time warnings for missing `id`/`labelKey`
- JSDoc on every field

### `components/tabbed-form/use-tab-management.ts` — Navigation + validation logic

Key patterns:
- `validateTab()` — per-tab partial validation via `validationFields`, fallback to full `form.trigger()`
- `validateTabRange()` — sequential validation of tabs between current and target
- `onNext()` — validates only current tab's `validationFields`
- `onTabChange()` — backward = no validation, forward = validate range
- Active tab disappearing: `useEffect` detects `activeTabId` missing from `visibleTabs`, falls back to first visible tab
- Guard for `currentIndex === -1` in `onTabChange` when active tab was hidden

### `components/tabbed-form/tabbed-form.tsx` — Root component + keyboard handler

Key patterns:
- `resolveTabMeta()` reads `_tabMeta` static property from child components, with dev warnings
- `collectTabs()` auto-discovers tabs from children
- `transformTabs` prop for runtime visibility changes
- Keyboard: `Ctrl/Cmd+Enter` blocked when `isLoading === true` (line ~156)
- `TabbedFormContext` provides form to children via `useTabbedForm()`
- `Children` override: consumer can pass custom children

---

## 2. Detail Page — Compound Component (no context)

### `pages/customers/customer-detail/customer-detail.tsx` — `CustomerDetailPage` compound

Key patterns:
- `Root` owns data fetching (`useCustomer`) + loading/error gating
- **No context/provider** — data passed as props to section components
- `Children.count(children) > 0` for custom composition override
- **No `Layout` wrapper** — `TwoColumnPage` inlined directly in Root with `data={customer}`, `hasOutlet`, `showJSON`, `showMetadata`
- Section slots use `Main`/`Sidebar` prefix matching their layout position:
  - `MainGeneralSection`, `MainOrderSection`, `MainGroupSection`
  - `SidebarAddressSection`
- Sections accept data as props: `({ customer }: { customer: HttpTypes.AdminCustomer })`

### `pages/customers/customer-detail/index.ts` — Route index

```typescript
export { CustomerDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
export { CustomerDetailPage as Component } from "./customer-detail"
export { customerLoader as loader } from "./loader"
```

---

## 3. Detail Page — Product Variant Detail

### `pages/product-variants/product-variant-detail/product-variant-detail.tsx` — `ProductVariantDetailPage` compound

Key patterns:
- Same structure as CustomerDetailPage (Root + inline TwoColumnPage, no Layout, no context)
- Fetches both `useProduct` (for seller) and `useProductVariant` (for variant data)
- Data passed as props to sections
- Section slots: `MainGeneralSection`, `MainInventorySection`, `SidebarSellerSection`, `SidebarPricesSection`
- `hasOutlet` on TwoColumnPage in Root's default composition

---

## 4. List Page — Nested Header Compounds

### `pages/products/product-list/product-list.tsx` — `ProductListPage` compound

Key patterns:
- No context needed (table is self-contained)
- `Root` wraps `SingleColumnPage` with `Children.count` override
- Nested header compounds hierarchy:
  ```
  ProductListPage
  ├── Table (Container with Header + DataTable + Outlet)
  │   ├── Header (title + actions, Children.count override)
  │   │   ├── HeaderTitle (Heading)
  │   │   └── HeaderActions (Children.count override)
  │   │       ├── HeaderExportButton
  │   │       ├── HeaderImportButton
  │   │       └── HeaderCreateButton
  │   └── DataTable (raw data grid, self-contained fetch)
  ```
- Each level has `Children.count(children) > 0` override
- Export/Import buttons preserve `location.search`
- `Object.assign` exposes: `Table`, `Header`, `HeaderTitle`, `HeaderActions`, `HeaderCreateButton`, `HeaderExportButton`, `HeaderImportButton`, `DataTable`

### `pages/products/product-list/components/product-list-table/product-list-table.tsx` — All sub-compounds

Key patterns:
- `ProductListDataTable` — self-contained: owns `useProducts()`, `useDataTable()`, filters, columns
- `ProductListTable` — Container with `children` (not `header` prop), renders `<Outlet />` after content
- `ProductListHeader`, `ProductListActions` — each with `Children.count` override
- Individual button components: `ProductListTitle`, `ProductListCreateButton`, `ProductListExportButton`, `ProductListImportButton`

---

## 5. TabbedForm Consumer — Product Create (with async gating)

### `pages/products/product-create/components/product-create-form/product-create-form.tsx`

Key patterns:
- `useRegions()` with full `isPending/isError/error` handling
- `isRegionsError` → `throw regionsError` (error boundary)
- **Submit guard**: `if (isRegionsPending) return` at top of `handleSubmit`
- **Loading propagation**: `isLoading={isPending || isRegionsPending}` blocks buttons AND keyboard
- `transformTabs` dynamically sets `isVisible` on inventory tab based on `watchedVariants`
- `Children.count(children) > 0` for custom children override
- Custom footer render prop with Save Draft + Publish buttons

### `pages/products/product-create/components/product-create-details-form/product-create-details-form.tsx` — Tab with `defineTabMeta`

Key patterns:
- `defineTabMeta<ProductCreateSchemaType>()` with concrete schema type
- `validationFields` lists only fields owned by this tab
- Simple layout component — no form logic, uses `useTabbedForm()` in children

---

## 6. TabbedForm Consumer — Create Product Variant (with dynamic tabs)

### `pages/products/product-create-variant/components/create-product-variant-form/create-product-variant-form.tsx`

Key patterns:
- `useForm` with `zodResolver`
- `useWatch` on `manage_inventory` + `inventory_kit` to compute `inventoryTabEnabled`
- `useFieldArray` auto-appends blank inventory item when kit toggled on
- `transformTabs` sets `isVisible: () => !!inventoryTabEnabled` on inventory tab
- Three child tabs: `<DetailsTab>`, `<PricingTab>`, `<InventoryKitTab>`

### `pages/products/product-create-variant/components/create-product-variant-form/details-tab.tsx` — Tab with per-field validation

Key patterns:
- `defineTabMeta<z.infer<typeof CreateProductVariantSchema>>()` — schema-level typing
- `validationFields: ["title", "sku", "manage_inventory", "allow_backorder", "inventory_kit", "options"]`
- Uses `useTabbedForm()` to access shared form — no prop drilling for form

### `pages/products/product-create-variant/components/create-product-variant-form/constants.ts` — Schema + field extraction

Key patterns:
- `CreateVariantDetailsSchema = CreateProductVariantSchema.pick(...)` — Zod pick for per-tab schema
- `CreateVariantDetailsFields = Object.keys(schema.shape)` — auto-derived field list
- Reusable across `_tabMeta.validationFields` and standalone validation

---

## 7. TabbedForm Consumer — Variants DataGrid Tab (typed columns)

### `pages/products/product-create/components/product-create-variants-form/product-create-variants-form.tsx`

Key patterns:
- `VariantRow = ProductCreateVariantSchema & { originalIndex: number }` — extended row type
- `columnHelper = createDataGridHelper<VariantRow, ProductCreateSchemaType>()`
- `regions: HttpTypes.AdminRegion[]`, `pricePreferences: HttpTypes.AdminPricePreference[]` — no `any`
- `useTabbedForm()` for form access
- `defineTabMeta` with `validationFields: ["variants"]`

---

## 8. Barrel Export — `pages/index.ts`

```typescript
export { CustomerDetailPage } from "./customers/customer-detail/customer-detail"
export { CustomerListPage } from "./customers/customer-list/customer-list"
export { ProductDetailPage } from "./products/product-detail/product-detail"
export { ProductListPage } from "./products/product-list/product-list"
export { ProductVariantDetailPage } from "./product-variants/product-variant-detail/product-variant-detail"
```

Key patterns:
- Named exports (`ProductDetailPage`), NOT `as Component`
- No context type exports (no context pattern)
- Consumer imports: `import { CustomerDetailPage } from "@mercurjs/admin/pages"`

---

## Quick Pattern Reference

| Pattern | Reference file |
|---------|---------------|
| `defineTabMeta` with `validationFields` | `product-create-details-form.tsx`, `details-tab.tsx` |
| Async submit guard (`isRegionsPending`) | `product-create-form.tsx` :88 |
| Keyboard submit blocked by `isLoading` | `tabbed-form.tsx` :156 |
| Dynamic tab `isVisible` + `transformTabs` | `product-create-form.tsx` :157, `create-product-variant-form.tsx` :84 |
| Active tab fallback on disappear | `use-tab-management.ts` :66-73 |
| Detail page (no context, props, no Layout) | `customer-detail.tsx` |
| Children override (`Children.count`) | `customer-detail.tsx`, `product-create-form.tsx` |
| Typed DataGrid columns (no `any`) | `product-create-variants-form.tsx` :98-101 |
| Nested header compounds | `product-list-table.tsx` (Header→Title+Actions→Buttons) |
| `Main`/`Sidebar` slot prefixes | `customer-detail.tsx`, `product-variant-detail.tsx` |
| Sections with typed props | `customer-general-section.tsx` (`{ customer: HttpTypes.AdminCustomer }`) |
| List page (no context) | `product-list.tsx`, `customer-list.tsx` |
