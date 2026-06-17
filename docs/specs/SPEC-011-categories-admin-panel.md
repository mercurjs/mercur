---
status: passing
canonical: false
priority: 2
area: admin/categories
created: 2026-06-16
last_updated: 2026-06-16
---

# SPEC-011 Categories — Admin Panel (BASIC, no Requests)

Implements [MER-156](https://linear.app/rigbyjs/issue/MER-156/categories-admin-panel).

This spec covers the **BASIC** version of the admin Categories surface
(`@mercurjs/admin` → `packages/admin/src/pages/categories`) and the
backend support it needs in `@mercurjs/core`. "BASIC" is the issue's own
scoping word and it means one thing concretely: **no seller approval
Requests** (the request/approval workflow that gates vendor-initiated
category changes is explicitly **out of scope** here — see *Deferred*).

Like SPEC-008/009/010 this is primarily a **gap audit**: most of the
admin Categories surface already exists and conforms to the design. The
audit below records what is already done and isolates the one genuine
gap — **category Media (thumbnail + banner) and a single Icon** — which
needs a new backend module because Medusa's `product_category` has no
media fields.

## Source of truth

- **Product doc (authoritative text):** Confluence — *Categories* (space
  `ME`, page `511868981`).
- **Design:** Figma *Mercur 2.0 — Admin Panel B2C*, node
  `40008309:22055` (file `parLCIou6t4gBbCNS2Bsc4`). The board contains the
  full flow set: Categories (list), Create Category, Category Details,
  Edit Category, Edit Ranking, and **Edit Media** (frames showing real
  thumbnail/banner images and an icon slot).

The doc defines the BASIC surface as:

- **View Categories** — Products → Categories list with `Title`,
  `Handle`, `Status`, `Visibility` columns and search.
- **Create Category** — two-step wizard:
  - *Details*: Title (required), Handle, Description, Status
    (Active/Inactive), Visibility (Public/Private), **category media**
    (image usable as thumbnail or banner), **single icon** upload.
  - *Organize Ranking*: drag-to-reorder + nest tree.
- **Edit Ranking** — global drag/nest tree page.
- **Category Details** — sections: Details, **Media and Icon**, Organize,
  Products. Each editable from its section context menu.

## Audit — what already exists

The following is **already implemented and conforming** (verified
2026-06-16). It is recorded so the next session does not re-build it.

| Requirement | State | Evidence |
| --- | --- | --- |
| List: Name / Handle / Status / Visibility columns + search | ✅ done | `packages/admin/src/pages/categories/category-list/components/category-list-table/use-category-table-columns.tsx:27,89,95,103` |
| Create wizard — *Details* tab (name, handle, description, status, visibility) | ✅ done | `category-create/components/create-category-form/create-category-details.tsx`, `schema.ts` |
| Create wizard — *Organize Ranking* tab (drag + nest) | ✅ done | `category-create/components/create-category-form/create-category-nesting.tsx` |
| Edit drawer (name, handle, description, status, visibility) | ✅ done | `category-edit/components/edit-category-form/edit-category-form.tsx` |
| Detail: Details (general) section + status badges + actions | ✅ done | `category-detail/components/category-general-section.tsx` |
| Detail: Organize section (path + children + edit link) | ✅ done | `category-detail/components/category-organize-section.tsx` |
| Detail: Products section | ✅ done | `category-detail/components/category-product-section.tsx` |
| Global Edit Ranking page | ✅ done | `category-organize/` + route in `get-route-map.tsx` |
| Backend CRUD (`/admin/product-categories` GET/POST, `/:id` GET/POST/DELETE, `/:id/products` POST) | ✅ done | `packages/core/src/api/admin/product-categories/*` |
| Hooks (`useProductCategor(y\|ies)`, create/update/delete, products mutate) | ✅ done | `packages/admin/src/hooks/api/categories.tsx` |

## The gap — Media and Icon

Required by the design, **missing everywhere** (admin UI, vendor UI, core
validators, and the data model — Medusa's upstream `ProductCategoryDTO`
has no media/icon fields).

**What the Figma actually shows** (board node `40008309:22055`, frames
*Create Category* `40012945:933884`, *Category Details* `40012945:881196`,
*Edit Media* `40012945:944095`, *Edit Icon* `40013275:262035`):

- **Media is a multi-image gallery, not fixed slots.** The operator
  uploads many images into a dropzone; **any image in the gallery can be
  designated `thumbnail` and/or `banner`** via its row menu
  (*Remove thumbnail* / *Remove banner* / *Delete* — i.e. set/unset those
  roles). The **same image can be both** thumbnail and banner, and most
  gallery images are neither.
- **Icon is separate and singular** — one image (an SVG in the mock),
  its own detail section and its own edit flow, with the hint
  *"This icon will appear near the category label on the storefront."*

So this is **one image gallery per category with `is_thumbnail` /
`is_banner` flags, plus a single icon** — modeled exactly like Medusa
products (a `images[]` gallery alongside a designated thumbnail), not
three independent upload slots.

### Decision — custom module + link (reusable for collections)

Per the issue owner: media is stored in a **dedicated Medusa module with
a module link**, NOT in `metadata`, because the **same media feature will
later back product collections**. The module must therefore be **generic
over the owning entity**, not category-specific.

Proposed shape (names are a recommendation, finalize at implementation):

- **Module `media`** (`packages/core/src/modules/media`): one
  **image-style** model `Image`, mirroring Medusa's own `ProductImage`
  idiom rather than a fixed-column "slots" record:

  ```ts
  const Image = model.define(
    // tableName is "media_image", NOT "image": Medusa's product module
    // already owns a table named "image" (its ProductImage) — reusing it
    // would collide.
    { tableName: "media_image", name: "Image" },
    {
      id: model.id({ prefix: "img" }).primaryKey(),
      url: model.text(),                            // Medusa File URL
      type: model.text().nullable(),                // null = gallery, "icon" = icon
      is_thumbnail: model.boolean().default(false), // gallery-only designation
      is_banner: model.boolean().default(false),    // gallery-only designation
      rank: model.number().default(0),
      metadata: model.json().nullable(),
    }
  )
  ```

  **Why this shape (gallery + flags), matching the Figma:** a category has
  **many** images. Rows with `type` null are the gallery; among them
  `is_thumbnail` / `is_banner` mark the storefront roles (an image may
  carry both flags, or neither). The single `type: "icon"` row is the icon
  (flags ignored). `type` is a plain nullable string (not an enum) so new
  kinds can be added without a migration. This mirrors Medusa products — a
  gallery plus a designated thumbnail — rather than three independent
  slots, and stays generic enough that product collections reuse it
  unchanged.
  **Why no owner relation on the model** (unlike `ProductImage`'s
  `belongsTo(() => Product)`): `Image` lives in a *separate module* from
  Medusa's product module, so the association crosses a module boundary
  and must go through a **module link** — the owner id lives in the link
  table, not on the `Image` row.
- **Link** `media-product-category-link.ts` — direction is
  **category → media** (the category owns its media), so `productCategory`
  is the first/parent linkable and `isList: true` sits on the media side:

  ```ts
  defineLink(
    ProductModule.linkable.productCategory,
    { linkable: MediaModule.linkable.image, isList: true }
  )
  ```

  This makes a category resolve its `images` list (the full gallery + the
  icon row).
- **Later (separate spec / follow-up):** a second link with the same
  direction reuses the exact same `Image` model for collections:

  ```ts
  defineLink(
    ProductModule.linkable.productCollection,
    { linkable: MediaModule.linkable.image, isList: true }
  )
  ```

  Design the module now so that link is additive only — do **not** name
  anything `category*`.
- **Invariants** (enforced in the upsert workflow, not by DB constraints —
  they span the link table, so no single unique index can express them):
  per category, **at most one** gallery row (`type` null) with
  `is_thumbnail: true`, **at most one** with `is_banner: true`, and **at
  most one** `type: "icon"` row. Setting a flag clears it from any other
  gallery row; uploading an icon replaces the existing icon row.
- **Workflows/steps:** a `setCategoryImagesStep` (create/replace `Image`
  rows + (re)link to the category, apply the invariants above), composed
  into three **wrapper workflows** that the routes call as a single step —
  `createProductCategoryWithImagesWorkflow`,
  `updateProductCategoryWithImagesWorkflow`, and
  `deleteProductCategoryWithImagesWorkflow` (wraps the Medusa core
  category flow + the image step; delete sequences image cleanup before the
  category delete). The routes never orchestrate two workflows themselves.
- **Validators:** extend create/update `product-categories` validators
  with optional:

  ```ts
  media: z.array(z.object({
    url: z.string(),
    is_thumbnail: z.boolean().optional(),
    is_banner: z.boolean().optional(),
    rank: z.number().optional(),
  })).optional(),
  icon: z.string().nullish(),   // single image URL, null clears it
  ```

- **Query config:** add linked `images` (with `url`, `type`,
  `is_thumbnail`, `is_banner`, `rank`) to category list + detail reads, so
  the UI and storefront derive the gallery, thumbnail, banner, and icon.

File uploads use the existing admin file-upload path
(`uploadFilesQuery` in `packages/admin/src/lib/client`); the module
stores the resulting URLs — it does not re-implement uploading.

## User-Visible Behavior

- In the create *Details* step the operator can upload **multiple media
  images** (dropzone) and set any of them as **thumbnail** and/or
  **banner**, plus upload a **single icon**; all optional.
- A category detail page shows a **Media** section (image gallery, with
  thumbnail/banner badges) and a separate **Icon** section, each editable
  from its own `…` section menu.
- The list and storefront can read a category's gallery, its designated
  thumbnail/banner, and its icon (from the linked `images`).
- No Requests/approval UI appears anywhere (BASIC scope).
- Everything already audited as ✅ continues to work unchanged.

## Admin UI — implementation of the missing pieces

All of the following lives in `packages/admin/src/pages/categories` and
must follow @docs/UI-ARCHITECTURE.md. **Mirror the product-media
implementation** — it already solves this exact gallery+thumbnail problem
and the categories work should be a scoped copy of it:

| Reuse target (admin products) | For |
| --- | --- |
| `products/product-create/components/product-create-details-form/components/product-create-details-media-section` | create-step media dropzone + file list |
| `products/common/components/upload-media-form-item` | the `FileUpload` form-item wrapper |
| `products/product-detail/components/product-media-section` | detail-page media gallery section |
| `products/product-media/*` (`product-media.tsx`, `product-media-gallery`, `product-media-view`, `edit-product-media-form`) | full-screen `RouteFocusModal` gallery editor |
| `@mercurjs/dashboard-shared` `FileUpload`, `Thumbnail` | primitives |

### 1. Create wizard — extend the *Details* tab

File: `category-create/components/create-category-form/create-category-details.tsx`
(+ `schema.ts`). Keep the existing two-tab `TabbedForm` (Details +
Organize Ranking) — **no new tab**; media/icon are appended to the
Details tab body after the Status/Visibility row (per Figma
`40012945:933884`).

- **Media (Optional)** — a `FileUpload` dropzone labelled *"Upload
  images"* / *"Drag and drop images here or click to upload"*, followed
  by a list of uploaded rows. Each row: `Thumbnail` preview + filename +
  size, thumbnail/banner **badges**, and an `ActionMenu` (`…`) whose
  actions toggle the row's role and remove it:
  *Set as / Remove thumbnail*, *Set as / Remove banner*, *Delete*
  (matches the Figma row menu). Per @docs/UI-ARCHITECTURE.md use
  `ActionMenu` — never an inline menu.
- **Icon (Optional)** — a single-file `FileUpload` rendering one row
  (filename + size + `×` remove). Add a `Form.Hint`: *"This icon will
  appear near the category label on the storefront."*
- **Schema** — add `media: z.array(z.object({ url, is_thumbnail?,
  is_banner?, rank? })).optional()` and `icon: z.string().nullable().optional()`.
  Both optional ⇒ the tab's `validationFields` are unchanged.
- Wrap every field in `Form.Field → Form.Item → Form.Label / Form.Control
  / Form.ErrorMessage`; `data-testid`s `category-create-form-media-*`,
  `category-create-form-icon-*`.

### 2. Detail page — new Media and Icon sections

File: `category-detail/category-detail.tsx` plus two new section
components under `category-detail/components/`. Layout stays
`TwoColumnPage`; insert the sections in `Main` between the general and
products sections (Figma `40012945:881196` order:
General → **Media** → **Icon** → Products; sidebar Organize unchanged):

```tsx
<TwoColumnPage.Main>
  <CategoryGeneralSection category={product_category} />
  <CategoryMediaSection category={product_category} />
  <CategoryIconSection category={product_category} />
  <CategoryProductSection category={product_category} />
</TwoColumnPage.Main>
```

- **`category-media-section/`** — `Container className="divide-y p-0"`,
  header row `flex items-center justify-between px-6 py-4` with
  `<Heading>{t("categories.media.label")}</Heading>` and an `ActionMenu`
  → `{ label: t("actions.edit"), to: "media/edit" }`. Body: a grid of
  `Thumbnail`s for the gallery images (`type` null), thumbnail/banner
  images badged. `NoRecords`/empty placeholder when none.
- **`category-icon-section/`** — same shell, `<Heading>{t("categories.icon.label")}</Heading>`,
  `ActionMenu` → `{ to: "icon/edit" }`, body renders the single
  `type === "icon"` image (or empty state).

### 3. Edit flows (routed modals)

Per Figma, Media and Icon each have a dedicated edit surface:

- **`category-media-edit/`** — a full-screen `RouteFocusModal` **gallery
  editor** (route `categories/:id/media/edit`), a scoped copy of
  `products/product-media`: upload, reorder, set thumbnail/banner, delete,
  then submit the resulting `media[]` through `useUpdateProductCategory`.
- **`category-icon-edit/`** — a `RouteDrawer` (route
  `categories/:id/icon/edit`) with a single `FileUpload` + the storefront
  hint; submits `{ icon }`. Gate behind `ready = !isPending && !!category`;
  Cancel + Save footer with `isLoading`.

Register all three routes (`media/edit`, `icon/edit`, and the gallery)
under the existing `categories/:id` branch in
`packages/admin/src/get-route-map.tsx` as `lazy()` children, alongside
the current `edit` / `products` / `organize` routes.

### 4. Hooks & data

`packages/admin/src/hooks/api/categories.tsx` already has
`useUpdateProductCategory`; no new hook is required — the create/update
payloads gain `media` / `icon`, and reads must request the linked
`images` (extend the category query fields used by the list table,
`loader.ts`, and `useProductCategory`). Invalidate `details()` /
`detail(id)` after media/icon edits (already wired in the update hook).

### 5. i18n & test ids

Add keys under the `categories.*` namespace to `en.json` **first**, then
mirror into the other locales: `categories.media.label`,
`categories.icon.label`, `categories.media.upload.{title,hint}`,
`categories.media.actions.{setThumbnail,removeThumbnail,setBanner,removeBanner}`,
`categories.icon.hint`, plus `…edit.{header,description}` for the two
edit modals. Every interactive element carries a kebab-case
`data-testid`.

## Implementation plan

1. **Backend module + link** — create `media` module, `Image` model
   (`url` + `type` + `is_thumbnail` + `is_banner` + `rank`, table
   `media_image`), migration, and `media-product-category-link`. Register
   in core.
2. **Workflows** — add the `setCategoryImages` step (apply the single-
   thumbnail/banner/icon invariants) + detach-on-delete; wire into the
   create, update, and delete category workflows.
3. **API** — extend `product-categories` create/update validators with
   `media[]` + `icon`; add linked `images` to query-config so reads
   return them.
4. **Admin hooks/types** — request `images` on category reads (list +
   detail + loader); forward `media`/`icon` in create/update payloads.
5. **Admin create UI** — extend the *Details* tab with the media gallery
   field + icon field (§Admin UI 1).
6. **Admin detail UI** — add Media + Icon sections and the
   `media/edit` (RouteFocusModal gallery) + `icon/edit` (RouteDrawer)
   routes (§Admin UI 2–3); register in `get-route-map.tsx`.
7. **i18n** — add `categories.*` keys to `en.json` first, then other
   locales (§Admin UI 5).
8. **Tests** — see Verification.

Keep changes within categories scope. The collection link is **out of
scope for this spec** but the module must not block it.

## Verification

- `bun run lint` and `bun run build` pass.
- **HTTP integration** (`integration-tests`, run with
  `bun run test:integration:http -- product-categor`):
  - create a category with a `media[]` gallery (one row flagged
    `is_thumbnail` + `is_banner`, others neither) and an `icon` → GET
    returns the linked `images` with flags + the icon row.
  - update media (add/remove rows, move thumbnail/banner to a different
    image, replace icon) → persisted; **invariants hold** (≤1 thumbnail,
    ≤1 banner, ≤1 icon per category).
  - delete a category → images detached + removed (no orphan error).
  - existing category CRUD specs still green (regression).
- **Manual (admin panel):** create a category with several images, set a
  thumbnail + banner and an icon → detail page Media + Icon sections
  render with the right badges; edit via `media/edit` gallery and
  `icon/edit` drawer; list still loads.
- No Requests UI present anywhere in the categories surface.

## Evidence

Implemented 2026-06-16.

**Backend (`@mercurjs/core`):**
- `media` module — model [image.ts](../../packages/core/src/modules/media/models/image.ts)
  (`Image`, table `media_image`, `type` nullable + `is_thumbnail`/`is_banner`),
  [service.ts](../../packages/core/src/modules/media/service.ts),
  [index.ts](../../packages/core/src/modules/media/index.ts),
  migration `Migration20260616000000.ts`. `MEDIA` added to
  [modules.ts](../../packages/types/src/modules.ts).
- Link [media-product-category-link.ts](../../packages/core/src/links/media-product-category-link.ts)
  (category → image, `isList`). Auto-registered as
  `product_product_category_media_image` (confirmed in test boot log).
- Step [set-category-images.ts](../../packages/core/src/workflows/media/steps/set-category-images.ts)
  (full-replace + single thumbnail/banner/icon invariants + compensation),
  composed into wrapper workflows
  [create-product-category-with-images.ts](../../packages/core/src/workflows/media/workflows/create-product-category-with-images.ts),
  [update-…](../../packages/core/src/workflows/media/workflows/update-product-category-with-images.ts),
  [delete-…](../../packages/core/src/workflows/media/workflows/delete-product-category-with-images.ts)
  that wrap the Medusa core category flows.
- Validators (`media[]` + `icon`) and query-config (`images.*`) in
  `packages/core/src/api/admin/product-categories/`. Routes call a single
  wrapper workflow each — create
  ([route.ts](../../packages/core/src/api/admin/product-categories/route.ts)),
  update + delete ([[id]/route.ts](../../packages/core/src/api/admin/product-categories/[id]/route.ts)).

**Admin (`@mercurjs/admin`):**
- Shared inputs `pages/categories/common/components/category-image-fields/`
  (`CategoryMediaInput`, `CategoryIconInput`, `uploadCategoryImages`, helpers).
- Create wizard: schema + Details tab extended with media gallery + icon;
  submit uploads files and sends `media`/`icon`.
- Detail page: `category-media-section` + `category-icon-section` added to
  `category-detail.tsx`; edit drawers `category-media-edit/` +
  `category-icon-edit/`; routes `media/edit` + `icon/edit` registered in
  `get-route-map.tsx`.
- i18n: `categories.media.*` + `categories.icon.*` in `en.json` and
  `$schema.json`.

**Verification run:**
- HTTP integration: `bun run test:integration:http -- product-categories-media`
  → **5 passed** ([product-categories-media.spec.ts](../../integration-tests/http/product-categories/admin/product-categories-media.spec.ts)):
  create with gallery+thumbnail+banner+icon, GET returns linked images,
  update moves thumbnail/banner + replaces icon (invariants hold), icon=null
  clears icon, delete removes linked images (no orphans).
- `bun run build` → **9/9 packages pass** (incl. core codegen + admin DTS).
- `oxlint` on new `pages/categories` + `modules/media` + `workflows/media`
  files → clean (remaining warnings are pre-existing `_tabMeta`/shadow
  conventions in untouched files).

**Not done in this environment:** manual admin-panel smoke test (no dev
stack run); behavior is covered by the integration tests above.

## Notes / decisions

- **BASIC = no Requests.** The seller-initiated category approval-request
  flow is deferred (see below). Nothing in this spec adds request UI.
- **Media storage = custom module + link, not metadata** — chosen so the
  same `media` module backs product collections later. Module must stay
  entity-agnostic (no `category` in its names).
- **Media is a gallery with thumbnail/banner *designations*, not three
  slots** — confirmed against Figma `40012945:933884` /
  `40012945:881196`: any gallery image can be flagged thumbnail and/or
  banner (the same image can be both), the icon is a separate single
  image. This is why the model is `images[]` + `is_thumbnail`/`is_banner`
  flags + a `type:"icon"` row, mirroring Medusa product media.
- **Build the admin media/icon UI as a scoped copy of `product-media`** —
  do not invent new gallery primitives; the product-media create section,
  detail section, and full-screen gallery editor already implement upload,
  reorder, thumbnail designation, and delete.
- **Deviation — `media/edit` is a `RouteDrawer`, not a full-screen
  `RouteFocusModal` gallery.** The implementation reuses the same
  `CategoryMediaInput` (dropzone + list + per-row thumbnail/banner toggle)
  in a drawer, matching the icon edit flow and the create wizard. This is
  simpler, consistent with the edit-flow convention, and delivers the same
  capability minus drag-to-reorder (rank is assigned by list order). Revisit
  if drag-reorder of the gallery becomes a requirement.
- Vendor categories are *more minimal* than admin today (no status/
  visibility columns, no general-section actions). Bringing vendor to
  parity is **not** part of MER-156 (admin label) — track separately if
  needed.
- `is_restricted` already exists on the category DTO (derived from
  seller links); unrelated to this spec but do not regress it.

## Deferred (out of scope)

- **Category Requests** — vendor-initiated create/publish approval flow.
- **Collection media** — the second module link reusing `media`; ships in
  its own follow-up once this module lands.
- **Vendor categories parity** — status/visibility columns and section
  actions on the seller surface.
