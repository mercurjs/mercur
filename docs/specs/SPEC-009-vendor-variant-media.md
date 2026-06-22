---
status: not_started
canonical: false
priority: 2
area: vendor/products
created: 2026-06-11
last_updated: 2026-06-11
---

# SPEC-009 Vendor Variant Media (per-variant images)

Split out of **MER-127** (*PRODUCTS — Vendor Panel — Product Creation —
Step 4 — Variant*). That ticket bundled three items; the two contained
bug fixes (variant-grid search, and the "Option value X does not exist"
create error) shipped in the MER-127 PR. This spec owns the remaining,
larger item: **selecting images per variant**, which needs new backend
persistence and is therefore tracked as its own feature.

## Decision (owner: framework author)

- **Persistence model:** native Medusa variant images. Medusa 2.11.2+
  ships a real `ProductVariantProductImage` link and a `variant.images`
  relation; we wire those through rather than storing URLs in
  `variant.metadata` (a stopgap that is not a first-class, queryable
  relation).
- **Media source / UX:** **upload per variant** — each variant gets its
  own upload control (mirrors the product-level Media section, which is
  upload-based), not a "pick from product media" selector.

These two choices were confirmed with the framework author on
2026-06-11.

## Why this is not just a UI field

The current vendor create flow has no path to persist variant images:

- Frontend create schema `ProductCreateVariantSchema`
  (`packages/vendor/src/pages/products/create/constants.ts`) has no
  `media`/`images` field.
- `normalizeVariants` / `normalizeProductFormValues`
  (`packages/vendor/src/pages/products/create/utils.ts`) send only
  `title` / `options` / `sku` / `variant_rank` per variant.
- Vendor create validator `CreateProductVariant`
  (`packages/core/src/api/vendor/products/validators.ts`) accepts no
  variant `images`. `UpdateProductVariant` accepts a single
  `thumbnail` only.
- Medusa's own `CreateProductVariantDTO`
  (`@medusajs/types` → `product/common.d.ts`) does **not** accept
  `images` or `thumbnail` on create — the native variant-image relation
  is only reachable via a post-create link step.

So a real implementation spans validator → workflow → UI.

## Source design

Figma — *Mercur 2.0 — Vendor Panel B2C*
(`figma.com/design/sYJoh84Owr5tomRjpxG0no`):

- Variant grid with a **Media** column, per-variant thumbnails + an
  add ("+") affordance — flow heading node `40009010:146111`; the
  end-state is also visible in node `40009019:257392`.

Confluence — *Products in Mercur Admin Panel*
(`rigbysoftwarehouse.atlassian.net/wiki/spaces/ME/pages/512786471`):
the variant **details page manages Details / Media / Price / Inventory
items** — confirming variant Media is a documented, first-class
per-variant section (not a Figma-only detail), so the same backend
serves both the create wizard and the variant detail/edit surface.

## User-Visible Behavior

- In the product-create **Variants** step, each variant row exposes a
  Media affordance. The vendor can upload one or more images for that
  specific variant.
- On submit, the uploaded files are stored and associated with the
  correct variant via the native variant-image relation.
- Opening the created product / variant shows the variant's images on
  the variant detail page (and they round-trip through edit).

## Scope

In scope:
- Backend: accept variant `images` on `POST /vendor/products` (and the
  update path), and a workflow step that creates `ProductImage` rows
  and links them to the right variant via `ProductVariantProductImage`.
- Frontend (vendor create): variant `media` schema field, upload UI in
  the Variants step, and normalization that uploads files and sends the
  resulting urls per variant.
- Round-trip on the vendor variant detail/edit surface (shares the
  backend).

Out of scope (here):
- The MER-127 variant-grid **search** and the **option-value create
  error** — both already shipped in the MER-127 PR.
- Admin-side variant media (mirror later if needed).

## Open questions

- Single thumbnail vs. multiple images per variant. The Figma shows one
  thumbnail per row; the variant detail "Media" section implies a full
  gallery. Default to **multiple** (native relation supports it) and
  surface the first as the variant thumbnail.
- Whether per-variant uploads should be de-duplicated against
  product-level media when the same file is used in both.
- Coordinate with MER-136 / MER-137 (vendor product-details "create
  variant" / "variant details"), which already have worktrees and touch
  the same variant surface.

## Verification

1. `POST /vendor/products` with a variant carrying `images: [{ url }]`
   persists the image and links it to that variant (integration test in
   `integration-tests/http/product/vendor/`).
2. `GET /vendor/products/:id` (and the variant detail) returns the
   variant with its `images` populated.
3. Vendor create UI: upload an image on a variant row, publish, reopen
   the product — the image shows on the right variant only.
4. `bun run lint` and `bun run build` pass.

## Evidence

_Not started._

## Notes

The MER-127 PR delivered the two contained fixes and referenced this
spec for the deferred media work.
