---
status: live
canonical: true
area: products
created: 2026-06-25
last_updated: 2026-06-25
---

# SPEC-015 Master Products Model

Products in Mercur are **master products**: a single shared catalog of product
records that the whole marketplace draws from. A product is **not** owned by the
seller who created it. Any seller may *request* changes to any product, and
selling rights are governed by a separate restriction list — not by who created
the record.

This spec is the canonical owner of:

- what a master product is,
- what the `product_seller` link means (and does **not** mean),
- how a product is attributed to the seller who created it, and why,
- who may request changes to a product,
- how the vendor product list is scoped.

It supersedes any earlier reading of `product_seller` as an "ownership" link.

## Core concepts

### Master product
A `product` row is a shared catalog entry. There is no `owner_id` / `created_by`
column on the product itself (Medusa's product model has none, and Mercur does
not add one). Ownership is **not** a property of the product.

### `product_seller` link = selling-eligibility restriction
`packages/core/src/links/product-seller-link.ts` (table `product_seller`,
many-to-many) is a **restriction allowlist**: it records *which sellers are
allowed to sell — and see — a given product*. It is the Mercur analog of
Medusa's `product_sales_channel` link (a product appears in a channel only if
linked).

- It does **not** mean "this seller created/owns this product."
- **Restricted vs. unrestricted:** a product with **at least one**
  `product_seller` row is *restricted* — visible/sellable **only** to the
  assigned sellers. A product with **no** `product_seller` rows is
  *unrestricted* — visible to every seller (subject to status).
- It is read by the store and admin surfaces to scope products to sellers
  (`api/store/products/middlewares.ts` via `maybeApplyLinkFilter`,
  `api/admin/sellers/[id]/products`), the vendor list/variant filters (to hide
  products restricted to other sellers), and the vendor sales-channel /
  category ownership helpers (`ensureSellerOwnsProduct(s)`).

### Creator attribution = `product_change.created_by` + `PRODUCT_ADD`
Who created a product is recorded the Medusa way — as `created_by` on the
audit/change entity, sourced from the request actor — **not** on the product or
the `product_seller` link.

- On creation, `createProductsWorkflow` records a `ProductChange` with
  `created_by = input.created_by` and a single
  `ProductChangeAction` of type **`PRODUCT_ADD`**
  (`packages/types/src/product/common.ts`).
- `PRODUCT_ADD` is the unambiguous creation marker (symmetric with
  `PRODUCT_DELETE`). It is distinct from `STATUS_CHANGE`, which also fires on
  admin approve/reject, and from the per-edit `created_by` that any change
  writes.
- The **only** purpose of this attribution is list scoping: so a seller does
  not see another seller's *proposed* (not-yet-published) products. It is
  **not** used to gate edits, requests, or selling rights.

`getSellerOwnedProductIds(scope, sellerId)`
(`api/vendor/products/helpers.ts`) returns the product ids a seller created by
querying `product_change_action` where
`action = PRODUCT_ADD AND product_change.created_by = sellerId`.

## Rules

1. **Products are master/shared.** Creating a product adds a candidate to the
   shared catalog; it does not create an owner.

2. **Any seller may request a change to any product.** Attribute batches,
   product updates, and variant add/update/remove all route through the
   product-edit *request* pipeline (`ProductChange`). These endpoints **must
   not** gate on ownership — every seller can submit a request on any master
   product. (e.g. `POST /vendor/products/:id/attributes/batch` has no
   ownership check.)

3. **`product_seller` controls selling eligibility and restricted-product
   visibility, not the right to request changes.** A restricted product (one
   with `product_seller` rows) is hidden from sellers it is not assigned to.

4. **Creator attribution is for list scoping only.** A seller sees their own
   *proposed* products via `product_change.created_by` + `PRODUCT_ADD`; this
   never restricts edits, requests, or sales.

5. **Vendor product list scope** (`GET /vendor/products`,
   `GET /vendor/product-variants`). A seller sees a product when it is **either**:
   - a product **this seller created** (`getSellerOwnedProductIds`), **or**
   - **published** **and not restricted away from this seller** — i.e. it has no
     `product_seller` rows, or this seller is among the assigned ones.

   Concretely the middleware applies:
   ```
   $or: [
     { id: <own-created ids> },
     { status: PUBLISHED, id: { $nin: <ids restricted to other sellers> } },
   ]
   ```
   where `<ids restricted to other sellers>` =
   `getProductIdsRestrictedFromSeller(seller)` (products that have
   `product_seller` rows but none for this seller). Effect: each seller sees
   their own proposed products, plus the published catalog **minus** products
   restricted to other sellers. Nobody sees another seller's proposed products,
   and nobody sees a published product restricted away from them.

6. **Creation does not write a `product_seller` row.** Vendor/admin product
   creation passes `created_by` (the actor) but does **not** auto-link the
   creating seller as eligible. Selling eligibility is managed separately.

## Status lifecycle

`DRAFT → PROPOSED → PUBLISHED` (or `REJECTED`).
- Vendor-created products default to `PROPOSED`
  (`api/vendor/products/route.ts`).
- A `PROPOSED` product is visible only to its creator (rule 5) until an admin
  publishes it, at which point it becomes part of the published master catalog
  visible to all sellers.

## Endpoint contract summary

| Surface | Endpoint | Scoping / rule |
| --- | --- | --- |
| Vendor | `GET /vendor/products`, `GET /vendor/product-variants` | own-created OR (published AND not restricted to other sellers) (rule 5) |
| Vendor | `POST /vendor/products` | creates master product, `status=PROPOSED`, `created_by=seller`; no `product_seller` row |
| Vendor | `POST /vendor/products/:id` (update), `/variants*`, `/attributes/batch` | request flow, **no ownership gate** (rule 2) |
| Vendor | sales-channel / category `:id/products` | `ensureSellerOwnsProduct(s)` against `product_seller` (eligibility) |
| Admin | `POST /admin/products` | `created_by = req.auth_context.actor_id`; per-product `seller_ids` set the eligibility allowlist |
| Store | `GET /store/products[/:id]` | filtered by `product_seller.seller_id` of visible sellers |

## Workflow input contract

`createProductsWorkflow` (`workflows/product/workflows/create-products.ts`):

```ts
type CreateProductsWorkflowInput = {
  products: (CreateProductDTO & { seller_ids?: string[] })[] // per-product eligibility allowlist
  created_by: string                                          // the acting seller / admin actor
} & AdditionalData
```

- `seller_ids` (per product) → `product_seller` eligibility rows.
- `created_by` → `ProductChange.created_by` + `PRODUCT_ADD` action (creator
  attribution).

## Verification

1. Seller A creates a product via `POST /vendor/products` → it is `PROPOSED` and
   appears in A's `GET /vendor/products`.
2. Seller B's `GET /vendor/products` does **not** contain A's proposed product,
   but **does** contain unrestricted published master products.
3. A published product restricted (a `product_seller` row) to seller A appears
   in A's list but **not** in B's.
4. Seller B can `POST /vendor/products/:id/attributes/batch` against a master
   product B did not create and receives `202` (request accepted).
5. `GET /vendor/product-variants` is scoped identically to the product list.

## Evidence

- `integration-tests/http/product/vendor/product.spec.ts`
  - `Vendor - product list scoping › scopes the vendor list to the seller's own
    proposed products plus published` — covers verification 1 & 2.
  - `Vendor - product list scoping › hides a restricted published product from
    sellers it is not assigned to` — covers verification 3.
  - `Vendor - product attributes batch › allows any seller to request changes on
    a master product it did not create` (expects `202`) — covers verification 4.
- Run: `bun run test:integration:http -- product/vendor/product` → 7/7 passing
  (2026-06-25).

## Notes / open items

- **Store visibility of vendor-created products.** Because creation no longer
  writes a `product_seller` row, a vendor-created product — even once published
  — will not surface in `GET /store/products` (which filters by
  `product_seller.seller_id`). Open decision: write a `product_seller` row at
  publish/approval time, or move store scoping onto the offer model. Tracked
  separately; `integration-tests/http/product/store/product.spec.ts` currently
  reflects the old behavior.
- `ensureSellerOwnsProduct` / `ensureSellerOwnsProducts` still validate against
  `product_seller` (eligibility) for the sales-channel and category assignment
  routes. They are intentionally **not** wired to the creator-attribution
  signal.
