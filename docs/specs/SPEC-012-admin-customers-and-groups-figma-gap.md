---
status: in_progress
canonical: false
priority: 2
area: admin/customers
created: 2026-06-16
last_updated: 2026-06-16
---

# SPEC-012 Admin Customers & Customer Groups — Figma vs Implementation Gap

Audits the **Customers** and **Customer Groups** surfaces of `@mercurjs/admin`
against the Figma *Mercur 2.0 — Admin Panel B2C*
(`figma.com/design/parLCIou6t4gBbCNS2Bsc4`). Tracks
[MER-149](https://linear.app/rigbyjs/issue/MER-149/customers-admin-panel)
(page `40014291:1266199`) and
[MER-150](https://linear.app/rigbyjs/issue/MER-150/customer-groups-admin-panel)
(page `40014291:1311737`).

Sibling of [SPEC-011](SPEC-011-vendor-customers-and-groups-figma-gap.md). Unlike
vendor, admin already ships the **full stock Medusa admin** Customers + Customer
Groups surface (`packages/admin/src/pages/{customers,customer-groups}`), wired to
Medusa's built-in `/admin/*` routes. Most of the design is therefore already
implemented; this spec captures the **Mercur-specific deltas** the marketplace
operator needs.

## TL;DR — gaps

1. **"Owner" column on Customer Groups** (headline delta). Figma shows an
   **Owner** column on the CG list, an **Owner** row on the CG detail header,
   and an **Owner** column on the customer detail's *Customer Groups* section.
   Owner = the seller that owns the group (e.g. "ACME"), or **"Mercur"** for
   platform-owned groups (no `seller_customer_group` link). Surfaces the
   SPEC-011 link on the operator side. Stock Medusa has no owner concept.
2. **Order-group columns** (Group ID / Store + expandable child orders) in the
   customer Orders section — deferred (overlaps the order specs).
3. Everything else — CRUD for customers, addresses, groups, members — already
   present (stock Medusa admin).

## Implementation (this slice — the Owner column)

### Backend — additive owner-enrichment route (DONE)

`GET /admin/customer-groups/owners?group_ids=...` →
`{ owners: [{ customer_group_id, seller_id, seller_name }] }`, resolving the
owning seller per group via the `seller_customer_group` link. Groups without a
link are absent → UI shows "Mercur". Files:
`packages/core/src/api/admin/customer-groups/{route(owners),validators,middlewares}.ts`,
wired into `api/admin/middlewares.ts`; codegen exposes
`sdk.admin.customerGroups.owners`.

### Frontend — Owner column

- `useCustomerGroupOwners(groupIds)` hook → `Record<groupId, sellerName>`.
- Owner column on the CG list, Owner row on the CG detail general section, Owner
  column on the customer detail group section, fallback "Mercur".
- i18n: `customerGroups.fields.owner`, `customerGroups.fields.platformOwner`.

### Deferred

Order-group columns in the customer Orders section; the Transfer Ownership flow.

## Verification

- `bunx turbo run build` green.
- Owners route returns the correct seller per group; unlinked groups → "Mercur".
- Integration test under `integration-tests/http/customer-group/admin/`.

## Evidence

Backend route + codegen landed (core build green; `sdk.admin.customerGroups.owners`
generated). Frontend Owner column + tests in progress.

## Notes

Admin Customers/Groups CRUD is stock Medusa admin — only the operator-facing
Owner surfacing is Mercur-specific. Builds on the `seller_customer_group` link
from SPEC-011.
