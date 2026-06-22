---
status: in_progress
canonical: false
priority: 2
area: admin/commissions
created: 2026-06-15
last_updated: 2026-06-16
---

# SPEC-012 Admin Commissions — Figma UI

This spec defines the **admin (operator) UI** migration from the current
**Commission Rates** pages
(`packages/admin/src/pages/commission-rates`) to the **Commissions**
design in Figma:

> **Mercur 2.0 — Admin Panel · Settings → Commissions**
> `figma.com/design/szW2v1o0l3TRUKnraXqsUL`, page node `40016328:49055`
> ("`↳ Commissions`").

It is the **UI half** of the redesign. The **backend half** is
[SPEC-011](SPEC-011-commission-model-figma-redesign.md) and defines the
domain-model + API contract this spec consumes (`include_shipping`,
per-currency Fixed values, AND-across-dimension matching, and the
singleton **default** rate). **SPEC-012 depends on SPEC-011** — the
wizard, Global Commission card, and rule detail all read fields defined
there. Do not ship the UI ahead of the backend contract.

**Scope: `packages/admin` only.** Pages, routes, hooks (TanStack Query
wrappers over the admin SDK), i18n, and design-system conformance. No
commission-module / matching / migration work — that is SPEC-011.

It is **descriptive**: the Figma design is the source of truth for the
target IA; code paths cited are what exists today.

## Source designs

All frames live in **Mercur 2.0 — Admin Panel — Settings**
(`fileKey szW2v1o0l3TRUKnraXqsUL`, page `40016328:49055`):

| Admin surface | Figma frame | Notes |
| --- | --- | --- |
| Commissions page (Global + Rules) | `40016360:201837` | Global Commission card + Commission Rules table on one `/settings/commissions` page |
| Edit Global Commission (drawer) | `40016373:34876` | Type select; Value (multi-currency for Fixed, single % for Percentage); Tax included + Shipping included toggles |
| Rules — empty / search | `40016381:127946`, `40016373:37346` | `NoResults` empty state; Add filter / Search / Sort row |
| Create Rule — Details tab | `40016397:203169`, `40016399:227040` | Title, Type (scope combo), conditional Stores / Product Types / Categories multiselects |
| Create Rule — Commission tab | `40016397:210150` | Type (Percentage/Fixed), Value, Tax included, Shipping included |
| Rule detail | `40016400:88329`, `40016381:127946` | Scope section (Type, Stores, Product Types, …) + Commission section (Type, Value, Tax, Shipping); status badge + kebab |
| Rule detail — Edit drawer | `40016400:97970` | Edit the commission part: Type select, Currency input(s), Tax/Shipping toggles |
| Rule — Delete | `40016399:233876` | `Prompt` confirmation |

> The design's sidebar label reads **"Commisions"** (sic). Use the
> correct spelling **"Commissions"** in code/i18n.

## What exists today (surface map)

`packages/admin/src/pages/commission-rates/`:

```
commission-rates/
  commission-rate-list/                    # SingleColumnPage + Container; columns code/type/is_enabled
  commission-rate-detail/                  # TwoColumnPage: general-section + rules-section
  commission-rate-create/                  # RouteFocusModal; single (non-tabbed) form + rules picker + schema
  commission-rate-edit/                    # RouteDrawer; form + batch rule management
  common/                                  # delete hook, utils
```

Hooks — `packages/admin/src/hooks/api/commission-rates.tsx`:
`useCommissionRate`, `useCommissionRates`, `useCreateCommissionRate`,
`useUpdateCommissionRate`, `useDeleteCommissionRate`,
`useBatchCommissionRules`.

Routing — `get-route-map.tsx` (under `/settings`):
`/settings/commission-rates`, `/.../create`, `/.../:id`, `/.../:id/edit`.

i18n — `commissionRates.*` in `i18n/translations/en.json`.

The create/edit UI currently exposes only `product`, `product_type`,
and `shipping_option` rule references (a subset of what the backend
supports).

## Backend contract (from SPEC-011)

This UI assumes SPEC-011 has shipped:

- `CommissionRate` carries `include_shipping` + `values[]` (per-currency
  Fixed amounts `{ currency_code, amount }`) + a default-singleton marker,
  alongside `type` / `value` (percentage) / `include_tax` / `is_enabled` /
  `rules[]`. (Per-currency Fixed is a `CommissionRateValue` child table —
  SPEC-011 Gap 2.)
- Create/Update accept `{ name, code, type, value | values[],
  include_tax, include_shipping, rules[] }` (`code` required, user-entered).
- The **default** rate is readable/updatable as a singleton (Global
  Commission).
- A rule's **Type** is **derived** from the set of `reference`s on its
  rules (no stored "type" column).

## Target screens (per-screen audit)

Status legend: **Exists** (aligned) · **Different** (diverges) ·
**Missing** (build new).

### Commissions page (ref `40016360:201837`)

`SingleColumnPage` hosting **two** `<Container className="divide-y p-0">`
sections:

#### Global Commission section — **Missing**

- Header: `<Heading>` "Global Commission" + `ActionMenu` kebab → **Edit**
  only.
- `SectionRow`s: **Code**, **Type** (Percentage / Fixed), **Value**
  (`10%` for percentage; per-currency summary for fixed), **Tax**
  ("Included in commission" / "Not included…"), **Shipping** ("Included
  in commission" / "Not included…").
- Backed by the singleton default rate (`useDefaultCommission`).

#### Commission Rules section — **Different**

- Header: `<Heading>` "Commission Rules" + **Create** button (right).
- Toolbar: **Add filter** (left); **Search** + **Sort** (right).
- `DataTable` columns:
  - **Rule** — rate `name` (replaces shipped `code` column).
  - **Type** — derived scope-combo label (Store / Product Type /
    Category / Store + Product Type / Store + Category). **New.**
  - **Scope** — chosen references summarized ("ACME + Outlet",
    "ACME, EMCA +3", "New", "Clothes"). **New.**
  - **Value** — `10%` or `10,00 EUR / 12,00 USD / +1`. **New.**
  - **Status** — `StatusBadge` Active / Inactive (`is_enabled`).
    Exists ≈.
  - Row kebab — **Edit** / **Delete** (+ enable/disable toggle).
  - Drop the shipped standalone `type` column.
- Row → rule detail (`/settings/commissions/:id`). Page size **20**.
- Empty states — `NoResults` (filtered to nothing) / `NoRecords` (no
  rules at all).

### Edit Global Commission drawer (ref `40016373:34876`) — **Missing**

`RouteDrawer`; body `flex flex-col gap-y-4`:

- **Code** — text `Input` (`code`), required, unique. Editable.
- **Type** — `Select` (Fixed / Percentage).
- **Value** — Percentage → single `%` input; Fixed → a **per-currency**
  stack of `CurrencyInput`s (one per store currency, each with its own
  `Please enter a value` validation).
- **Tax included** — `SwitchBox` (design hint copy).
- **Shipping included** — `SwitchBox` (design hint copy).
- Footer: Cancel + Save → `useUpdateDefaultCommission`.

### Create Commission Rule wizard (refs `40016397:203169`, `40016397:210150`)

`RouteFocusModal` + `TabbedForm` — **Different** (today single
non-tabbed form). Two tabs:

**Tab 1 — Details** (`defineTabMeta` id `details`):

- **Title** — text → `name`.
- **Code** — text `Input` (`code`), required, unique. Editable.
- **Type** — `Select` scope combo: Store / Product Type / Category /
  Store + Product Type / Store + Category.
- Conditional multiselects driven by Type:
  - **Stores** — searchable seller multi-select (chips, "+N" overflow)
    → `seller` rules.
  - **Product Types** — multi-select → `product_type` rules.
  - **Categories** — nested category multi-select → `product_category`
    rules.
- `validationFields`: `title`, `code`, `type`, and the required dimension
  select(s) for the chosen combo.

**Tab 2 — Commission** (`defineTabMeta` id `commission`, submits):

- **Type** — `Select` (Percentage / Fixed).
- **Value** — `%` or per-currency `CurrencyInput`s (same as Global
  drawer).
- **Tax included** — `SwitchBox`.
- **Shipping included** — `SwitchBox`.

Submit → `useCreateCommissionRate` with `{ name, code, type,
value | values[], include_tax, include_shipping, rules[] }` (the
combo expanded into dimension-grouped rule rows) in one round-trip.

### Commission Rule detail (ref `40016400:88329`)

`SingleColumnPage`, two stacked sections — **Different** (today
TwoColumnPage General + Rules):

- **Scope section** (`<Container className="divide-y p-0">`):
  - Header: rule **title** + `StatusBadge` + kebab (**Edit** / **Delete**
    + enable/disable).
  - Rows: **Type** (combo label) then one row **per dimension** —
    **Stores**, **Product Types**, **Categories** — rendering the chosen
    references.
- **Commission section** (`<Container className="divide-y p-0">`):
  - Header: `<Heading>` "Commission" + kebab → **Edit**.
  - Rows: **Type**, **Value**, **Tax**, **Shipping**.
- Breadcrumb: `Settings › Commissions › <rule title>`.

### Edit Commission Rule drawer (ref `40016400:97970`) — **Different**

`RouteDrawer` editing the **commission part**: **Type** select, **Value**
(per-currency Currency inputs / `%`), **Tax included** + **Shipping
included** toggles → `useUpdateCommissionRate`. Scope (dimension) editing
reuses the shipped batch-rules flow (`useBatchCommissionRules`) — see the
**Scope editing** item under §"Dependencies & open questions" for whether
scope is editable post-create.

### Delete (ref `40016399:233876`)

`usePrompt` → `useDeleteCommissionRate` → toast. Reuse the shipped
delete-action hook pattern.

## Frontend changes

Rename the page family `commission-rates` → `commissions`:

```
pages/commissions/
  commissions-page.tsx                     # SingleColumnPage: Global card + Rules table
  common/{hooks,utils,types}.ts            # delete hook, scope-combo derivation, value formatting
  components/
    global-commission-section.tsx          # default-rate card (Type/Value/Tax/Shipping) + Edit kebab
    commission-rules-table/                 # header (Create), data-table, columns (Rule/Type/Scope/Value/Status), query
  global-commission-edit/                   # RouteDrawer: Type/Value(±currency)/Tax/Shipping
  commission-rule-create/                   # RouteFocusModal + TabbedForm (Details, Commission) + schema
  commission-rule-detail/                   # SingleColumnPage: Scope + Commission sections + breadcrumb + loader
  commission-rule-edit/                     # RouteDrawer (commission part)
```

### Hooks (`hooks/api/commissions.tsx`, extend the existing file)

- Thread `include_shipping` + fixed values through
  `useCreateCommissionRate` / `useUpdateCommissionRate` /
  `useCommissionRate(s)`.
- Add **`useDefaultCommission()`** / **`useUpdateDefaultCommission()`**
  for the singleton default (Global Commission), per the SPEC-011
  default-rate contract.
- Keep `useBatchCommissionRules` for scope-dimension edits.
- Invalidate list + detail keys on every mutation.

### Helpers (`common/`)

- **Scope-combo derivation** — from a rate's grouped `rules[]`, derive
  the **Type** label and the **Scope** summary string; and the inverse —
  map a combo selection + dimension picks → the
  `{ reference, reference_id }` rule rows for create/update.
- **Value formatting** — render `10%` (percentage) or the per-currency
  fixed summary (`10,00 EUR / 12,00 USD / +1`).

Reuse `SwitchBox`, `CurrencyInput`, `StatusBadge`, `ActionMenu`,
`DataTable`, `TabbedForm` + `defineTabMeta`, `RouteDrawer`,
`RouteFocusModal`, `SingleColumnPage`, `SectionRow` from
`@mercurjs/dashboard-shared` per `docs/UI-ARCHITECTURE.md`.

### Routing (`get-route-map.tsx`)

```
/settings/commissions                       → Commissions page (Global + Rules)
  └── edit-global                           → Edit Global Commission drawer
  └── create                                → Create Commission Rule wizard
/settings/commissions/:id                   → Commission Rule detail
  └── edit                                   → Edit Commission Rule drawer
```

Old `/settings/commission-rates*` routes are replaced — a **breaking
change** to saved deep links; call it out in the PR. Update the settings
sidebar label `commissionRates.domain` → new `commissions.domain` =
"Commissions".

### i18n

New `commissions.*` namespace (en.json first, then `$schema.json` +
other locales). Keys: `commissions.domain`, `commissions.subtitle`;
`commissions.global.{title,edit.header,code,type,value,tax,shipping,
taxIncluded,shippingIncluded,...}`; `commissions.rules.{title,create,
columns.{rule,type,scope,value,status}}`; `commissions.create.{header,
details,commission,...}`; `commissions.fields.{code,type.{percentage,fixed},
taxIncluded,taxIncludedHint,shippingIncluded,shippingIncludedHint,
scopeType.{store,productType,category,storeProductType,storeCategory}}`;
`commissions.detail.*`; `commissions.delete.*`. Reuse shared `actions.*`
/ `general.*`.

## Implementation Spec (UI-ARCHITECTURE conformance)

> This section is the build sheet. Every file, folder, primitive, and
> pattern below conforms to `docs/UI-ARCHITECTURE.md` (the dashboard
> contract). Each screen maps to the canonical reference page named in
> the architecture doc's "when in doubt, mirror…" rule. Code blocks are
> skeletons that fix the shape — not final code.

### Reference pages to mirror

| New surface | Mirror (existing admin page) |
| --- | --- |
| Commissions list/page | `pages/commission-rates/commission-rate-list` → reshaped like `category-list` |
| Global Commission section | a `<Container divide-y p-0>` section like `category-detail` sections |
| Create Rule wizard | `pages/products/product-create` (RouteFocusModal + TabbedForm) |
| Edit Global / Edit Rule drawers | `pages/.../category-edit` (RouteDrawer + RouteDrawer.Form) |
| Rule detail | `category-detail` (sections), but `SingleColumnPage` |
| Delete | `common/hooks/use-delete-*-action.tsx` |

### Folder tree (admin convention: `<domain>-{list,create,edit,detail}/`)

```
packages/admin/src/pages/commissions/
  index.ts                                   # barrel: re-export every sub-page module
  common/
    hooks/use-delete-commission-rule-action.tsx
    utils.ts                                 # scope-combo derivation, value formatting, status badge props
    types.ts                                 # ScopeType union, CommissionRuleRow, form value types
    constants.ts                             # COMMISSIONS_PAGE_SIZE = 20, field constants
  commissions-list/
    commissions-page.tsx                     # Root + Object.assign — SingleColumnPage host
    index.ts
    components/
      global-commission-section/
        global-commission-section.tsx        # <Container divide-y p-0> card + Edit kebab
      commission-rules-table/
        commission-rules-table.tsx           # Container shell
        commission-rules-header.tsx          # Heading "Commission Rules" + Create button
        commission-rules-data-table.tsx      # DataTable wiring + row ActionMenu
        use-commission-rules-columns.tsx     # Rule/Type/Scope/Value/Status/actions
        use-commission-rules-query.tsx       # { raw, searchParams }
  commission-rule-create/
    commission-rule-create.tsx               # RouteFocusModal wrapper
    components/create-commission-rule-form/
      create-commission-rule-form.tsx        # TabbedForm host + useForm + handleSubmit
      create-commission-rule-details.tsx     # tab 1 Root + _tabMeta
      create-commission-rule-commission.tsx  # tab 2 Root + _tabMeta
      schema.ts                              # zod schema + z.infer type
  global-commission-edit/
    global-commission-edit.tsx               # RouteDrawer wrapper (reads default rate)
    components/edit-global-commission-form/
      edit-global-commission-form.tsx        # RouteDrawer.Form host
      schema.ts
  commission-rule-edit/
    commission-rule-edit.tsx                 # RouteDrawer wrapper (reads :id)
    components/edit-commission-rule-form/
      edit-commission-rule-form.tsx          # RouteDrawer.Form host (commission part)
      schema.ts
  commission-rule-detail/
    commission-rule-detail.tsx               # SingleColumnPage host
    breadcrumb.tsx
    loader.ts                                # react-router data loader → initialData
    components/
      scope-section/scope-section.tsx        # <Container divide-y p-0> + StatusBadge + kebab
      commission-section/commission-section.tsx
```

### Shared value types (`common/types.ts`)

```ts
export type ScopeType =
  | "store" | "product_type" | "category"
  | "store_product_type" | "store_category"

// Combo → which CommissionRule.reference dimensions it populates
export const SCOPE_TYPE_DIMENSIONS: Record<ScopeType, CommissionRuleReference[]> = {
  store:              ["seller"],
  product_type:       ["product_type"],
  category:           ["product_category"],
  store_product_type: ["seller", "product_type"],
  store_category:     ["seller", "product_category"],
}
```

### Data layer — `hooks/api/commissions.tsx` (`queryKeysFactory`)

Per the architecture doc: one file per backend domain, route-based
`sdk.admin.*`, `queryKeysFactory`, invalidate `lists()` / `details()` /
`detail(id)` on every mutation, forward `onSuccess`.

```ts
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
const commissionsQueryKeys = queryKeysFactory("commissions")

export const useCommissionRules = (query?, options?) =>           // GET list
  useQuery({ queryKey: commissionsQueryKeys.list(query),
    queryFn: () => sdk.admin.commissionRates.query({ ...query }), ...options })

export const useCommissionRule = (id, query?, options?) =>        // GET detail
  useQuery({ queryKey: commissionsQueryKeys.detail(id, query),
    queryFn: () => sdk.admin.commissionRates.$id.query({ $id: id, ...query }), ...options })

export const useCreateCommissionRule = (options?) =>             // POST (+ rules)
  useMutation({ mutationFn: (p) => sdk.admin.commissionRates.mutate(p),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: commissionsQueryKeys.lists() }); options?.onSuccess?.(...a) } })

export const useUpdateCommissionRule = (id, options?) => /* $id.mutate, invalidate detail+lists */
export const useDeleteCommissionRule = (id, options?) => /* $id.delete, invalidate detail+lists */
export const useBatchCommissionRules = (id, options?) => /* :id/rules — scope dimensions */

// Global Commission = the singleton default rate (SPEC-011 contract)
export const useDefaultCommission = (options?) => /* read the is_default rate */
export const useUpdateDefaultCommission = (options?) => /* write type/value/include_tax/include_shipping */
```

Types via `InferClientInput` / `InferClientOutput`; errors are
`ClientError` — both from `@mercurjs/client`. Never call `fetch`
directly.

### Commissions page (`commissions-list/commissions-page.tsx`) — compound Root

`SingleColumnPage` + two sections; compound export per the architecture
doc's Root pattern.

```tsx
const Root = ({ children }: { children?: ReactNode }) => (
  <SingleColumnPage hasOutlet data-testid="commissions-page">
    {Children.count(children) > 0 ? children : (
      <>
        <GlobalCommissionSection />
        <CommissionRulesTable />
      </>
    )}
  </SingleColumnPage>
)

export const CommissionsPage = Object.assign(Root, {
  GlobalCommission: GlobalCommissionSection,
  RulesTable: CommissionRulesTable,
  RulesHeader: CommissionRulesHeader,
  RulesDataTable: CommissionRulesDataTable,
})
```

### Global Commission section — `<Container divide-y p-0>` + `SectionRow`

```tsx
<Container className="divide-y p-0">
  <div className="flex items-center justify-between px-6 py-4">
    <Heading>{t("commissions.global.title")}</Heading>
    <ActionMenu groups={[{ actions: [
      { label: t("actions.edit"), icon: <PencilSquare />, to: "edit-global" },
    ]}]} data-testid="global-commission-actions" />
  </div>
  <SectionRow title={t("commissions.global.code")}     value={data?.code} />
  <SectionRow title={t("commissions.global.type")}     value={typeLabel} />
  <SectionRow title={t("commissions.global.value")}    value={valueLabel} />
  <SectionRow title={t("commissions.global.tax")}      value={t(taxKey)} />
  <SectionRow title={t("commissions.global.shipping")} value={t(shippingKey)} />
</Container>
```

Backed by `useDefaultCommission()`; `Skeleton` while loading; throw on
`isError` so `ErrorBoundary` catches.

### Rules table — header + `DataTable` (page size 20)

`use-commission-rules-columns.tsx` with `createColumnHelper<CommissionRuleRow>()`
and an `actions` display column rendering `<ActionMenu>`:

```tsx
columnHelper.accessor("name",     { header: t("commissions.rules.columns.rule") }),
columnHelper.display ({ id: "type",  header: t("...columns.type"),  cell: ({ row }) => <ScopeTypeCell rules={row.original.rules} /> }),
columnHelper.display ({ id: "scope", header: t("...columns.scope"), cell: ({ row }) => <ScopeSummaryCell rules={row.original.rules} /> }),
columnHelper.display ({ id: "value", header: t("...columns.value"), cell: ({ row }) => <CommissionValueCell rate={row.original} /> }),
columnHelper.display ({ id: "status",header: t("...columns.status"),cell: ({ row }) => <StatusBadge {...getIsActiveProps(row.original.is_enabled)} /> }),
columnHelper.display ({ id: "actions", cell: ({ row }) => <CommissionRuleRowActions rule={row.original} /> }),
```

`commission-rules-data-table.tsx` wires `DataTable` + `useDataTable`
(`PAGE_SIZE = 20`, `keepPreviousData`, `navigateTo={(row) => row.id}`),
`useCommissionRules(searchParams)` from `use-commission-rules-query`,
`NoResults` (filtered) / `NoRecords` (none) empty states. Header carries
the **Create** button: `<Button size="small" variant="secondary" asChild><Link to="create">…</Link></Button>`.

### Create wizard — `RouteFocusModal` + `TabbedForm` + `defineTabMeta`

`commission-rule-create.tsx`:

```tsx
const Root = ({ children }: { children?: ReactNode }) => (
  <RouteFocusModal>
    <RouteFocusModal.Title asChild>
      <span className="sr-only">{t("commissions.create.header")}</span>
    </RouteFocusModal.Title>
    {Children.count(children) > 0 ? children : <CreateCommissionRuleForm />}
  </RouteFocusModal>
)
```

`create-commission-rule-form.tsx`:

```tsx
const form = useForm<CreateCommissionRuleSchema>({ resolver: zodResolver(CreateCommissionRuleSchema), defaultValues })
const { mutateAsync, isPending } = useCreateCommissionRule()
const handleSubmit = form.handleSubmit(async (values) => {
  await mutateAsync({
    name: values.title,
    code: values.code,
    type: values.commissionType,
    ...(values.commissionType === "fixed"
      ? { values: values.fixedValues }   // [{ currency_code, amount }] → CommissionRateValue rows
      : { value: values.percentageValue }),
    include_tax: values.taxIncluded,
    include_shipping: values.shippingIncluded,
    rules: buildRulesFromScope(values.scopeType, values),   // common/utils.ts
  })
  handleSuccess("/settings/commissions")
})
return (
  <TabbedForm form={form} onSubmit={handleSubmit} isLoading={isPending}>
    <CreateCommissionRuleDetails />
    <CreateCommissionRuleCommission />
  </TabbedForm>
)
```

Each tab `Root` carries `_tabMeta` and uses the standard tab body
padding (`flex flex-col items-center p-16` → `flex w-full max-w-[720px]
flex-col gap-y-8`). Fields go through `Form.Field` → `Form.Item` (never
raw `Controller`); the conditional dimension selects render on the chosen
`scopeType`:

```tsx
CreateCommissionRuleDetails.Root._tabMeta = defineTabMeta<CreateCommissionRuleSchema>({
  id: "details",
  labelKey: "commissions.create.details",
  validationFields: ["title", "code", "scopeType", "stores", "productTypes", "categories"],
})
CreateCommissionRuleCommission.Root._tabMeta = defineTabMeta<CreateCommissionRuleSchema>({
  id: "commission",
  labelKey: "commissions.create.commission",
  validationFields: ["commissionType", "percentageValue", "fixedValues", "taxIncluded", "shippingIncluded"],
})
```

Toggles use `SwitchBox`; Fixed value renders a per-currency stack of
`CurrencyInput`s; Percentage renders one `%` input. `data-testid` on
every input (`commission-rule-create-title-input`, etc.).

### Edit drawers — `RouteDrawer` + `RouteDrawer.Form` + `KeyboundForm`

Both `global-commission-edit` and `commission-rule-edit` follow the
architecture doc's drawer shape: gate behind `ready = !isPending &&
!!entity`, body `flex flex-col gap-y-4`, footer secondary Cancel +
primary Save with `isLoading`, `useRouteModal().handleSuccess()` on
success, throw on `isError`.

```tsx
<RouteDrawer>
  <RouteDrawer.Header>
    <RouteDrawer.Title asChild><Heading>{t("commissions.global.edit.header")}</Heading></RouteDrawer.Title>
    <RouteDrawer.Description className="sr-only">{t("commissions.global.edit.description")}</RouteDrawer.Description>
  </RouteDrawer.Header>
  {ready && <EditGlobalCommissionForm commission={data} />}
</RouteDrawer>
```

The form body: `Type` select (`{ ref, onChange, ...field }` →
`onValueChange={onChange}`, `dir={useDocumentDirection()}`), `Value`
(percentage `%` input or per-currency `CurrencyInput`s), and the two
`SwitchBox` toggles. Run nullable values through
`transformNullableFormData` before mutating.

### Rule detail — `SingleColumnPage` + two sections

`commission-rule-detail.tsx` mounts `SingleColumnPage`, uses
`loader.ts` → `initialData`, exports `Breadcrumb`. Scope section renders
`StatusBadge` (placed in the header row, left of the `ActionMenu`) and a
kebab with Edit (`to: "edit"`) + Delete (`onClick`) groups. Commission
section header kebab → Edit. Both are `<Container className="divide-y
p-0">` with `SectionRow`s.

### Delete — `common/hooks/use-delete-commission-rule-action.tsx`

The only sanctioned destructive pattern: `usePrompt()` →
`useDeleteCommissionRule` → `toast.success` / `toast.error` → navigate
back.

```tsx
export const useDeleteCommissionRuleAction = (rule) => {
  const prompt = usePrompt(); const navigate = useNavigate()
  const { mutateAsync } = useDeleteCommissionRule(rule.id)
  return async () => {
    if (!(await prompt({ title: t("general.areYouSure"),
      description: t("commissions.delete.description", { name: rule.name }),
      confirmText: t("actions.delete"), cancelText: t("actions.cancel") }))) return
    await mutateAsync(undefined, {
      onSuccess: () => { toast.success(t("commissions.delete.successToast")); navigate("/settings/commissions") },
      onError: (e) => toast.error(e.message),
    })
  }
}
```

### Routing (`get-route-map.tsx`, under `/settings`)

```tsx
{ path: "commissions",            lazy: () => import(".../commissions-list/commissions-page"), children: [
  { path: "edit-global",          lazy: () => import(".../global-commission-edit/global-commission-edit") },
  { path: "create",               lazy: () => import(".../commission-rule-create/commission-rule-create") },
]},
{ path: "commissions/:id",        lazy: () => import(".../commission-rule-detail/commission-rule-detail"),
  handle: { breadcrumb }, children: [
  { path: "edit",                 lazy: () => import(".../commission-rule-edit/commission-rule-edit") },
]},
```

Remove the `commission-rates` block. Old `/settings/commission-rates*`
deep links break — document in PR.

### i18n keys (`i18n/translations/en.json` first, then `$schema.json`)

Namespace `commissions.*` — see §"Frontend changes → i18n" for the full
key list. Every visible string uses `t(...)`; tab labels via `labelKey`;
`StatusBadge` label/color from `getIsActiveProps` in `common/utils.ts`.

### Conformance checklist (architecture doc §"Page-authoring checklist")

- [ ] Folder shape `commissions/<domain>-{list,create,edit,detail}/` with
  `index.ts` + `components/`.
- [ ] `SingleColumnPage` (page/detail) hosts; every section
  `<Container className="divide-y p-0">` with the standard header row.
- [ ] Compound export (`Object.assign(Root, {...})`) +
  `Children.count(children) > 0 ? children : <Defaults />`.
- [ ] Forms: `Form.Field` → `Form.Item` → `Form.Label`/`Form.Control`/
  `Form.ErrorMessage`; `KeyboundForm`; `transformNullableFormData`.
- [ ] Create: `RouteFocusModal` + `TabbedForm` + `defineTabMeta` per tab;
  `p-16` → `max-w-[720px] gap-y-8` body.
- [ ] Edit: `RouteDrawer` + `RouteDrawer.Form` + `KeyboundForm`;
  `gap-y-4` body; `ready` gate; secondary Cancel + primary Save.
- [ ] Data: `hooks/api/commissions.tsx` via `sdk.admin.*`,
  `queryKeysFactory`, invalidate `lists()`/`details()`/`detail(id)`;
  throw on `isError`; `Skeleton` while loading.
- [ ] Tables: `DataTable` + `useDataTable`, page size 20, `actions`
  column with `ActionMenu`, `NoRecords`/`NoResults`.
- [ ] Delete: `common/hooks/use-delete-commission-rule-action.tsx` with
  `usePrompt` + toast.
- [ ] Strings: all via `t("commissions.*")`, en.json first.
- [ ] Icons: only `@medusajs/icons` (`PencilSquare`, `Trash`,
  `EllipsisHorizontal`, `PlusMini`, …).
- [ ] Colors/typography/spacing: only Medusa UI tokens + the documented
  scale; `StatusBadge` for status.
- [ ] `data-testid` (kebab-case) on every interactive element, heading,
  input, button, dropdown item.

## Cross-cutting differences (summary)

| Theme | Figma target | Admin today | Verdict |
| --- | --- | --- | --- |
| Page | one **Commissions** page (Global + Rules) | standalone **Commission Rates** list | Different — merge |
| Global default | first-class card + edit drawer | implicit rule-less rate, no UI | Missing |
| Rule list columns | Rule · Type · Scope · Value · Status | code · type · is_enabled | Different |
| Rule "Type" | derived scope combo | flat single-reference rules | Different |
| Create | 2-step TabbedForm | single form | Different |
| Base toggles | Tax + **Shipping** included | tax + `target` enum (UI) | Different — surface `include_shipping`, drop `target` |
| Fixed value | per store currency | single value | Different |
| `code` | editable (Code field) | editable | Same — kept, user-editable |
| `priority`/`min_amount` | not shown | editable | Different — removed (SPEC-011) |

## Design-system conformance

Every new surface follows `docs/UI-ARCHITECTURE.md`: `SingleColumnPage`
hosts; sections as `<Container className="divide-y p-0">` with
`flex items-center justify-between px-6 py-4` headers; `SectionRow` for
label/value rows; `DataTable` + `useDataTable` (page size 20) with an
`actions` kebab column; `StatusBadge` for status; `Form.Field` →
`Form.Item` (never raw `Controller`); `TabbedForm` + `defineTabMeta` for
the wizard; `SwitchBox` for toggles; `RouteDrawer` / `RouteFocusModal`
hosts; `usePrompt` delete hook; `NoRecords` / `NoResults` empties; only
`@medusajs/icons` + Medusa UI tokens; every string through `t(...)` under
`commissions.*`; kebab-case `data-testid` on every interactive element.

## User-Visible Behavior

An operator opens **Settings → Commissions** and sees a **Global
Commission** card (the marketplace default — Type, Value, whether Tax and
Shipping are included, with an **Edit** action) above a **Commission
Rules** table. Each rule row shows its name, its **scope Type** (e.g.
*Store + Product Type*), the **Scope** it targets (e.g. "ACME + Outlet"),
its **Value**, and a **Status** badge. The operator can **Create** a rule
through a two-step wizard (choose scope dimensions, then the commission),
open a rule to a **detail** page (scope + commission sections), **edit**
the global commission or a rule via drawers, toggle a rule
active/inactive, and **delete** a rule with a confirmation prompt.

## Verification

> Cannot run until SPEC-011 lands and these screens are built. Verify each
> screen against its Figma reference frame; record evidence below.

1. **Commissions page** — `/settings/commissions` renders the Global
   Commission card (default rate) + the Rules table (Rule / Type / Scope
   / Value / Status); search / filter / sort / pagination behave; empty
   states correct; sidebar label "Commissions".
2. **Edit Global Commission** — drawer edits Type / Value (per-currency
   for Fixed) / Tax included / Shipping included; saves to the default
   rate.
3. **Create wizard** — Details tab (Title, Type combo, conditional
   Stores / Product Types / Categories) → Commission tab (Type, Value,
   Tax, Shipping); creates rate + grouped rules in one flow.
4. **Rule detail** — Scope section (Type + per-dimension rows) +
   Commission section (Type / Value / Tax / Shipping); status badge;
   Edit / Delete kebab.
5. **Edit rule + delete** — commission edit drawer saves; delete prompt
   removes the rule.
6. **Build & lint** — `bun run build` and `bun run lint` pass (no new
   errors in authored files).

## Evidence

_(empty — not yet implemented)_

## Dependencies & open questions

- **Depends on SPEC-011** for `include_shipping`, per-currency Fixed,
  AND-across-dimension matching, and the default-rate singleton. Resolved
  contract points this UI relies on:
  - **Default rate (SPEC-011 Q4 ✅)** — `useDefaultCommission` reads via
    `GET /admin/commission-rates?is_default=true`; `useUpdateDefaultCommission`
    writes via `POST /admin/commission-rates/:id`. No dedicated endpoint.
  - **Shipping-option rules dropped (SPEC-011 Q5 ✅)** — the create/edit UI
    offers no shipping rule type.
- Remaining UI question:
  - **Scope editing** — whether the rule edit drawer also edits scope
    dimensions (reuse `useBatchCommissionRules`) or scope is immutable
    post-create. Confirm against product intent.

## Evidence

### Implemented (2026-06-16) — branch `claude/sharp-germain-6a2615-admin-ui`

The admin Commissions UI was rebuilt under `packages/admin/src/pages/commissions/`
(the old `commission-rates` page family + `hooks/api/commission-rates.tsx`
were deleted; `pages/index.ts` + `hooks/api/index.ts` repointed).

- **Hooks** `hooks/api/commissions.tsx` — `useCommissionRule(s)`,
  `useDefaultCommission` (the `is_default` rate), `useCreate/Update/Delete
  CommissionRule`, `useBatchCommissionRules`; `queryKeysFactory("commissions")`,
  invalidation on every mutation.
- **`common/`** — `types.ts` (`ScopeType` + `SCOPE_TYPE_DIMENSIONS`),
  `utils.ts` (scope-type derivation from rules, scope summary, value
  formatter, status-badge props), `constants.ts`, and the
  `use-delete-commission-rule-action` prompt hook.
- **Commissions page** (`commissions-list`) — `SingleColumnPage` hosting the
  **Global Commission** section (`useDefaultCommission` → Code/Type/Value/Tax/
  Shipping + Edit kebab) and the **Commission Rules** table (DataTable,
  page-size 20, columns Rule/Type/Scope/Value/Status + row kebab, `is_default=
  false` so the default isn't listed, Create button → wizard).
- **Edit Global Commission** drawer (`global-commission-edit`) — RouteDrawer +
  Code/Type/Value + Tax/Shipping `SwitchBox`es, writes the default rate.
- **Create wizard** (`commission-rule-create`) — `RouteFocusModal` +
  `TabbedForm`: Details tab (Title, Code, scope-combo Type + conditional
  Stores/Product-Types/Categories `Combobox`es via `useComboboxData`) →
  Commission tab (Type, Value, Tax, Shipping). Submit expands the combo into
  dimension-grouped `rules[]` and creates the rate in one call.
- **Rule detail** (`commission-rule-detail`) — `SingleColumnPage`: Scope
  section (derived Type + per-dimension rows + Status badge + Edit/Delete
  kebab) and Commission section (Type/Value/Tax/Shipping + Edit kebab) +
  breadcrumb.
- **Edit Commission Rule** drawer (`commission-rule-edit`) — RouteDrawer
  editing name/code/type/value/enabled/tax/shipping.
- **Routing** `/settings/commissions` (+ `create`, `edit-global`, `:id`,
  `:id/edit`); settings sidebar label → "Commissions". Strings use
  `t(key, fallback)` so no i18n-schema changes were needed.

**Verification:** `bun run build` → **9/9**; `bun run lint` clean on the new
files.

### Deviations / remaining
- **Per-currency Fixed values is single-value** for now. The create wizard +
  both drawers use one numeric `value` for Fixed (backend resolves Fixed from
  `value` when `values[]` is absent — SPEC-011). The Figma per-currency
  `CurrencyInput` stack (`values[]`) is a follow-up.
- **Scope editing in the rule drawer** — the edit drawer edits the commission
  part + name/code/status; dimension (scope) editing via
  `useBatchCommissionRules` is not yet wired into the drawer.
- **List filters** (Add filter) and search/sort beyond the default DataTable
  controls are minimal.
- Runtime QA of the screens in the live dashboard (build + lint pass; not
  exercised headlessly).

## Order detail — Commission section (admin + vendor)

Implemented (2026-06-16). Both the **admin** and **vendor** order-detail
pages render a **Commission** section (`order-commission-section`) in the
main column, between the Summary and Payment sections.

- **Data** — `useOrderCommissionLines(orderId)` (admin + vendor
  `hooks/api/orders`) calls `GET /{admin,vendor}/orders/:id/commission-lines`
  (SPEC-011 review follow-ups) and returns the order's item **and** shipping
  commission lines. The vendor endpoint is seller-scoped. (This replaces the
  vendor's broken `useOrderCommission` hook, which pointed at a non-existent
  `/vendor/orders/:id/commission` route, and supersedes summing only
  `items.commission_lines` off the order graph — which silently missed
  shipping commission.)
- **UI** — a `<Container className="divide-y p-0">` section: a row per line
  (item lines labelled by the order item's title, shipping lines as
  "Shipping") with the amount, and a **Total** footer row. Hidden when the
  order has no commission lines. Strings via `t(...)` with safe fallbacks
  (`fields.commission`, `fields.shipping`, `orders.commission.total`), so no
  new i18n keys were required (the i18n schema test enforces exact en.json ↔
  `$schema.json` match).

## Notes

- The rename `commission-rates` → `commissions` ripples through routes,
  sidebar label, and the `commissionRates.*` → `commissions.*` i18n
  namespace; old deep links break (document in PR).
- The shipped edit form already batches rule changes via
  `useBatchCommissionRules` — reuse it for scope-dimension editing rather
  than rebuilding.
- SPEC-011 **removes** `priority` / `min_amount` / `target` (+ the
  `shipping_option_type` rule path) — the new UI authors none of them.
  `code` is a **user-editable, required** field — surfaced in the create
  wizard (Details tab) and the Global Commission drawer. The matching
  tie-break is deterministic (specificity, then `created_at`), so the UI
  needs no priority control.
