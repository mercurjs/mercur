---
status: passing
canonical: false
priority: 2
area: vendor/customers
created: 2026-06-15
last_updated: 2026-06-16
---

# SPEC-019 Vendor Customers & Customer Groups — Figma vs Implementation Gap

This spec audits the **Customers** and **Customer Groups** surfaces of
`@mercurjs/vendor` (`packages/vendor/src/pages/customers`) against the
canonical Figma file *Mercur 2.0 — Vendor Panel B2C*
(`figma.com/design/sYJoh84Owr5tomRjpxG0no`). It lists every screen the
design covers, classifies each one against the current implementation as
**exists / missing / different / dead**, and records the work needed to
bring the vendor panel in line with the design.

It tracks two Linear issues, both under parent `MER-89`:

- [MER-147 — Customers · Vendor Panel](https://linear.app/rigbyjs/issue/MER-147/customers-vendor-panel)
  → Figma page `40014595:662769` ("↳ Customers 🟢")
- [MER-148 — Customer Groups · Vendor Panel](https://linear.app/rigbyjs/issue/MER-148/customer-groups-vendor-panel)
  → Figma page `40014595:765498` ("↳ Customer Groups 🟢")

It is intentionally **descriptive, not prescriptive**: the design is the
source of truth for what should exist; the code paths cited below are
what exists today. Any decision that diverges from the design must be
captured here (or in a child spec) with a documented reason — silent
drift fails the audit.

## TL;DR — headline gaps

1. **No backend exists for the seller-scoped writes the UI assumes.**
   `packages/core/src/api/vendor/customers/` ships only `GET /vendor/customers`
   (list) and `GET /vendor/customers/:id` (detail). There is **no**
   `/vendor/customers/:id/customer-groups` batch route, and the entire
   `packages/core/src/api/vendor/customer-groups/` tree **does not
   exist**. The generated vendor SDK map
   (`packages/vendor/.mercur/_generated/index.ts:538`) only exposes
   `vendor.customers` + `vendor.customers.$id`.
2. **The vendor UI was scaffolded ahead of that backend** (ported from
   admin) and references routes that aren't there — `customer-groups.tsx`
   calls `sdk.vendor.customerGroups.*`, `customers.tsx` calls
   `sdk.vendor.customers.$id.{mutate,customerGroups,addresses}` — none of
   which are in the SDK map. These hooks are **dangling**. **Important:
   not all of them are design-backed.** Edit-customer
   (`sdk.vendor.customers.$id.mutate`) and address CRUD
   (`sdk.vendor.customers.$id.addresses.*`) are **out-of-design** — the
   vendor Customer detail in Figma is **read-only** (no header kebab, no
   Edit button, no Add/edit/delete on the Addresses card; verified against
   master `40014784:1382778`). Only the customer↔group batch
   (`sdk.vendor.customers.$id.customerGroups.mutate`) and the
   `customerGroups.*` tree correspond to real design flows. The
   speculative edit/address ports should be removed (or left dormant and
   not extended), **not** turned into backend.
3. **Customer Groups has no page surface at all.** No
   `packages/vendor/src/pages/customer-groups/` folder, the
   `/customer-groups` route block in `get-route-map.tsx` is commented out
   ("CUSTOMER GROUPS - disabled"), and the Customers sidebar entry has
   `items: []` (no nested "Customer Groups" link the design shows).
4. **The customer detail page diverges structurally** — it is a
   `SingleColumnPage` that mounts only General + Orders. The design is a
   `TwoColumnPage` with an Addresses sidebar, a Customer Groups section,
   and Metadata/JSON sections. `CustomerGroupSection` is built but
   **dead** (defined in the compound export, never rendered).

## Source designs

### Customers (`MER-147`, page `40014595:662769`)

Canonical master symbols live in the *Parent Components* frame; flow
frames hang to the right. All IDs are stable Figma node IDs in the file
above.

| Screen | Master symbol | Notable flow frames |
| --- | --- | --- |
| Customers list | `40014596:999195` | filter-open `40014701:618084`, sort/empty variants |
| Customer Details (detail read view) | `40014784:1382778` | filter variants `40014784:1385997`, `40014784:1388379` |
| Add Customer Groups (focus modal) | `40014784:1399549` | add-toast `40014788:1418028`, remove-group menu/prompt/toast `40014788:1422527`/`1426337`/`1432912` |

### Customer Groups (`MER-148`, page `40014595:765498`)

| Screen | Master symbol | Notable flow frames |
| --- | --- | --- |
| Customer Groups list | `40014792:1454408` | filter `40014792:1539374`, row-menu `40014792:1541362` |
| Customer Group Details | `40014792:1454409` | detail-menu `40014792:1551357`, edit `40014792:1561723`, delete `40014792:1568063` |
| Add Customers (focus modal) | `40014792:1454780` | add-toast `40014795:1585915` |
| Create Customer Group (focus modal) | `40014841:1617578` *(symbol mislabelled "Create Address")* | create-flow `40014841:1619632`, `40014841:1623616` |
| Remove Customer (menu + bulk command bar + prompt + toast) | — | `40014795:1590085`, `1594272`, `1596379`, `1598496` |

> **Symbol naming note:** the `40014841:1617578` master is named
> "Create Address" in Figma but renders the **Create Customer Group**
> focus modal (single `Name` field, copy "Create a new customer group to
> segment your customers."). Treat the rendered content as canonical, not
> the layer name.

## Current surface map

Implementation rooted at `packages/vendor/src/pages/customers`:

```
customers/
  customer-list-page.tsx                       # SingleColumnPage host
  _components/customer-list-table/
    customer-list-table.tsx                    # Container shell
    customer-list-header.tsx                   # Heading + actions slot
    customer-list-data-table.tsx               # _DataTable + filters + sort + search
  [id]/
    customer-detail-page.tsx                   # SingleColumnPage (General + Orders ONLY)
    loader.tsx, breadcrumb.tsx
    _components/
      customer-general-section/                # header card + Name/Company/Phone
      customer-order-section/                  # orders table
      customer-group-section/                  # BUILT but NOT mounted (dead)
    edit/                                       # RouteDrawer edit form (dangling hook)
    add-customer-groups/                        # RouteFocusModal picker (dangling hook)
    metadata/                                    # metadata edit route

# NO customer-groups/ pages folder exists.
```

Hooks: `packages/vendor/src/hooks/api/customers.tsx`,
`packages/vendor/src/hooks/api/customer-groups.tsx` (full CRUD +
add/remove members, all against not-yet-existing routes).

Routes registered in `packages/vendor/src/get-route-map.tsx`:
`/customers`, `/customers/:id` (+ `edit`, `add-customer-groups`,
`metadata` children). The `/customer-groups` block is **commented out**.

Backend: `packages/core/src/api/vendor/customers/` →
`route.ts` (GET list), `[id]/route.ts` (GET detail), plus
`helpers.ts` (`validateSellerCustomer`), `middlewares.ts`,
`query-config.ts`, `validators.ts`. No `customer-groups/` tree.

## Per-screen audit — Customers (MER-147)

Status legend: **Exists** (aligned) · **Different** (diverges) ·
**Missing** (no code) · **Dead** (code present, not wired).

### Customers list (master `40014596:999195`)

- **Page shell** — Exists. `CustomerListPage` → `SingleColumnPage` +
  `Container className="divide-y p-0"`
  (`customers/customer-list-page.tsx`, `_components/customer-list-table/`).
- **Columns** — Verify. Design columns: `Email · Name · Account
  (Registered/Guest badge) · Created`. Code columns come from
  `hooks/table/columns/use-customer-table-columns.tsx` — confirm the set
  matches and that `Account` renders a green (`Registered`) / orange
  (`Guest`) `StatusBadge` keyed on `has_account`.
- **Search input** — Exists. `search` prop passed to `_DataTable`;
  `useCustomerTableQuery` wires `q`.
- **`Add filter`** — Verify. `useCustomerTableFilters()` is wired;
  confirm the filter set matches the design's Filter Menu frames
  (`40014701:618084`).
- **Sort menu** — Exists. `orderBy` exposes email/first_name/last_name/
  has_account/created_at/updated_at.
- **Pagination** — Different. `PAGE_SIZE = 20`
  (`customer-list-data-table.tsx`); design footer reads "1 — 10 of 100
  results" (page size 10). Decide: keep 20 (document) or align to 10.
- **Empty state** — Exists (`customers.list.noRecordsMessage`).

### Customer detail — read view (master `40014784:1382778`)

- **Layout** — **Different (structural).** Design is a `TwoColumnPage`:
  Main column (header card → Orders → Customer Groups → Metadata → JSON)
  + Sidebar (Addresses). Code uses `SingleColumnPage` and mounts only
  `CustomerGeneralSection` + `CustomerOrderSection`
  (`customer-detail-page.tsx:31-34`).
- **Header card** — Exists. `CustomerGeneralSection` renders email +
  Registered/Guest `StatusBadge` and Name / Company / Phone rows.
  Matches the design's header block.
- **Orders section** — Exists (`customer-order-section`). Verify columns
  (`Order ID · Date · Payment · Fulfillment · Order Total`), search,
  filter, and pagination against the design.
- **Customer Groups section** — **Dead.** `CustomerGroupSection` is
  fully built (table, `Add` button → `/customers/:id/add-customer-groups`,
  row kebab Edit/Remove, bulk remove command, prompts/toasts) and
  exported as `CustomerDetailPage.GroupSection`, but
  `customer-detail-page.tsx` never renders it. The design places this
  section in the Main column under Orders. **Also depends on the missing
  batch backend** (see Backend gap).
- **Addresses sidebar** — **Missing (read-only).** Design shows an
  Addresses card listing blocks (e.g. Home / Office: line1/line2,
  city/postal, country) with **no** "Add" button and **no** per-address
  kebab — it is display-only (verified against master `40014784:1382778`).
  No address section component exists in the detail page. **No address
  CRUD backend is needed**; the existing `GET /vendor/customers/:id` just
  needs `+addresses.*` added to its `query-config.ts` fields so the
  customer payload carries the addresses to render.
- **Metadata + JSON sections** — Partial / Missing. `metadata/` edit
  route exists, but the detail page does not render the collapsible
  `Metadata (N keys)` / `JSON (N keys)` sections the design shows at the
  bottom of the Main column. (`SingleColumnPage`/`TwoColumnPage` support
  `showMetadata` / `showJSON` flags — currently unused here.)
- **Header kebab** — Verify against design. Design header for a customer
  is read-only (no Edit/Delete kebab on the customer header itself in the
  master); confirm whether an Edit affordance is expected.

### Edit customer (`customers/[id]/edit/`) — OUT OF DESIGN

- **Not in the Figma design.** The vendor Customer detail is read-only;
  there is no Edit-customer trigger, frame, or flow on the Customers page
  (verified against master `40014784:1382778` and the page's flow frames,
  which only cover Add/Remove Customer Group).
- **Removed.** The speculative `RouteDrawer` edit form (was at
  `/customers/:id/edit`, ported from admin) and its `edit` route child in
  `get-route-map.tsx` have been **deleted** (the
  `packages/vendor/src/pages/customers/[id]/edit/` folder is gone). A
  vendor editing a shared buyer's profile is semantically wrong (the
  customer is a platform-level entity, not seller-owned) and the design
  has no edit affordance. No `PATCH /vendor/customers/:id` will be built
  for customer fields.
- **Residual:** `useUpdateCustomer` is **kept** — it is still used by the
  `metadata/` route (design-backed Metadata section). The address
  mutation hooks in `customers.tsx` (`useCreateCustomerAddress`,
  `useUpdateCustomerAddress`, `useDeleteCustomerAddress`,
  `useListCustomerAddresses`, `useCustomerAddress`) are now fully unused
  and can be deleted as follow-up cleanup. The `customers.edit.*` i18n
  keys are now orphaned (harmless; leave or prune with `$schema.json`).

### Add Customer Groups (focus modal, master `40014784:1399549`)

- **Modal** — Exists (UI). `RouteFocusModal` at
  `/customers/:id/add-customer-groups` renders a checkbox group-picker
  table (Name / Customers), Add filter, Search, Cancel/Save — matches the
  design.
- **Backend** — **Missing.** Submit calls
  `useBatchCustomerCustomerGroups` →
  `sdk.vendor.customers.$id.customerGroups.mutate`, which is not in the
  SDK map and has no vendor route. **Add-to-group is non-functional.**
- **Remove-from-group flows** — Partial (UI). The group section's row
  kebab `Remove` and the bulk command-bar `Remove` exist with
  prompts/toasts, but both go through the same missing batch / remove
  routes.

## Per-screen audit — Customer Groups (MER-148)

Entire surface is **Missing** at the page/route/nav/backend level. The
only customer-group code that exists today is (a) the
`hooks/api/customer-groups.tsx` hook file (dangling — targets
`sdk.vendor.customerGroups.*`) and (b) the dead `CustomerGroupSection`
embedded in the customer detail page.

### Sidebar / navigation

- **Missing.** Design sidebar shows `Customers` with a nested
  `Customer Groups` item. Code: the Customers nav entry in
  `components/layout/main-layout/main-layout.tsx:301-306` has
  `items: []`. Add the nested `Customer Groups → /customer-groups` link.
- **Route registration** — Missing. The `/customer-groups` block in
  `get-route-map.tsx` is commented out ("CUSTOMER GROUPS - disabled").

### Customer Groups list (master `40014792:1454408`)

- **Missing.** Design: `SingleColumnPage` + `Container`, columns
  `Name · Customers · Created · Updated`, top-right `Create` button,
  Add filter, Search, table-settings, row kebab (Edit / Delete),
  pagination. No `customer-group-list` page exists. (Admin reference:
  `packages/admin/src/pages/customer-groups/customer-group-list/`.)

### Customer Group detail (master `40014792:1454409`)

- **Missing.** Design: header card (group name + kebab → Edit / Delete),
  a `Customers` count row, then a `Customers` section (header `Add`
  button; Add filter + Search; table `Email · Name · Account · Created`;
  row kebab → Remove; row checkboxes + bulk command bar → Remove;
  prompts/toasts), then Metadata + JSON sections. No
  `customer-group-detail` page exists. (Admin reference:
  `packages/admin/src/pages/customer-groups/customer-group-detail/`.)

### Create Customer Group (focus modal, master `40014841:1617578`)

- **Missing.** Design: `RouteFocusModal` with a single `Name` field,
  description "Create a new customer group to segment your customers.",
  Cancel / Create footer. Hook `useCreateCustomerGroup` exists but is
  dangling; no create page/route.

### Edit Customer Group (modal, frame `40014792:1561723`)

- **Missing.** Design: modal (560-wide) with a `Name` input, Cancel /
  Save. Hook `useUpdateCustomerGroup` exists but is dangling; no edit
  page/route.

### Add Customers (focus modal, master `40014792:1454780`)

- **Missing.** Design: `RouteFocusModal` with a customer-picker table
  (`Email · Name · Account · Created`, checkboxes), Add filter, Search,
  Cancel / Save. Hook `useAddCustomersToGroup` exists but is dangling; no
  page/route.

### Remove Customer / Delete Group flows

- **Missing.** Design covers row-kebab Remove, bulk command-bar Remove,
  confirmation prompts, and success toasts for both removing customers
  from a group and deleting a group. Hooks
  (`useRemoveCustomersFromGroup`, `useDeleteCustomerGroup`) exist but are
  dangling; no UI surface mounts them.

## Backend gap (blocks most of the above)

The seller-scoped backend must exist before the **design-backed** write
flows function. Current state: `packages/core/src/api/vendor/customers/`
has only the two GET routes; `packages/core/src/api/vendor/customer-groups/`
does not exist. Required, mirroring the Medusa admin shape so the typed
client route map can be shared (admin reference is already imported in
the generated map at lines 50-60):

- `POST /vendor/customers/:id/customer-groups` — batch add/remove the
  customer's group membership (`{ add: [], remove: [] }`). Backs the
  Add/Remove Customer Group flows on the customer detail page.
- `GET/POST /vendor/customer-groups`,
  `GET/POST/DELETE /vendor/customer-groups/:id`,
  `POST /vendor/customer-groups/:id/customers` (batch add/remove members)
  — the full Customer Groups tree (list/create/edit/delete + add/remove
  members), all design-backed.
- Re-run `mercurjs codegen` so the new routes land in the vendor SDK map;
  this is what makes the design-backed dangling hooks type-check and
  function.

**Addresses are read-only — no CRUD routes.** Do **not** add
`/vendor/customers/:id/addresses`. Instead expand the existing
`GET /vendor/customers/:id` `query-config.ts` to include `+addresses.*`
so the read-only Addresses sidebar can render.

**Edit-customer is out of design — no `PATCH /vendor/customers/:id`.**
The customer is a platform-level (shared buyer) entity; the vendor view
is read-only. Do not build a customer-edit route; remove the speculative
edit UI instead (see "Edit customer — OUT OF DESIGN").

**Seller-scoping is the key design constraint, and the link does not
exist yet.** Today there is a `seller_customer` module link
(`packages/core/src/links/seller-customer-link.ts`,
`defineLink(Seller ↔ Customer)`, both `isList`) — this is what
`customers/helpers.ts::validateSellerCustomer` queries to scope a vendor
to its customers. **There is no `seller_customer_group` link.** No
`seller-customer-group-link.ts` exists and no `defineLink` connects
`SellerModule.linkable.seller` to `CustomerModule.linkable.customerGroup`
anywhere in `packages/core/src/links/`. Customer groups are therefore
**global Medusa entities with no seller ownership** today (the only
`customer_group` usage in core is the vendor *promotions* rule config,
which targets the global entity).

To resolve it, add the seller link **and a wrapper workflow** that owns
the link as a side effect of creation — mirroring the existing campaign
pattern (`createSellerCampaignsWorkflow` + `linkSellerCampaignStep`) 1:1.
Do **not** call Medusa's `createCustomerGroupsWorkflow` directly from the
route; call the Mercur wrapper so every created group is owned by the
seller.

1. **`seller_customer_group` link** —
   `packages/core/src/links/seller-customer-group-link.ts`, mirroring
   `seller-customer-link.ts`:

   ```ts
   import { defineLink } from "@medusajs/framework/utils"
   import CustomerModule from "@medusajs/medusa/customer"
   import SellerModule from "../modules/seller"

   export default defineLink(
     { linkable: SellerModule.linkable.seller, isList: true },
     { linkable: CustomerModule.linkable.customerGroup, isList: true }
   )
   ```

2. **Create wrapper workflow** —
   `packages/core/src/workflows/customer-group/` (re-export via
   `workflows/index.ts`):

   ```ts
   // workflows/create-seller-customer-groups.ts
   export const createSellerCustomerGroupsWorkflow = createWorkflow(
     "create-seller-customer-groups",
     (input: { customer_groups: CreateCustomerGroupDTO[]; seller_id: string }) => {
       const created = createCustomerGroupsWorkflow.runAsStep({
         input: { customersData: input.customer_groups }, // Medusa's field name
       })
       const ids = transform(created, (cgs) => cgs.map((c) => c.id))
       linkSellerCustomerGroupStep({ seller_id: input.seller_id, customer_group_ids: ids })
       return new WorkflowResponse(created)
     }
   )
   ```

   ```ts
   // steps/link-seller-customer-group.ts — create + compensation (dismiss)
   // link object: { [MercurModules.SELLER]: { seller_id },
   //                [Modules.CUSTOMER]: { customer_group_id } }
   ```

   (Verified field names against installed core-flows: input is
   `customersData: CreateCustomerGroupDTO[]`, output `CustomerGroupDTO[]`;
   `customerGroup` is the customer-module linkable.)

3. **`validateSellerCustomerGroup` helper** (sibling of
   `validateSellerCustomer`) that checks the `seller_customer_group` link,
   used to seller-scope the list/detail/update/delete/members routes.
   `update`/`delete`/members routes don't need their own link wrappers —
   Medusa's link cascade cleans `seller_customer_group` rows on group
   delete; just guard them with this helper.

Without this link the vendor would see/edit every marketplace group —
a cross-tenant leak. This is the single biggest backend prerequisite for
MER-148.

## Implementation plan (UI-ARCHITECTURE conformance)

Everything below is prescriptive and must follow `docs/UI-ARCHITECTURE.md`.
Cross-cutting rules that apply to **every** item in this plan:

- **Layout** — lists use `SingleColumnPage` + `Container className="divide-y p-0"`;
  detail uses `TwoColumnPage` (`Main` + `Sidebar`, exactly two children).
  Every section is a `Container className="divide-y p-0"` with a
  `flex items-center justify-between px-6 py-4` header (`<Heading>` left,
  `Button`/`ActionMenu` right). Label/value rows use `SectionRow` or
  `grid grid-cols-2 ... px-6 py-4`.
- **Compound export** — each page exports
  `Object.assign(Root, { ... })` with the
  `Children.count(children) > 0 ? children : <Defaults />` pattern (mirror
  the existing `CustomerListPage`).
- **Create** → `RouteFocusModal`; **Edit** → `RouteDrawer.Form` +
  `KeyboundForm`; **single-field create/edit** still uses the modal/drawer
  shells, not a bare form.
- **Forms** — React Hook Form + `zodResolver`, every field through
  `Form.Field → Form.Item → Form.Label / Form.Control / Form.ErrorMessage`.
  Never raw `Controller`. Schema co-located as `schema.ts`. Gate edit forms
  behind `ready = !isPending && !!entity`.
- **Tables** — `_DataTable` + `useDataTable`, `createColumnHelper<Row>()`,
  an `actions` display column rendering `<ActionMenu>`, `navigateTo`,
  `keepPreviousData`, query via a `useXTableQuery` hook returning
  `{ raw, searchParams }`. **Page size 20** per the architecture default
  (this overrides the design's "10" mock — see Decisions).
- **Data** — all traffic through `sdk.vendor.*`; one
  `hooks/api/<domain>.tsx` per domain using `queryKeysFactory`; mutations
  invalidate `lists()` / `details()` / `detail(id)` and forward `onSuccess`.
  Throw on `isError`. Detail pages seed via `loader.ts` + `initialData`.
- **Destructive actions** — extract to
  `pages/<domain>/common/hooks/use-delete-<entity>-action.tsx` using
  `usePrompt()` then `toast`. Never inline a confirmation modal.
- **i18n** — every string via `t(...)`; new keys land in
  `packages/vendor/src/i18n/translations/en.json` first (the `customers.*`
  and `customerGroups.*` namespaces already exist). Update `$schema.json`.
- **Icons** — `@medusajs/icons` only. **Tokens** — Medusa UI color /
  spacing / typography tokens only. **Test ids** — kebab-case
  `data-testid` on every interactive element, header, input, button,
  dropdown item.
- **Reference** — port from the admin equivalents under
  `packages/admin/src/pages/customers/` and
  `packages/admin/src/pages/customer-groups/`, swapping `sdk.admin.*` →
  `sdk.vendor.*` and seller-filtering the data.

### Backend (do first — unblocks every write flow)

Mirror the Medusa admin route shape segment-for-segment so the typed
client map can be shared (`docs/UI-ARCHITECTURE.md` §Data fetching;
admin reference already imported in
`packages/vendor/.mercur/_generated/index.ts:50-60`). All routes
seller-scoped via the `customers/helpers.ts::validateSellerCustomer`
pattern (add a `validateSellerCustomerGroup` sibling).

```
packages/core/src/links/
  seller-customer-group-link.ts       # NEW: defineLink(Seller <-> CustomerGroup), both isList
packages/core/src/workflows/customer-group/    # NEW: create wrapper + link step (see Backend gap sketch)
  workflows/create-seller-customer-groups.ts   #   wraps createCustomerGroupsWorkflow + links to seller
  steps/link-seller-customer-group.ts          #   remoteLink.create/dismiss (with compensation)
packages/core/src/api/vendor/customers/
  [id]/customer-groups/route.ts       # POST batch { add: [], remove: [] }
  query-config.ts                     # add +addresses.* so detail GET carries addresses (read-only)
  # NO PATCH on [id]/route.ts  — edit-customer is out of design
  # NO addresses/ subtree         — addresses are read-only display
packages/core/src/api/vendor/customer-groups/      # NEW TREE
  route.ts                            # GET list, POST create
  [id]/route.ts                       # GET, POST (edit), DELETE
  [id]/customers/route.ts             # POST batch members { add: [], remove: [] }
  helpers.ts                          # validateSellerCustomerGroup
  middlewares.ts                      # validators + query-config wiring
  query-config.ts                     # default fields/relations (+customers.id, counts)
  validators.ts                       # zod: create/update group, batch members
```

Wire `vendorCustomerGroupsMiddlewares` into
`packages/core/src/api/vendor/middlewares.ts`, then re-run
`mercurjs codegen` so the new routes appear in the vendor SDK map. This
is what makes the existing dangling hooks
(`sdk.vendor.customerGroups.*`, `sdk.vendor.customers.$id.{mutate,customerGroups,addresses}`)
type-check and function. Add integration suites under
`integration-tests/http/customer/vendor/` and
`integration-tests/http/customer-group/vendor/` (happy path + cross-seller
403/404 on every route).

### Hooks (`packages/vendor/src/hooks/api/`)

- `customers.tsx` — keep only the design-backed hooks: `useCustomer`,
  `useCustomers`, `useBatchCustomerCustomerGroups`. Verify the batch
  invalidates `customersQueryKeys.detail(id)` +
  `customerGroupsQueryKeys.lists()`. **Remove** `useUpdateCustomer` and
  the address hooks (`use*Address*`) — they are out-of-design (no backend,
  no design flow). Do not extend them.
- `customer-groups.tsx` — already has full CRUD + add/remove members
  against `sdk.vendor.customerGroups.*`; keep as-is, verify after codegen.
- Add table-state hooks per list:
  `hooks/table/query/use-customer-group-table-query.tsx` (exists),
  plus columns hooks
  `hooks/table/columns/use-customer-group-table-columns.tsx` (NEW — list
  columns Name/Customers/Created/Updated) and the customer-picker columns
  reused by Add Customers.

### Customers (MER-147) — page work

1. **Detail page → `TwoColumnPage`** (`customers/[id]/customer-detail-page.tsx`).
   Replace `SingleColumnPage` with `TwoColumnPage` carrying
   `data={customer}`, `showMetadata`, `showJSON`:
   - `TwoColumnPage.Main`: `CustomerGeneralSection` → `CustomerOrderSection`
     → **mount the existing `CustomerGroupSection`** (currently dead).
   - `TwoColumnPage.Sidebar`: **new read-only `CustomerAddressSection`**
     under `_components/customer-address-section/` — a `Container` listing
     address blocks (label, line1/line2, city/postal, country) per the
     design's Addresses card. **No "Add" button, no per-row kebab** (the
     design is display-only). Use `SectionRow`/inline grids; gate empty
     state with `NoRecords` (no CTA). Data comes from the customer payload
     once `+addresses.*` is added to the detail GET `query-config.ts`.
   - Swap the skeleton to `TwoColumnPageSkeleton`.
   - Keep the compound export; add `SidebarAddressSection` slot as needed.
2. **List** — already conformant; reconcile columns against the design in
   `use-customer-table-columns.tsx` (Email / Name / Account badge /
   Created) and confirm the `Account` cell renders `StatusBadge`
   green=`Registered` / orange=`Guest`.
3. **Edit drawer — DONE (removed).** The `customers/[id]/edit/` route +
   drawer and its `edit` child in `get-route-map.tsx` are deleted. The
   vendor customer view is read-only. `useUpdateCustomer` kept for
   `metadata/`; address mutation hooks left dead for follow-up cleanup.
4. **Add Customer Groups modal** — `customers/[id]/add-customer-groups/`
   already a `RouteFocusModal` picker; verify against the batch route.

### Customer Groups (MER-148) — new surface (port from admin)

Folder shape (admin-style, preferred for new code):

```
packages/vendor/src/pages/customer-groups/
  index.ts                                   # barrel
  common/
    hooks/use-delete-customer-group-action.tsx
  customer-group-list/
    customer-group-list.tsx                  # SingleColumnPage host + compound export
    components/customer-group-list-table/
      customer-group-list-table.tsx          # Container shell
      customer-group-list-header.tsx         # Heading + "Create" Button (Link to /create)
      customer-group-list-data-table.tsx     # _DataTable: Name/Customers/Created/Updated + row ActionMenu (Edit/Delete)
  customer-group-detail/
    customer-group-detail.tsx                # TwoColumnPage (Main + Sidebar) + showMetadata/showJSON
    breadcrumb.tsx
    loader.ts                                # seeds useCustomerGroup via initialData
    components/
      customer-group-general-section/        # header card: name + kebab (Edit/Delete) + Customers count row
      customer-group-customer-section/        # Customers table: Email/Name/Account/Created, "Add" button,
                                              #   row kebab Remove, checkbox bulk + command-bar Remove
  customer-group-create/
    customer-group-create.tsx                # RouteFocusModal + create form
    components/create-customer-group-form/
      create-customer-group-form.tsx         # single Name field; copy "Create a new customer group to segment your customers."
      schema.ts                              # zod { name: z.string().min(1) }
  customer-group-edit/
    customer-group-edit.tsx                  # RouteDrawer.Form + Name field
    components/edit-customer-group-form/
      edit-customer-group-form.tsx
  customer-group-add-customers/
    customer-group-add-customers.tsx         # RouteFocusModal customer-picker (Email/Name/Account/Created + checkboxes)
    components/...
```

Then:

- **Route registration** — uncomment / replace the disabled
  `/customer-groups` block in `packages/vendor/src/get-route-map.tsx` with
  `""` (list), `:id` (detail) and nested modal children `create`, `edit`,
  `add-customers`, `metadata`, each a `lazy()` import. Mirror the
  `/customers` block already present.
- **Sidebar** — in
  `packages/vendor/src/components/layout/main-layout/main-layout.tsx`
  change the Customers entry's `items: []` to
  `items: [{ label: t("customerGroups.domain"), to: "/customer-groups" }]`
  so the nested link the design shows appears.
- **Create vs Edit shells** — Create is a `RouteFocusModal` (full screen,
  single `Name` field, `Create` footer); Edit is a `RouteDrawer` (560-wide
  in the design maps cleanly to the drawer), `Name` field, `Save` footer.
  Both reuse `schema.ts`.
- **Detail kebab** — `customer-group-general-section` header renders
  `<ActionMenu>` with Edit (`to: "edit"`, `PencilSquare`) then a separate
  destructive group Delete (`onClick` from
  `use-delete-customer-group-action`, `Trash`).
- **Members table** — reuse the customer columns (Email / Name / Account
  badge / Created); row `ActionMenu` Remove + bulk via `commands` +
  command bar, each going through `useRemoveCustomersFromGroup`. "Add"
  button routes to the `add-customers` focus modal.

### i18n keys to add

Most live already under `customers.*` / `customerGroups.*`. Confirm /
add: `customerGroups.create.{header,hint}` ("Create Customer Group" /
"Create a new customer group to segment your customers."),
`customerGroups.edit.header`, `customerGroups.delete.{title,description,successToast}`,
`customerGroups.customers.{add,remove,removeMany}`,
`customers.addresses.{domain,home,office,empty}`, plus column header keys
under `fields.*` (reuse `fields.name`, `fields.createdAt`,
`fields.updatedAt`, `customerGroups.customers` for the count column).

## Decisions to confirm (open questions)

1. **Page size** — design shows 10; code uses 20. Align or document.
2. **Group ownership/scoping** — are customer groups seller-owned, or
   shared platform groups the vendor can attach its customers to? This
   determines the backend filter and whether `Create`/`Delete` group are
   even vendor-allowed. **Current state: there is no `seller_customer_group`
   link at all** (see Backend gap) — groups are global today. The design
   (Create / Edit / Delete affordances on the CG list + detail) implies
   seller-owned groups, which requires adding the link first. Confirm this
   ownership model before any MER-148 work starts.
3. **Customer edit/address writes** — RESOLVED by the design: the vendor
   customer detail is **read-only** (no header kebab, no Edit, no address
   Add/edit/delete; verified against master `40014784:1382778`). Confirm
   only the cleanup decision: remove the speculative `edit/` route +
   drawer + `useUpdateCustomer`/address hooks (recommended) vs. leave them
   dormant. No customer-edit or address-CRUD backend will be built.
4. **Metadata/JSON sections** — confirm these are in scope for the vendor
   detail pages (they appear in the design) before wiring `showMetadata` /
   `showJSON`.

## Verification

Once implemented, verify (UI + integration):

1. **Customers list** — `Email/Name/Account/Created` columns, Registered
   (green) / Guest (orange) badges, search + filters + sort, pagination
   footer. Seller only sees its own customers.
2. **Customer detail** — `TwoColumnPage`: header card (read-only, no
   kebab), Orders section, Customer Groups section (with working Add +
   Remove), read-only Addresses sidebar (fed by `+addresses.*`),
   Metadata/JSON sections. `CustomerGroupSection` is actually mounted.
3. **Customer read-only** — no Edit affordance on the customer header or
   Addresses card; the `/customers/:id/edit` route is gone.
4. **Add/remove customer groups** — batch route persists membership;
   toasts fire; cross-seller customers/groups are rejected.
5. **Customer Groups list** — `/customer-groups` route + nested sidebar
   link present; `Name/Customers/Created/Updated` columns; `Create`
   button; row kebab Edit/Delete.
6. **Customer Group detail** — header kebab Edit/Delete; Customers
   section with Add/Remove (row + bulk); Metadata/JSON.
7. **Create / Edit group** — focus modal / modal with `Name`; persists;
   seller-scoped.
8. **Backend** — integration suites under
   `integration-tests/http/customer*/vendor/` covering each route with
   seller-scope guards (cross-seller access returns 403/404).
9. `bun run build` passes; the dangling hooks now resolve against the
   regenerated SDK map.

## Evidence

Implemented 2026-06-16.

**Backend** (`packages/core`):
- `links/seller-customer-group-link.ts` — `defineLink(Seller ↔ CustomerGroup)`.
- `workflows/customer-group/` — `createSellerCustomerGroupsWorkflow` +
  `linkSellerCustomerGroupStep` (create + dismiss compensation), exported
  via `workflows/index.ts`.
- `api/vendor/customer-groups/` — `route.ts` (GET list seller-scoped via
  `seller_customer_group` link filter; POST create via the wrapper),
  `[id]/route.ts` (GET/POST/DELETE, all guarded by
  `validateSellerCustomerGroup`), `[id]/customers/route.ts` (POST batch
  members via `linkCustomersToCustomerGroupWorkflow`), plus
  `query-config.ts`, `validators.ts`, `helpers.ts`, `middlewares.ts`.
- `api/vendor/customers/[id]/customer-groups/route.ts` — POST batch a
  customer's groups (`linkCustomerGroupsToCustomerWorkflow`), guarded by
  `validateSellerCustomer` + per-group `validateSellerCustomerGroup`.
  Customer middlewares + `VendorManageCustomerCustomerGroups` validator +
  `groups` filterable field added. `vendorCustomerGroupsMiddlewares` wired
  into `api/vendor/middlewares.ts`.
- `packages/types/src/http/customer.ts` — `VendorCustomerGroup{,List,Delete}Response`.
- `bunx @mercurjs/cli codegen` regenerated `packages/core/.mercur/routes.d.ts`
  (vendor `customerGroups` tree + `customers.$id.customerGroups`).

**Frontend** (`packages/vendor`):
- Customer detail → `TwoColumnPage`: Main = General + Orders + (now
  mounted) `CustomerGroupSection`; Sidebar = new read-only
  `CustomerAddressSection`; `showMetadata`/`showJSON`.
- New `pages/customer-groups/` surface ported from admin: list, detail
  (general + customers sections), create (`RouteFocusModal`, Name), edit
  (`RouteDrawer`), add-customers (`RouteFocusModal` picker), metadata.
- `/customer-groups` route block enabled in `get-route-map.tsx`; nested
  `Customer Groups` link added to the Customers sidebar entry.
- Speculative customer `edit/` route + drawer removed (out of design).

**Verification:**
- `bunx turbo run build` → **9/9 packages pass** (1m9s).
- `integration-tests/http/customer-group/vendor/customer-group.spec.ts` →
  **12/12 pass** (create + seller ownership link, list scoping, get/update/
  delete own vs cross-seller 404, members add/remove + cross-seller 404,
  customer's-groups batch + ownership 404).
- `oxlint` clean on all touched core + vendor files.

**Deviations (documented):**
- Group **detail** uses `SingleColumnPage` (matches the admin canonical
  port; a group has no sidebar content) — the **customer** detail is
  `TwoColumnPage` as specified.
- Group's customer-row action is **Remove only** (no Edit → customer is
  read-only in vendor).
- Address mutation hooks in `hooks/api/customers.tsx` left in place
  (unused, type-check OK) as optional follow-up cleanup.

## Notes

- This audit only documents state; no code changed.
- Admin already ships the full equivalent under
  `packages/admin/src/pages/customer-groups/` (list / detail / create /
  edit / add-customers / metadata) and
  `packages/admin/src/pages/customers/` — these are the canonical
  references for porting to vendor, scoped to `sdk.vendor.*` and
  seller-filtered data per `docs/UI-ARCHITECTURE.md`.
- The Figma "Create Address" symbol (`40014841:1617578`) renders the
  Create Customer Group modal — design-system layer mislabel, not a
  separate address-creation screen.
</content>
</invoke>
