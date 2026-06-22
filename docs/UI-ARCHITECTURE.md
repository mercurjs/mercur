# UI Architecture — `@mercurjs/admin`, `@mercurjs/vendor`, `@mercurjs/dashboard-shared`

This document is the contract for every UI surface in the Mercur monorepo. It covers three packages that ship one consistent dashboard experience:

- **`@mercurjs/dashboard-shared`** — the design-system layer. React primitives, hooks, and helpers (forms, modals, tables, layout shells, action menus, query-key factory) consumed by both dashboards.
- **`@mercurjs/admin`** — the marketplace **operator** dashboard. Mounted by `apps/admin-test` on port `7000`. Hits `/admin/*` via `sdk.admin.*`.
- **`@mercurjs/vendor`** — the **seller** dashboard. Mounted by `apps/vendor` on port `7001`. Hits `/vendor/*` via `sdk.vendor.*`.

Both dashboards share identical structure, primitives, and visual rules; they differ only in pages, the SDK namespace, sidebar route set, and which audience-specific data they fetch. Whenever this document says "the dashboard" without qualifier, the rule applies to both admin and vendor. Differences are called out explicitly.

## Layer diagram

```
+-----------------------------------------------------------------------+
| Hosts                                                                 |
|   apps/admin-test  (Vite, port 7000)  -> mounts @mercurjs/admin       |
|   apps/vendor      (Vite, port 7001)  -> mounts @mercurjs/vendor      |
+-----------------------------------------------------------------------+
|  App root (packages/{admin,vendor}/src/app.tsx)                       |
|   TooltipProvider                                                     |
|     HelmetProvider                                                    |
|       QueryClientProvider (shared queryClient)                        |
|         ThemeProvider (Medusa UI)                                     |
|           I18nProvider (i18next + browser language detector)          |
|             RouterProvider (react-router-dom)                         |
|               Toaster (Medusa UI)                                     |
+-----------------------------------------------------------------------+
|  Layouts                                                              |
|   ProtectedRoute -> MainLayout / SettingsLayout / PublicLayout        |
|     Shell + Sidebar (MainSidebar) + Outlet                            |
+-----------------------------------------------------------------------+
|  Pages (packages/{admin,vendor}/src/pages/<domain>/...)               |
|   - List   -> SingleColumnPage + Container (divide-y, p-0)            |
|   - Detail -> TwoColumnPage with Main / Sidebar Sections              |
|   - Create -> RouteFocusModal + TabbedForm                            |
|   - Edit   -> RouteDrawer + Form                                      |
+-----------------------------------------------------------------------+
|  Design-system layer                                                  |
|   @mercurjs/dashboard-shared (Form, TabbedForm, RouteFocusModal,      |
|     RouteDrawer, SingleColumnPage, TwoColumnPage, ActionMenu,         |
|     DataTable, SwitchBox, FileUpload, ChipInput, queryKeysFactory)    |
+-----------------------------------------------------------------------+
|  Data layer                                                           |
|   src/lib/client          -> @mercurjs/client (typed sdk)             |
|   src/hooks/api/*.tsx     -> TanStack Query hooks per backend domain  |
|   src/lib/query-key-factory -> queryKeysFactory(domain) for cache keys|
+-----------------------------------------------------------------------+
```

## Package map

### `@mercurjs/dashboard-shared` — the primitives

Library only. No pages, no routes, no providers, no i18n. Built with `tsup`, re-exports everything from `src/index.ts`.

```
packages/dashboard-shared/src/
  index.ts                        Re-exports components/* and hooks/*
  lib/
    query-key-factory.ts          queryKeysFactory + TQueryKey + UseQueryOptionsWrapper
  components/
    common/                       form, action-menu, section, skeleton,
                                  empty-table-content, switch-box, file-upload,
                                  chip-group, listicle, tax-badge, thumbnail,
                                  json-view-section, metadata-section, ...
    layout/pages/                 SingleColumnPage, TwoColumnPage
    modals/                       RouteFocusModal, RouteDrawer, StackedDrawer,
                                  StackedFocusModal, RouteModalForm,
                                  route-modal-provider, stacked-modal-provider
    tabbed-form/                  TabbedForm, useTabbedForm, defineTabMeta, TabDefinition
    forms/                        Address, email, metadata composite forms
    inputs/                       Handle, Combobox, Country/Province, ChipInput, ...
    data-grid/, data-table/, table/   TanStack-Table data tables + cells
    filtering/                    Filter UI for tables
    utilities/                    KeyboundForm, ErrorBoundary, ...
  hooks/                          use-data-table, use-document-direction,
                                  use-debounced-search, use-query-params, ...
```

Public surface (consumed by both admin and vendor):

```ts
import {
  // layout
  SingleColumnPage, TwoColumnPage,
  // modals
  RouteFocusModal, RouteDrawer, useRouteModal,
  StackedDrawer, StackedFocusModal, useStackedModal,
  // forms
  Form, SwitchBox, FileUpload, ChipInput,
  TabbedForm, useTabbedForm, defineTabMeta, type TabDefinition,
  // tables
  DataTable, useDataTable, type Filter,
  // common UI
  ActionMenu, NoResults, NoRecords, Skeleton, SectionRow,
  // data-layer helper
  queryKeysFactory, type TQueryKey, type UseQueryOptionsWrapper,
} from "@mercurjs/dashboard-shared"
```

**Rule:** any new cross-dashboard primitive belongs in `dashboard-shared`. Page-specific composites stay in the consuming package.

### `@mercurjs/admin` — operator dashboard

```
packages/admin/src/
  app.tsx                         App root + providers
  get-route-map.tsx               Static route map merged with virtual:mercur/routes
  index.ts                        Re-exports (TabbedForm, Form, DataTable, ...)
  assets/                         Static assets
  i18n/                           i18next config + translations per language
  providers/                      ThemeProvider, KeybindProvider, SearchProvider, SidebarProvider
  lib/
    client/                       sdk = createClient<Routes>(...) + fetchQuery / uploadFilesQuery
    query-client.ts               Shared TanStack QueryClient
    query-key-factory.ts          queryKeysFactory(domain) (mirrors the shared one)
    form-helpers.ts               transformNullableFormData / transformNullableFormNumber
  hooks/
    api/<domain>.tsx              One file per backend domain — sdk.admin.* + TanStack Query
    use-data-table.tsx, use-document-direction.tsx, use-debounced-search.tsx,
    use-query-params.tsx, ...
  components/
    common/, layout/, modals/, tabbed-form/, forms/, inputs/,
    data-table/, table/, filtering/, search/, utilities/
                                  (local equivalents kept until fully migrated to
                                   `@mercurjs/dashboard-shared`)
  pages/<domain>/                 One folder per route segment (see Page anatomy)
```

Operator-specific characteristics:

- SDK namespace: **`sdk.admin.*`** (e.g. `sdk.admin.productCategories.$id.query(...)`).
- Sidebar (`MainLayout`, `useCoreRoutes()`): Orders → Products → Inventory → Customers → Promotions → Price Lists → Stores → Payouts.
- Authentication: login, accept-invite, reset-password are public routes; everything else under `<ProtectedRoute>`.

### `@mercurjs/vendor` — seller dashboard

```
packages/vendor/src/
  app.tsx                         Same App shape as admin
  get-route-map.tsx               Vendor route map merged with virtual:mercur/routes
  index.ts                        Re-exports (TabbedForm, Notifications)
  assets/, i18n/, providers/      Same shape as admin
  lib/                            client/ (sdk.vendor.*), query-client, query-key-factory
  hooks/                          api/<domain>.tsx — uses sdk.vendor.* + TanStack Query
  components/                     Same shape as admin (common, layout, modals, tabbed-form, ...)
                                  + onboarding-wizard (vendor-specific)
  pages/<domain>/                 Vendor uses two folder-naming variants — see Page anatomy
```

Seller-specific characteristics:

- SDK namespace: **`sdk.vendor.*`** (e.g. `sdk.vendor.productCategories.$id.query(...)`).
- Includes vendor-only flows: `onboarding`, `register`, `store-select`, `home` dashboard with seller-scoped metrics. No platform-wide pages (e.g. no `sellers` list, no platform-wide commission management).
- `onboarding-wizard` component lives under `components/` because it is vendor-only.
- Folder naming inside `pages/<domain>/` may use `_components/` (instead of `components/`) and `[id]/` (instead of `<domain>-detail/`). Both styles are accepted in the vendor package today.

## Routing model (admin + vendor)

Routes live in two places and are merged at runtime:

1. `src/get-route-map.tsx` — the static route map shipped by the dashboard package. Each leaf is a `lazy()` import of a page module. Pages export a `Component` (and optionally `loader`, `Breadcrumb`, `ErrorBoundary`).
2. `virtual:mercur/routes` — generated by `@mercurjs/dashboard-sdk` from files dropped under `apps/<host>/src/routes/`. Pages with matching paths override the base; non-matching paths are appended (see `getRouteMap::mergeRoutes`).

Three top-level buckets exist (`createRouteMap(getRoutesByType(customRoutes, type))`):

- `main` — under `<ProtectedRoute><MainLayout>` (default surface).
- `settings` — under `<ProtectedRoute><SettingsLayout>` (`/settings/*`).
- `public` — under `<PublicLayout>` (login, reset password, accept invite, vendor register).

The sidebar in `MainLayout` is composed of two parts:

- **Core routes** via `useCoreRoutes()` — hard-coded order per dashboard:
  - Admin: Orders → Products → Inventory → Customers → Promotions → Price Lists → Stores → Payouts.
  - Vendor: seller-scoped equivalents (orders, products, categories, collections, customers, promotions, campaigns, price-lists, payouts, etc.).
- **Custom routes** from `virtual:mercur/menu-items` (sorted by `rank`).

## Page anatomy

Every domain folder follows the same shape across both dashboards:

```
src/pages/<domain>/
  index.ts                              barrel that re-exports each sub-page module
  common/                               cross-page hooks, types, utils, shared subcomponents
    hooks/use-delete-<entity>-action.tsx
    utils.ts
  <domain>-list/                        list page (vendor may use bare <domain>/ root)
    <domain>-list.tsx                   page Component
    index.ts                            re-export
    components/<domain>-list-table/     (vendor variant: _components/...)
      <domain>-list-table.tsx           Container shell
      <domain>-list-header.tsx          Title + Actions
      <domain>-list-data-table.tsx      DataTable wiring + row actions
      use-<domain>-table-columns.tsx
      use-<domain>-table-query.tsx
  <domain>-detail/                      (vendor variant: [id]/)
    <domain>-detail.tsx                 page Component (TwoColumnPage)
    breadcrumb.tsx                      Breadcrumb component
    loader.ts                           react-router data loader
    components/<section>-section/...    Each section is a Container
  <domain>-create/
    <domain>-create.tsx                 RouteFocusModal wrapper
    components/create-<domain>-form/
      create-<domain>-form.tsx          TabbedForm host + useForm + handleSubmit
      create-<domain>-<tab>.tsx         One file per tab, exports Root with _tabMeta
      schema.ts                         Zod schema + inferred type
  <domain>-edit/
    <domain>-edit.tsx                   RouteDrawer wrapper, fetches entity by :id
    components/edit-<domain>-form/
      edit-<domain>-form.tsx            RouteDrawer.Form host
```

Vendor-specific variants you may see today:

- `pages/categories/_components/` instead of `pages/categories/category-list/components/`.
- `pages/categories/[id]/...` instead of `pages/categories/category-detail/...`.

Prefer the admin-style convention (`category-list/`, `category-detail/`) for new pages; both styles are accepted in vendor until a migration sweep aligns them.

Every page is also exported as a **Compound Component**: a `Root` is combined with named subparts via `Object.assign(Root, { Header, HeaderTitle, ... })`. Consumers (custom pages, downstream blocks) can either render the page as-is, or replace any slot by passing children explicitly. Example:

```tsx
export const CategoryListPage = Object.assign(Root, {
  Table: CategoryListTable,
  Header: CategoryListHeader,
  HeaderTitle: CategoryListTitle,
  HeaderActions: CategoryListActions,
  DataTable: CategoryListDataTable,
})
```

The Root pattern uses `Children.count(children) > 0 ? children : <DefaultContent />` so the page renders defaults when used unchanged and exposes every part for overrides.

## Layout primitives

All pages mount inside one of two layouts (`components/layout/pages` locally, or `@mercurjs/dashboard-shared`):

### `SingleColumnPage<TData>`

- Vertical stack with `flex flex-col gap-y-3`.
- Renders children, optional `MetadataSection`, optional `JsonViewSection`, optional `<Outlet />` for nested modal routes.
- Use for list pages, settings pages, and simple detail pages.

### `TwoColumnPage<TData>`

- Grid `xl:grid-cols-[minmax(0,_1fr)_440px]`, vertical stack until xl breakpoint.
- Exactly **two children** required: `<TwoColumnPage.Main />` and `<TwoColumnPage.Sidebar />`.
- `showJSON` and `showMetadata` toggle a JSON viewer and a key-value metadata section. Pass `data={entity}` whenever these flags are on — there is a dev-mode warning if you forget.
- Sidebar is `xl:max-w-[440px]`. Stack each section with `gap-y-3`.

### Section container

Every section inside a page is wrapped in `Container` from `@medusajs/ui` with two consistent classes:

```tsx
<Container className="divide-y p-0">
  <div className="flex items-center justify-between px-6 py-4">
    <Heading>{t("domain.section.title")}</Heading>
    {/* actions */}
  </div>
  {/* divided rows below */}
</Container>
```

- `divide-y` + `p-0` is the standard section shell.
- Each row uses `px-6 py-4`.
- Header row: `flex items-center justify-between px-6 py-4` with `<Heading>` on the left and an `ActionMenu` / `Button` cluster on the right.
- For label/value rows prefer `SectionRow` (`grid grid-cols-2 gap-4 px-6 py-4` with `text-ui-fg-subtle`), or inline grids for one-off rows.

## Forms

Forms are built with React Hook Form + Zod + the `Form` primitive (`components/common/form`, also exported from `@mercurjs/dashboard-shared`). **Never** use raw `Controller` — always go through `Form.Field`.

### The shape of every field

```tsx
<Form.Field
  control={form.control}
  name="title"
  render={({ field }) => (
    <Form.Item>
      <Form.Label>{t("fields.title")}</Form.Label>
      <Form.Control>
        <Input autoComplete="off" {...field} />
      </Form.Control>
      <Form.ErrorMessage />
    </Form.Item>
  )}
/>
```

Rules:

- Wrap every field in `<Form.Item>` so error and label ids are wired through context.
- `Form.Label` supports `optional` (auto-appends `(optional)`), `tooltip` (renders `InformationCircleSolid` from `@medusajs/icons`), and `icon`.
- `Form.ErrorMessage` reads the field error from RHF automatically — never render error text manually.
- Use `Form.Hint` for help text below the input (uses `<Hint>` from `@medusajs/ui`).
- For selects, destructure `{ ref, onChange, ...field }` and pass `onValueChange={onChange}`; pass `dir={useDocumentDirection()}` for RTL.
- Wrap the form element in `<KeyboundForm>` (from `components/utilities/keybound-form`) so Cmd/Ctrl+Enter submits.

### Schemas

- One Zod schema per form, exported alongside the form (`schema.ts` or co-located).
- Use `zodResolver(schema)` and infer the form type with `z.infer<typeof Schema>`.
- For nullable / optional values pass through `transformNullableFormData` / `transformNullableFormNumber` (`lib/form-helpers.ts`) before calling the mutation.

### Layout

- Wrap form bodies in `flex w-full max-w-[720px] flex-col gap-y-8` for tab content. For drawer bodies use `flex flex-col gap-y-4`.
- Two-column field rows: `grid grid-cols-1 gap-4 md:grid-cols-2`.
- For toggles use `SwitchBox` (`components/common/switch-box`) which already adds the card styling (`bg-ui-bg-component shadow-elevation-card-rest rounded-lg p-3`).

## Create flow — `RouteFocusModal` + `TabbedForm`

Create pages live behind a routed full-screen modal:

```tsx
const Root = ({ children }: { children?: ReactNode }) => (
  <RouteFocusModal>
    <RouteFocusModal.Title asChild>
      <span className="sr-only">{t("...title")}</span>
    </RouteFocusModal.Title>
    {Children.count(children) > 0 ? children : <CreateXForm />}
  </RouteFocusModal>
)
```

- `RouteFocusModal` opens on mount, navigates to `prev` (default `..`) on close, and supports stacked drawers/modals via `StackedModalProvider`.
- `RouteFocusModal.Form` is `RouteModalForm`: blocks navigation while the form is dirty and shows a confirmation `Prompt`.

For multi-step creates, use **`TabbedForm`** (`components/tabbed-form`):

```tsx
<TabbedForm form={form} onSubmit={handleSubmit} isLoading={isPending}>
  <CreateXDetails />
  <CreateXOrganize />
</TabbedForm>
```

- Each tab is a component whose `Root` carries `Root._tabMeta = defineTabMeta<Schema>({ id, labelKey, validationFields, isVisible? })`.
- `validationFields` triggers field-level validation on **Continue**; the last tab submits.
- Tab body uses the standard padding: `flex flex-col items-center p-16` → `flex w-full max-w-[720px] flex-col gap-y-8`.
- `TabbedForm.Tab` is the bare layout primitive; prefer typed tab components with `_tabMeta`.
- Keyboard: Cmd/Ctrl+Enter advances or submits (handled by `TabbedForm` internally).
- Default footer renders Cancel + Continue/Save; override via the `footer` prop if needed.

## Edit flow — `RouteDrawer`

Quick edits live in a side drawer:

```tsx
<RouteDrawer>
  <RouteDrawer.Header>
    <RouteDrawer.Title asChild>
      <Heading>{t("domain.edit.header")}</Heading>
    </RouteDrawer.Title>
    <RouteDrawer.Description className="sr-only">
      {t("domain.edit.description")}
    </RouteDrawer.Description>
  </RouteDrawer.Header>
  {ready && <EditXForm entity={entity} />}
</RouteDrawer>
```

Inside the form:

```tsx
<RouteDrawer.Form form={form}>
  <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
    <RouteDrawer.Body>
      <div className="flex flex-col gap-y-4">{/* fields */}</div>
    </RouteDrawer.Body>
    <RouteDrawer.Footer>
      <div className="flex items-center gap-x-2">
        <RouteDrawer.Close asChild>
          <Button size="small" variant="secondary">
            {t("actions.cancel")}
          </Button>
        </RouteDrawer.Close>
        <Button size="small" type="submit" isLoading={isPending}>
          {t("actions.save")}
        </Button>
      </div>
    </RouteDrawer.Footer>
  </KeyboundForm>
</RouteDrawer.Form>
```

- Always gate the form behind `ready = !isPending && !!entity` so the drawer is empty until data is loaded.
- Use `useRouteModal().handleSuccess(path?)` inside `onSuccess` to close the modal and (optionally) navigate.
- Throw render-time errors (`if (isError) throw error`) so `ErrorBoundary` catches them.

## Tables and lists

### Container shell

List pages mount a `SingleColumnPage` with a `Container` that holds a header + `DataTable`:

```tsx
<SingleColumnPage hasOutlet>
  <Container className="divide-y p-0">
    <CategoryListHeader />
    <CategoryListDataTable />
  </Container>
</SingleColumnPage>
```

### Header

`flex items-center justify-between px-6 py-4` with two parts:

- `Title`: `<Heading>` + `<Text size="small" className="text-ui-fg-subtle">{subtitle}</Text>`.
- `Actions`: `<Button size="small" variant="secondary" asChild><Link to="...">…</Link></Button>` cluster (e.g. Organize, Create).

### Data table

- Use `DataTable` (`_DataTable` in older admin imports) + `useDataTable` (`components/table/data-table`, `hooks/use-data-table`, or the `@mercurjs/dashboard-shared` exports).
- Build columns with `createColumnHelper<Row>()` and an `actions` display column that renders `<ActionMenu>`.
- For row navigation, pass `navigateTo={(row) => row.id}` so clicking a row enters the detail route.
- Standard `PAGE_SIZE = 20`.
- Use `keepPreviousData` from TanStack Query for smooth pagination.
- Filters / search are wired through the `useXTableQuery` hook (returns `{ raw, searchParams }`).

### Empty states

Use the two variants from `components/common/empty-table-content` (or `@mercurjs/dashboard-shared`):

- `<NoResults />` — filtered/searched view returned nothing (uses `MagnifyingGlass`).
- `<NoRecords action={{ to, label }} />` — entity has no records yet (uses `ExclamationCircle`, optional CTA button or transparent-icon-left link).

## Row & section actions — `ActionMenu`

`components/common/action-menu` is the only acceptable way to render a row or section action menu:

```tsx
<ActionMenu
  groups={[
    { actions: [{ label: t("actions.edit"), icon: <PencilSquare />, to: "edit" }] },
    { actions: [{ label: t("actions.delete"), icon: <Trash />, onClick: handleDelete }] },
  ]}
/>
```

- Each `Action` is either `{ to }` (renders a `<Link>`) or `{ onClick }`.
- Group ordering is meaningful — the trigger renders dropdown groups in order with separators between them. Convention: edit/navigation actions first; destructive actions last in their own group.
- Provide `disabled` + `disabledTooltip` instead of hiding actions when context requires.
- The default trigger is `<IconButton size="small"><EllipsisHorizontal /></IconButton>`. Pass `children` to override the trigger element.

## Delete flow

Encapsulate destructive actions in a `use-delete-<entity>-action.tsx` hook under `pages/<domain>/common/hooks/`. The hook:

1. Calls `usePrompt()` from `@medusajs/ui` with i18n `title`, `description`, `confirmText`, `cancelText`.
2. Awaits user confirmation, then calls the mutation.
3. Toasts via `toast.success` / `toast.error`.
4. Navigates back on success.

This is the only sanctioned destructive-action pattern; never inline a confirmation modal.

## Data fetching

All HTTP traffic goes through the typed SDK: `sdk` (and `fetchQuery` for the few edge cases) live in `lib/client`. **Never call `fetch` directly from a page.**

### SDK namespaces

| Package            | Namespace      | Example                                                         |
| ------------------ | -------------- | --------------------------------------------------------------- |
| `@mercurjs/admin`  | `sdk.admin.*`  | `sdk.admin.productCategories.$id.query({ $id: id, ...query })`  |
| `@mercurjs/vendor` | `sdk.vendor.*` | `sdk.vendor.productCategories.$id.query({ $id: id, ...query })` |

Both surfaces follow the same route-based pattern:

```ts
sdk.<surface>.entities.query({ ...query })                        // list (GET)
sdk.<surface>.entities.$id.query({ $id: id, ...query })           // detail (GET)
sdk.<surface>.entities.mutate(payload)                            // create (POST)
sdk.<surface>.entities.$id.mutate({ $id: id, ...payload })        // update (PATCH/POST)
sdk.<surface>.entities.$id.delete({ $id: id })                    // delete (DELETE)
```

Inputs/outputs come from `InferClientInput` / `InferClientOutput` (`@mercurjs/client`). Errors are `ClientError` from `@mercurjs/client`.

### TanStack Query hooks (`src/hooks/api/<domain>.tsx`)

One file per backend domain. Each file:

1. Creates `const xQueryKeys = queryKeysFactory("x")`.
2. Exposes `useX(id, query?, options?)` for detail, `useXList(query?, options?)` for list, and `useCreate/Update/DeleteX(options?)` for mutations.
3. Inside mutations, invalidate the right keys via `queryClient.invalidateQueries({ queryKey: xQueryKeys.lists() })` (or `details()`/`detail(id)`), and forward `onSuccess` through to the caller.

`queryKeysFactory` from `@mercurjs/dashboard-shared` (or local `lib/query-key-factory.ts`) is the standard shape: `all / lists() / list(query) / details() / detail(id, query?)`. Use it for any new domain.

For initial data, page detail components use a `loader.ts` (react-router data loader) and pass the result to the hook via `initialData`.

## Internationalization

- Every user-facing string goes through `useTranslation()` / `t(key)`.
- Translation files live in `src/i18n/translations/<lng>.json` per dashboard package (English is canonical; other locales are merged). `$schema.json` documents the shape and is enforced by tests in `i18n/translations/__tests__`.
- Common keys: `actions.*` (save, cancel, edit, delete, create, continue), `fields.*` (title, handle, description, optional), `general.*` (areYouSure, noResultsTitle, noRecordsTitle, unsavedChangesTitle), `<domain>.domain` (sidebar label), `<domain>.subtitle` (page subtitle), `<domain>.<verb>.header / hint / successToast / description`.
- Tab labels use `labelKey` on `_tabMeta`; column headers, drawer titles, dialog copy all go through i18n keys.
- Tooltip content (`Form.Label tooltip={t(...)}`) is also translated.
- For RTL support, always pass `dir={useDocumentDirection()}` to `Select`, `DropdownMenu`, etc.

## Design system rules

### `@medusajs/ui` is the only UI library

- Use components from `@medusajs/ui`: `Container`, `Button`, `IconButton`, `Heading`, `Text`, `Hint`, `Label`, `Input`, `Textarea`, `Select`, `Switch`, `Checkbox`, `RadioGroup`, `DropdownMenu`, `Tooltip`, `Badge`, `StatusBadge`, `Drawer`, `FocusModal`, `Prompt`, `ProgressTabs`, `Tabs`, `Avatar`, `Divider`, `Toaster` (+ `toast` / `usePrompt`).
- For Radix primitives that Medusa UI does not re-export, use the bundled `radix-ui` package (e.g. `Label`, `Slot`).
- Never introduce a parallel UI library or restyle Medusa UI components with custom CSS. Custom variants belong on top of Medusa UI primitives.

### Icons

- Only icons from [`@medusajs/icons`](https://docs.medusajs.com/ui/icons/overview) are allowed (e.g. `PencilSquare`, `Trash`, `EllipsisHorizontal`, `MagnifyingGlass`, `PlusMini`, `InformationCircleSolid`, `OpenRectArrowOut`, `ExclamationCircle`, `BuildingStorefront`, `CogSixTooth`).
- Do not bundle other icon packs (lucide, heroicons, custom SVGs) inside the dashboard packages.
- For row/section actions, place the icon inside the `ActionMenu` action descriptor (`icon: <PencilSquare />`).
- Icons in dropdowns/menus inherit color via the `[&_svg]:text-ui-fg-subtle` utility; disabled menu items dim to `[&_svg]:text-ui-fg-disabled`.

### Colors

Use only the [Medusa UI color tokens](https://docs.medusajs.com/ui/colors/overview). Never write hex colors, `rgb(...)`, or palette names. Common tokens by purpose:

- **Backgrounds**: `bg-ui-bg-base`, `bg-ui-bg-subtle`, `bg-ui-bg-subtle-hover`, `bg-ui-bg-component`, `bg-ui-bg-disabled`, `bg-ui-bg-field`, `bg-ui-bg-highlight`.
- **Foreground**: `text-ui-fg-base`, `text-ui-fg-subtle`, `text-ui-fg-muted`, `text-ui-fg-disabled`, `text-ui-fg-interactive`, `text-ui-fg-on-color`, `text-ui-fg-error`.
- **Borders / dividers**: `border-ui-border-base`, `border-ui-border-strong`, `border-ui-border-loud`.
- **Shadows / focus**: `shadow-elevation-card-rest`, `shadow-borders-focus`.

Apply tokens via Tailwind utilities; `clx` (re-exported from `@medusajs/ui`) is the canonical helper for conditional class merging.

### Typography

- Headings: `<Heading>` for section titles, `<Heading level="h2">` for sidebar sections; never style with raw `<h*>` elements.
- Body text: `<Text size="small" leading="compact">` for table-row text and section rows; `<Text size="xsmall">` for chips and breadcrumb segments; combine with `weight="plus"` for emphasized labels.
- Hints: `<Hint>` (variant `info` by default, `error` for `Form.ErrorMessage`).
- Subtle copy: `<Text className="text-ui-fg-subtle">` / `text-ui-fg-muted`. Never roll your own `<p className="text-gray-500">`.

### Spacing

- Section row vertical rhythm: `px-6 py-4`. Cluster gaps: `gap-x-2`, `gap-x-3`, `gap-x-4`. Outer page stack: `gap-y-3`. Form body stack: `gap-y-4` (drawers) / `gap-y-8` (focus modals). Two-column field grid: `grid grid-cols-1 gap-4 md:grid-cols-2`.
- Buttons inside compact toolbars and footers: `size="small"`. Variants: `primary` (default save), `secondary` (cancel / nav), `transparent` (icon-only or inline link triggers).

### Status badges

Use `StatusBadge` with the helper color/label utilities in `pages/<domain>/common/utils.ts` (`getIsActiveProps`, `getIsInternalProps`, etc.). Place badges in the section header row to the right of the title, before the `ActionMenu`.

### Skeletons

Use `Skeleton` (`components/common/skeleton`) for placeholders. For detail pages, the corresponding `TwoColumnPageSkeleton` mirrors the section count so the layout doesn't jump.

### Test ids

Every interactive element in a list, header, action, form, or modal should carry `data-testid` (e.g. `category-create-form-name-input`, `sidebar-header-dropdown-trigger`). Use kebab-case scoped to the page/section. New components must add ids in the same pattern.

## Extension model

Consumers extend the dashboards without forking by:

1. **Drop-in routes** — `apps/<host>/src/routes/**/page.tsx` is scanned by `@mercurjs/dashboard-sdk` and merged into the route map (see `get-route-map.tsx::mergeRoutes`).
2. **Compound overrides** — every page exports `Object.assign(Root, { Header, HeaderTitle, HeaderActions, ... })`. Custom pages can re-render the page with their own children:
   ```tsx
   <CategoryListPage>
     <CategoryListPage.Header>
       <CategoryListPage.HeaderTitle />
       <MyCustomActions />
     </CategoryListPage.Header>
     <CategoryListPage.DataTable />
   </CategoryListPage>
   ```
3. **Blocks** — installable feature packages via `mercurjs add`; declare `admin_ui` / `vendor_ui` entry points in `blocks.json`.
4. **Public exports** — the canonical primitives consumers should import:
   - From `@mercurjs/dashboard-shared`: `TabbedForm`, `useTabbedForm`, `defineTabMeta`, `TabDefinition`, `Form`, `SwitchBox`, `FileUpload`, `ChipInput`, `DataTable`, `useDataTable`, `Filter`, `SingleColumnPage`, `TwoColumnPage`, `RouteFocusModal`, `RouteDrawer`, `ActionMenu`, `NoResults`, `NoRecords`, `SectionRow`, `Skeleton`, `queryKeysFactory`, `TQueryKey`, `UseQueryOptionsWrapper`.
   - From `@mercurjs/admin`: same primitives are re-exported plus `Notifications` and `PRODUCT_DETAIL_FIELDS` / `PRODUCT_DETAIL_QUERY`.
   - From `@mercurjs/vendor`: `TabbedForm`, `useTabbedForm`, `TabDefinition`, `Notifications`.

When adding shared primitives, place them in `@mercurjs/dashboard-shared` and re-export from the dashboard packages only when there is a useful default to bake in.

## Page-authoring checklist

When adding a new dashboard page (admin or vendor), conform to these rules in order:

1. **Folder shape** — `src/pages/<domain>/<domain>-{list,detail,create,edit}/` with `index.ts`, `<page>.tsx`, and a `components/` subfolder for any non-trivial subcomponent. (Vendor `_components/` and `[id]/` variants are accepted; prefer the admin shape for new code.)
2. **Layout** — pick `SingleColumnPage` (lists, simple settings) or `TwoColumnPage` (detail with sidebar). Wrap every section in `<Container className="divide-y p-0">`. Section header is `flex items-center justify-between px-6 py-4` with `<Heading>` + actions.
3. **Compound export** — define `Root` and assemble `Object.assign(Root, { ... })`. Use `Children.count(children) > 0 ? children : <Defaults />` so the page renders defaults but accepts overrides.
4. **Forms** — React Hook Form + `zodResolver`. Wrap every field in `Form.Field` → `Form.Item` → `Form.Label` / `Form.Control` / `Form.ErrorMessage`. Use `KeyboundForm` for keyboard submit. Run nullable values through `transformNullableFormData`.
5. **Create** — `RouteFocusModal` host + `TabbedForm`. Each tab carries `_tabMeta` via `defineTabMeta` with `id`, `labelKey`, `validationFields`. Body padding: `p-16` → `max-w-[720px] gap-y-8`.
6. **Edit** — `RouteDrawer` host + `RouteDrawer.Form` + `KeyboundForm`. Body uses `flex flex-col gap-y-4`. Footer: secondary Cancel + primary Save with `isLoading={isPending}`.
7. **Data** — pull data via hooks in `src/hooks/api/<domain>.tsx`, calling `sdk.admin.*` (admin) or `sdk.vendor.*` (vendor). Always invalidate `lists()` / `details()` / `detail(id)` keys in mutations. Throw on `isError` so `ErrorBoundary` catches it. Use `Skeleton` / `TwoColumnPageSkeleton` while loading.
8. **Tables** — `DataTable` + `useDataTable`. Page size 20. Add an `actions` column rendering `<ActionMenu>`. Empty states use `NoRecords` / `NoResults`.
9. **Destructive actions** — extract to `pages/<domain>/common/hooks/use-delete-<entity>-action.tsx`. Always `usePrompt()` then toast.
10. **Strings** — every visible string uses `t("...")` with keys placed under the domain's namespace. Add new keys to `src/i18n/translations/en.json` first.
11. **Icons** — only from `@medusajs/icons`.
12. **Colors / typography / spacing** — only Medusa UI tokens (`text-ui-fg-*`, `bg-ui-bg-*`, `border-ui-border-*`, `shadow-elevation-*`) and the spacing scale documented above.
13. **Test ids** — kebab-case `data-testid` on every interactive element, headings, inputs, buttons, dropdown items.

When in doubt, mirror an existing page in the same family (lists → `category-list`, detail → `category-detail`, create wizards → `product-create`, drawer edits → `category-edit`) — those are the canonical references for both dashboards.

## Where to put new code

| You are adding…                                                            | Put it in                                                                    |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A new operator (admin) page                                                | `packages/admin/src/pages/<domain>/...`                                      |
| A new seller (vendor) page                                                 | `packages/vendor/src/pages/<domain>/...`                                     |
| A new TanStack Query hook                                                  | `packages/<dashboard>/src/hooks/api/<domain>.tsx`                            |
| A reusable UI primitive used by both dashboards                            | `packages/dashboard-shared/src/components/...`                               |
| A reusable hook used by both dashboards                                    | `packages/dashboard-shared/src/hooks/...`                                    |
| A page-specific subcomponent                                               | `pages/<domain>/<page>/components/...` (admin) or `_components/...` (vendor) |
| A delete / destructive-action hook                                         | `pages/<domain>/common/hooks/use-delete-<entity>-action.tsx`                 |
| A new translation key                                                      | `packages/<dashboard>/src/i18n/translations/en.json` first, then other locales |
| Helpers used by multiple pages in the same dashboard                       | `packages/<dashboard>/src/lib/...`                                           |

If the same primitive would land in both `packages/admin` and `packages/vendor`, prefer landing it once in `@mercurjs/dashboard-shared` and importing it from the consuming dashboards.
