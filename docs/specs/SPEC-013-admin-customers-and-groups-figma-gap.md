---
status: in_progress
canonical: false
priority: 2
area: "admin"
created: 2026-06-16
last_updated: 2026-06-17
---

# SPEC-013 Admin Customers & Customer Groups — Figma Gap (MER-149, MER-150)

Close the gap between the current Admin panel Customers / Customer Groups
surfaces and the B2C admin Figma designs.

- MER-149 Customers — Admin Panel: [Linear](https://linear.app/rigbyjs/issue/MER-149/customers-admin-panel) · [Figma](https://www.figma.com/design/parLCIou6t4gBbCNS2Bsc4/-Mercur-2.0----Admin-Panel-B2C?node-id=40014291-1266199)
- MER-150 Customer Groups — Admin Panel: [Linear](https://linear.app/rigbyjs/issue/MER-150/customer-groups-admin-panel) · [Figma](https://www.figma.com/design/parLCIou6t4gBbCNS2Bsc4/-Mercur-2.0----Admin-Panel-B2C?node-id=40014291-1311737)

This is the **admin** counterpart to `SPEC-011-vendor-customers-and-groups-figma-gap.md`
(vendor side, MER-147/148, already shipped).

## Context — what already exists

The admin Customers and Customer Groups pages are largely implemented and the
admin UI talks to **Medusa's built-in `/admin/customers` and
`/admin/customer-groups` routes** (there are no Mercur-custom admin routes for
these in `packages/core/src/api/admin/`).

Already present and matching the design (do **not** re-build these):

- Customers list (`packages/admin/src/pages/customers/customer-list/`) — Email,
  Name, Account status, First seen, row actions.
- Customer detail (`customer-detail/`) — general / address / group / order
  sections, create/edit/delete, address create/edit/delete, add-to-group.
- **Transfer Ownership** of an order is already implemented and matches the
  Figma "Transfer ownership" modal: action menu in
  `customers/customer-detail/components/customer-order-section/customer-order-section.tsx`
  (`transferOwnership.label`, route `${order.id}/transfer`) →
  `pages/orders/order-request-transfer/` (FocusModal with disabled "Current
  owner" + "Select customer" → `customer_id`). No work required here.
- Customer Groups list (`customer-groups/customer-group-list/`) — Name,
  Customers count, Created/Updated, row actions.
- Customer Group detail (`customer-group-detail/`) — general section, customers
  sub-table with add/remove, create/edit/delete, metadata.
- API hooks: `hooks/api/customers.tsx`, `hooks/api/customer-groups.tsx`.
- Backend link already models group ownership:
  `packages/core/src/links/seller-customer-group-link.ts`
  (currently `seller` ⇄ `customerGroup`, **list ⇄ list / many-to-many**) and
  `packages/core/src/links/seller-customer-link.ts`.

## Gaps to close

### A0. Data model — customer group has exactly one owning seller (backend)

Today `seller-customer-group-link.ts` is defined list ⇄ list, i.e. a customer
group can be linked to *many* sellers. The product model is **one owner per
group** (the Figma "Owner: ACME" is a single value). Change the link to a
one-to-many (seller → many groups, group → one seller) and flip the direction so
`customer_group` is the primary/from side:

```ts
// packages/core/src/links/seller-customer-group-link.ts
import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import SellerModule from "../modules/seller"

export default defineLink(
  { linkable: CustomerModule.linkable.customerGroup, isList: true },
  { linkable: SellerModule.linkable.seller }
)
```

Semantics: `isList` on `customerGroup` means the seller side has many groups;
the seller side has no `isList`, so each group resolves to a **single** `seller`.
This makes the owner directly queryable as a singular field
(`customer_group.seller`) — no pivot join needed downstream.

**Consequences this change forces (all must move together):**

1. **Link table rename.** Medusa derives the link entity/table name from the
   linkable order. Flipping the order renames the join from
   `seller_customer_group` → `customer_group_seller` (verify the exact generated
   name after the change). Every `query.graph({ entity: "seller_customer_group" })`
   must be updated. Current call sites:
   - `packages/core/src/api/vendor/customer-groups/helpers.ts` (`validateSellerCustomerGroup`)
   - `packages/core/src/api/vendor/customer-groups/middlewares.ts`
     (`maybeApplyLinkFilter` `entryPoint`)
   - `packages/core/src/api/vendor/customers/[id]/route.ts`
2. **Workflow link create/dismiss.** `steps/link-seller-customer-group.ts` builds
   the link with `remoteLink.create` keyed by `[SELLER]` / `[CUSTOMER]` module
   objects — this keys by module, not table name, so it should keep working, but
   re-verify create + the compensation `dismiss` after the arity change. Adding a
   group to a second seller must now be rejected/replace, not append (enforce
   single owner).
3. **DB migration.** Run `medusa db:migrate` (link tables sync on migrate). The
   arity change adds a uniqueness expectation on `customer_group_id`; **existing
   rows where one group maps to multiple sellers will break the migration** —
   the migration/cleanup must collapse duplicates to a single owner first.
   Capture the generated migration under the core module migrations.
4. **Vendor seller-scoping must still hold.** The vendor list/detail still only
   shows groups owned by the requesting seller; re-verify
   `applySellerCustomerGroupLinkFilter` against the renamed link.

> Decision note: argument order is the only difference between this and the
> equivalent `defineLink({ seller }, { customerGroup, isList: true })`, which
> would keep the `seller_customer_group` table name and avoid the rename churn in
> step 1. Per the issue owner, use the `customerGroup`-first direction above so
> the group is the primary entity and `seller` reads as the owner; accept the
> rename as part of this gap.

### A. Customer Group "Owner" (seller) — MER-150 — primary gap

The Figma customer-group detail shows an **Owner** row in the general section
(e.g. `Owner: ACME`) — the seller that owns the group. The PR referenced on
both Linear issues ("feat(admin): customer group owner column",
[#1013](https://github.com/mercurjs/mercur/pull/1013)) is **not present on this
branch**.

Current state:
- `customer-group-detail/components/customer-group-general-section/` renders the
  group name + action menu only — **no Owner row** (`grep -ri owner` over
  `packages/admin/src/pages/customer-groups/` returns nothing).
- `customer-group-list-table.tsx` columns are Name / Customers / Created /
  Updated / actions — **no Owner column**.
- The admin API response for `/admin/customer-groups` does not expose the
  linked `seller`, so the value is not even fetchable yet.

Required:

1. **Backend** — expose the owning seller on the admin customer-group API.
   After A0 the link is one-to-one from the group's side, so add an admin
   route-extension (query-config / middleware under
   `packages/core/src/api/admin/customer-groups/`) whose default fields include
   the **singular** `seller.id` and `seller.name` (mirroring the existing
   `admin/offers` / `admin/payouts` query-configs that expose `seller.*`). The
   list and detail endpoints then return `customer_group.seller` directly — no
   pivot query or N+1 merge needed. There are currently no admin customer-group
   routes in core (admin uses Medusa's built-in route), so this route-extension
   is new.
2. **Admin hooks** — extend `hooks/api/customer-groups.tsx` so
   `useCustomerGroup` / `useCustomerGroups` request the seller field. Keep the
   `queryKeysFactory` shape and ensure mutations still invalidate
   `lists()` / `details()` / `detail(id)` (UI-ARCHITECTURE §Data fetching).
3. **Admin detail UI** — add an **Owner** row to `customer-group-general-section`
   using `SectionRow` from `@mercurjs/dashboard-shared` (label/value
   `grid grid-cols-2 gap-4 px-6 py-4`), label `t("customerGroups.fields.owner")`,
   value = seller name or `-` (platform-owned). Add `data-testid`
   `customer-group-general-section-owner`. Do **not** hand-roll the row layout.
4. **Admin list UI** — add an **Owner** column to `customer-group-list-table`
   via `columnHelper.display`/`accessor` (mirror the existing `customers` count
   column), header `t("customerGroups.fields.owner")`, with a `data-testid` cell.
5. **i18n** — add `customerGroups.fields.owner` to
   `packages/admin/src/i18n/translations/en.json` first, then other locales;
   value rendered through `useTranslation()` (no hardcoded strings). The
   `i18n/translations/__tests__` schema suite must stay green.

### B. Customer detail Orders section — order-group / multi-store view — MER-149

The Figma customer detail Orders section renders **order groups**, not a flat
order list:

- A `Group ID` column (e.g. `#G98`) with expandable child-order rows
  (`#100`, `#99`).
- A `Store` column showing the seller per child order, and `2 stores` on the
  group row (multi-vendor orders).
- Per-row `Payment` and `Fulfillment` status badges, `Date`, `Order Total`.

Current state: `customer-order-section.tsx` uses Medusa's flat `useOrders`
table (`useOrderTableColumns`) keyed by `display_id` — **no Group ID, no Store
column, no order-group grouping**.

Required:

1. **Backend** — ensure the admin orders query (filtered by `customer_id`) can
   return order-group association and the seller/store per order. Mercur already
   has `order-group` module + `order-seller-link.ts`; confirm the admin orders
   route exposes `order_group` (Group ID) and `seller`/store fields, and extend
   the query-config if not.
2. **Admin UI** — render the Orders section grouped by order group with the
   Group ID and Store columns and expandable child rows, matching the design.
   (Scope decision needed — see Notes: full grouped tree vs. add Group ID +
   Store columns to the existing flat table as a first step.) Stay on the
   existing `customer-order-section.tsx` structure and the `DataTable` +
   `useDataTable` + `createColumnHelper` pattern (UI-ARCHITECTURE §Tables);
   add the new `group_id` / `store` columns alongside the current ones rather
   than introducing a parallel table. Keep the existing `ActionMenu` row action
   (Transfer Ownership) and its `data-testid`s. Render payment/fulfillment with
   `StatusBadge` via the shared status cells, not bespoke badges. New column
   headers and store/empty copy go through `t(...)` keys in `en.json` first.

### C. Smaller alignment items

- Confirm the customer detail **Customer Groups** sub-section and **Addresses**
  sidebar empty states / search match the Figma (filter + search controls are in
  the design). These appear implemented — verify, don't rebuild.
- Confirm Account status badges (`Registered` / `Guest`) and the create-customer
  FocusModal field set match the design's Edit Customer / Create Customer modals.

## UI-Architecture conformance (mandatory)

Every change in this spec must follow `docs/UI-ARCHITECTURE.md`. This is admin
work, so all UI lands in `packages/admin/src/` and all HTTP goes through
`sdk.admin.*` (never raw `fetch`). Specifically:

- **Layout / sections** — detail sections stay in
  `<Container className="divide-y p-0">` with the
  `flex items-center justify-between px-6 py-4` header; label/value rows use
  `SectionRow`. No custom section shells or CSS.
- **Tables** — `DataTable` + `useDataTable`, columns via `createColumnHelper`,
  row/section menus only via `ActionMenu`, empty states via `NoRecords` /
  `NoResults`. Keep the prefix-based `useXTableQuery` wiring already in place.
- **Data layer** — extend the existing `hooks/api/customers.tsx` /
  `hooks/api/customer-groups.tsx`; keep `queryKeysFactory` keys and the
  `lists()/details()/detail(id)` invalidation contract; throw on `isError`.
- **Design system** — `@medusajs/ui` only, `@medusajs/icons` only, Medusa color
  / typography / spacing tokens only (no hex, no other UI/icon libs). Status
  uses `StatusBadge` + the `pages/<domain>/common/utils.ts` helpers.
- **i18n** — all new strings via `t(...)`, keys added to `admin/.../en.json`
  first; no hardcoded copy; schema tests stay green.
- **Test ids** — kebab-case `data-testid` on every new row, cell, header, and
  interactive element, scoped to the section.
- **Reuse over rebuild** — Transfer Ownership, address CRUD, group add/remove,
  and the create/edit modals already conform; only extend them.

## User-Visible Behavior

- A marketplace operator opening a **Customer Group** sees an **Owner** value
  (the seller that owns the group, or `-` for platform groups) in the general
  section, and an **Owner** column in the customer-groups list.
- A marketplace operator opening a **Customer** sees that customer's orders
  grouped by order group, with the Group ID, the store(s) involved, and payment
  / fulfillment status per order — consistent with the multi-vendor model.
- Transfer Ownership continues to work from each order's row action (already
  shipping).

## Verification

1. `bun run build` passes.
2. Data model (A0): `seller-customer-group-link.ts` is one seller per group;
   `medusa db:migrate` runs cleanly (after collapsing any duplicate
   group→seller rows); the renamed link entity resolves; vendor customer-group
   list/detail still scope to the requesting seller (regression). Confirm the
   workflow rejects/replaces a second owner instead of appending.
4. Backend: `GET /admin/customer-groups?fields=+seller.name` returns the single
   linked `seller`; `GET /admin/customer-groups/:id` includes the owner. Add/adjust
   an integration test under `integration-tests/http/customer-group/admin/`.
5. Admin UI (apps/admin-test :7000): customer-group detail shows the **Owner**
   row; list shows the **Owner** column.
6. Admin UI: customer detail Orders section shows Group ID + Store and groups
   multi-vendor orders as in Figma.
7. Transfer Ownership modal still opens from an order row action and transfers
   to a selected customer (regression check).
8. New/updated i18n keys validated by the `i18n/translations/__tests__` suite.
9. UI-Architecture conformance review passes (see the conformance section): no
   raw `fetch`, no hand-rolled section/row layout, `SectionRow` / `DataTable` /
   `ActionMenu` / `StatusBadge` used as specified, Medusa-only UI + icons +
   tokens, `data-testid`s present. Run the `admin-ui-review` skill over the diff.

## Evidence

### 2026-06-17 — A0 (data model) + A (Owner UI) implemented & build-verified

**A0 — customer group → single owning seller (done):**
- `packages/core/src/links/seller-customer-group-link.ts` flipped to
  `defineLink({ customerGroup, isList: true }, { seller })`. Confirmed against
  Medusa's `define-link.js`: `entryPoint = aliasA + "_" + aliasB` →
  link entity renamed `seller_customer_group` → **`customer_group_seller`**, and
  the reverse field on the group is the singular **`seller`** (seller side has no
  `isList`), with `seller.customer_groups` a list.
- Updated all three pivot references to the new entity name:
  `api/vendor/customer-groups/middlewares.ts` (`maybeApplyLinkFilter` entryPoint),
  `api/vendor/customer-groups/helpers.ts` (`validateSellerCustomerGroup`),
  `api/vendor/customers/[id]/route.ts`.
- **Runtime bug caught by tests:** flipping the `defineLink` order changed the
  link's registration direction, so `remoteLink.create` (which is order-sensitive)
  500'd with "Module to type seller and customer … link is passed in the correct
  order". Fixed `workflows/customer-group/steps/link-seller-customer-group.ts` to
  key the create/dismiss objects `[CUSTOMER]` then `[SELLER]`, matching the new
  link order. Also updated the integration test's direct link query
  (`entity: "seller_customer_group"` → `"customer_group_seller"`).
- `bunx turbo run build --filter=@mercurjs/core` → success (codegen +
  `tsc --declaration`).
- **Runtime verified:** `bun run test:integration:http -- customer-group/vendor`
  → 14/14 pass; `customer/vendor` → 8/8 pass. Confirms create (link write),
  seller-scoped list/detail, and the customer `[id]` group filtering all work
  against the renamed one-owner link.

**A — Customer Group Owner UI (done & runtime-verified):**
- Backend route override **not needed** — and this is now **runtime-proven**, not
  assumed: a new suite `integration-tests/http/customer-group/admin/customer-group.spec.ts`
  (3 tests, all passing) asserts `GET /admin/customer-groups/:id` and
  `GET /admin/customer-groups` with `fields=+seller.id,+seller.name` return the
  owning `seller` (`{id, name: "ACME"}`) for a vendor-created group, and no
  `seller` for a platform-created group. Medusa's built-in route resolves the
  link field once A0's link exists.
- Detail: `customer-group-detail/constants.ts` now requests
  `+customers.id,+seller.id,+seller.name`; `customer-group-general-section.tsx`
  renders an **Owner** row (`t("fields.owner")`, value `seller?.name` or `-`,
  `data-testid="customer-group-general-section-owner-row"`), matching the
  existing Customers-row markup. Prop type extended with optional `seller`.
- List: `customer-group-list-table.tsx` requests `seller.id,seller.name` and adds
  an **Owner** `columnHelper.display` column (`t("fields.owner")`, value
  `seller?.name` or `-`, per-row `data-testid`). Row type extended with optional
  `seller`.
- i18n: `fields.owner = "Owner"` added to `en.json` and mirrored in
  `$schema.json` (property + required).
- `bunx turbo run build --filter=@mercurjs/admin` → success (ESM + DTS). The
  local `seller` type augmentations compile.

**Verification still owed:**
- **Production data migration** for the link-table rename: the new link is a
  different table (entity `customer_group_seller`, service
  `customer_customer_group_seller_seller`) from the old `seller_customer_group`,
  so on an existing DB `medusa db:migrate` creates a fresh empty table — existing
  owner rows must be copied over (and collapsed to a single owner per group)
  before the old table is dropped. Fresh DBs (incl. the test runner) are
  unaffected. Not runnable here against prod data.
- i18n suite `validate-translations.spec.ts` is **pre-existing red** on this
  branch (unrelated `sellers.fields.*` keys missing from `en.json`); confirmed by
  re-running with the `owner` edits stashed — the failure is identical. The
  `owner` key itself adds no missing/extra-key violation.

**B — customer-detail Orders: Group ID + Store columns (frontend increment done):**
- Chose the spec's low-risk first increment (flat table + two columns), not the
  full expandable order-group tree (still pending design/PM).
- `customer-order-section.tsx` now requests
  `order_group.id,order_group.display_id,seller.id,seller.name` and adds a
  **Group ID** column (`t("orders.fields.groupId")`, renders `#G{display_id}`)
  and a **Store** column (`t("fields.store")`, renders `seller?.name`), each with
  per-row `data-testid`. Row type locally extended with optional
  `order_group` / `seller` (display columns cast `row.original`, so the table
  stays typed `HttpTypes.AdminOrder` and base columns remain compatible).
- Reused existing i18n keys `orders.fields.groupId` ("Group ID") and
  `fields.store` ("Store") — no new keys.
- `bunx turbo run build --filter=@mercurjs/admin` → success.

**B — runtime-gated remainder (NOT done, needs a DB):** `admin/orders/route.ts`
is a typing stub — the admin orders **list** is served by Medusa's built-in
handler with `listTransformQueryConfig`. Whether that list endpoint resolves the
cross-module link fields `order_group` / `seller` (the order detail endpoint
does) must be verified at runtime; if it doesn't, a Mercur orders list
query-config override is required to allow/return those fields. Until verified,
the new columns may render `-`. This is the open item from Gap B step 1.

**Not started:** Gap C (alignment verification — needs the running app).

## Notes

- **Spec numbering**: `docs/specs/` already contains two `SPEC-011-*` and two
  `SPEC-009-*` files. This file uses the next free integer `SPEC-013`
  (`SPEC-012` is taken by `admin-commissions-figma-ui`).
- **Scope call for Gap B**: the cleanest first increment is to add `Group ID`
  and `Store` columns to the existing flat order table (low risk), deferring the
  full expandable order-group tree to a follow-up if the grouped interaction is
  expensive. Decide with the designer/PM before building the full tree.
- The vendor equivalents (seller-scoped) already shipped in
  `SPEC-011-vendor-customers-and-groups-figma-gap.md` (MER-147/148) and in the
  `packages/core/src/api/vendor/customers` + `customer-groups` routes — reuse
  their seller-scoping / link-resolution patterns for the admin side.
- Both Linear issues are children of MER-89 and are currently `In Progress`,
  assigned to Viktor, milestone "Stabilization Q2 2026".
