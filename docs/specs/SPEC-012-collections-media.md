---
status: passing
canonical: false
priority: 2
area: admin/collections, vendor/collections
created: 2026-06-17
last_updated: 2026-06-17
---

# SPEC-012 Collections — Media & Icon (Admin + Vendor)

Implements [MER-155](https://linear.app/rigbyjs/issue/MER-155/collections-admin-panel)
(admin panel) and [MER-153](https://linear.app/rigbyjs/issue/MER-153/collections-vendor-panel)
(vendor panel). "BASIC version, no Requests" per both issues.

This is the follow-up promised by [[SPEC-011-categories-admin-panel]]: enrich
core Medusa **product collections** with the same media gallery
(thumbnail/banner designations) + single icon that categories already have, by
**reusing the existing `media` module** via a second module link. No new module
is introduced — the `media` module and its `Image` model were deliberately
built entity-agnostic in SPEC-011.

## Phase 1 — Admin (MER-155)

Operators can attach media + an icon to a collection and edit them, mirroring
the category surface.

### Backend (`@mercurjs/core`)

- **Link** `links/media-product-collection-link.ts` — `productCollection →
  image` (`isList`), analogous to the category link. Reuses the SPEC-011
  `Image` model unchanged.
- **Workflows** `workflows/media/workflows/`:
  - `set-collection-images.ts` — `setCollectionImagesWorkflow`, applies the
    single-thumbnail/banner/icon invariants and replaces the gallery/icon,
    composed from the existing generic `createImagesStep` / `deleteImagesStep`
    + core `useQueryGraphStep` / `createRemoteLinkStep` / `dismissRemoteLinkStep`.
  - `create-/update-/delete-product-collection-with-images.ts` — thin wrappers
    around Medusa's `createCollectionsWorkflow` / `updateCollectionsWorkflow` /
    `deleteCollectionsWorkflow` + `setCollectionImagesWorkflow`.
- **API** `api/admin/collections/` (new — Medusa core's `/admin/collections`
  routes are overridden): `validators.ts` (adds `media[]` + `icon`),
  `query-config.ts` (adds linked `images.*`), `route.ts` (GET list + POST
  create), `[id]/route.ts` (GET + POST + DELETE). Routes call one wrapper
  workflow each.
- **Middleware override** — Medusa's strict core collection body validator
  rejects unknown `media`/`icon`. `utils/disable-medusa-middlewares.ts` gained
  `dist/api/admin/collections/middlewares.js` in its `OVERRIDES` list (the same
  mechanism categories use), and `api/admin/collections/middlewares.ts`
  re-spreads the core sub-routes it does **not** override (`:id/products`
  product linking, `/*` sub-resource query) via `ORIGINAL_MIDDLEWARES`, mirroring
  the `shipping-profiles` partial-override pattern.

### Admin UI (`@mercurjs/admin`)

A scoped copy of the category media/icon UI under `pages/collections/`:

- `common/components/collection-image-fields/` — `CollectionMediaInput`,
  `CollectionIconInput`, `CollectionIconTip`, `uploadCollectionImages`, types +
  `getCollectionGallery` / `getCollectionIcon`.
- Create form (`create-collection-form.tsx`) — media gallery + icon fields
  appended; submit uploads files then sends `media`/`icon`.
- Detail page — `CollectionMediaSection` + `CollectionIconSection` inserted
  (General → Media → Icon → Products).
- Edit flows — `collection-media/` full-screen `RouteFocusModal` gallery editor
  (route `media`, `?view=edit`) and `collection-icon-edit/` `RouteDrawer`
  (route `icon/edit`); both registered in `get-route-map.tsx`.
- i18n — `collections.media.*` + `collections.icon.*` added to `en.json` and
  `$schema.json`.

## Phase 2 — Vendor (MER-153)

Sellers **view** (read-only) the media gallery and icon the operator set, per
the issue ("display these images and icons in vendor panel"). Mirrors the
read-only vendor category media/icon sections.

- Backend: `api/vendor/collections/query-config.ts` now requests linked
  `images.*` so vendor reads return them.
- Vendor UI (`@mercurjs/vendor`): `pages/collections/common/components/collection-image-fields/types.ts`
  (getters), and read-only `collection-media-section` / `collection-icon-section`
  under `[id]/_components/`, wired into `collection-detail-page.tsx`
  (General → Media → Icon → Products).
- i18n — read-only `collections.media` / `collections.icon` keys added to vendor
  `en.json` + `$schema.json`.

## User-Visible Behavior

- Admin: create a collection with multiple images, designate thumbnail and/or
  banner, upload a single icon; detail page shows Media + Icon sections with
  badges, each editable from its own `…` menu (full-screen gallery editor /
  icon drawer). The same image may be both thumbnail and banner.
- Vendor: the collection detail page shows read-only Media + Icon sections
  populated from the operator's media (empty-state copy when none).
- No Requests/approval UI anywhere (BASIC scope).
- Existing collection CRUD + product linking unchanged.

## Verification

- `bun run build` → 9/9 packages (incl. core codegen + admin/vendor DTS).
- `bun run lint` → no new errors in `collections`/`media` files (pre-existing
  failures in `commissions` / `payouts` only).
- HTTP integration: `bun run test:integration:http -- collections-media`.

## Evidence

Implemented 2026-06-17.

- **HTTP integration**: `bun run test:integration:http -- collections-media` →
  **5 passed**
  ([collections-media.spec.ts](../../integration-tests/http/collections/admin/collections-media.spec.ts)):
  create with gallery+thumbnail+banner+icon; GET returns linked images; update
  moves thumbnail/banner + replaces icon (invariants hold ≤1 each); `icon: null`
  clears icon leaving gallery; delete removes linked images (no orphans).
- **Regression**: `product-categories-media` → **5 passed** (categories
  unaffected by the new `collections` entry in `disable-medusa-middlewares`).
- **Build**: `bun run build` → 9/9. The admin create/edit forms type-check
  against the codegen-regenerated `sdk.admin.collections` input (media/icon).
- **Pre-existing, not a regression**: `collections/vendor/collections.spec.ts`
  has 2 failing tests (`Cannot resolve alias path "" that matches entity
  Product` from `vendor/products/route.ts:98`, hit during product creation in
  the test setup). Confirmed identical (2 failed / 7 passed) on clean `canary`
  with all SPEC-012 changes stashed — unrelated to this work.

## Notes / decisions

- **Reused the SPEC-011 `media` module unchanged** — only a second link +
  collection-scoped workflows/UI were added, exactly as SPEC-011's *Deferred*
  section anticipated.
- **Why the middleware override was required** — Medusa's `zodValidator` forces
  `.strict()`, so core's collection create/update validator 400s on unknown
  `media`/`icon`. Plugin middleware is *merged* with core's (both run), so the
  body fields had to be allowed by emptying core's collection middleware
  (`disableMedusaMiddlewares`) and re-providing Mercur's — the established
  pattern already used for products/categories/orders/shipping.
- **Vendor is display-only** — no create/edit of media on the seller surface
  (operator-owned), matching vendor categories.
