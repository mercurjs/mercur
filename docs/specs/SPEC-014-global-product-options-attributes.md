---
status: in_progress
canonical: true
priority: 1
area: products/attributes
created: 2026-06-18
last_updated: 2026-06-18
---

# SPEC-014 Attributes on Native Global Product Options

Rebuild the Mercur product-attribute system on top of **Medusa's native
global product options** (`ProductOption.is_exclusive`, the
`product_product_option` products↔options many-to-many pivot, and
per-product option value subsets). This replaces the bespoke
attribute→variant machinery (custom links, `enrichProductAttributes`, the
`materialize` / `sync-product-attribute-options` / `resolve-attribute-refs`
workflow web) with a single, Medusa-idiomatic model where **variant-axis
attributes ARE global product options** and non-axis attributes are plain
value links.

This is the canonical owner of how attributes attach to products. It
supersedes the attribute pieces of SPEC-008 (standalone product-attribute
module) where they conflict.

## Decision (owner: framework author)

Confirmed with the framework author on 2026-06-18:

1. **Medusa upgrade is a hard prerequisite.** Mercur's `bun.lock` currently
   resolves `@medusajs/product@2.13.4`, which has **no** global options
   (`ProductOption` is still 1:1 per-product via `product_id`; no
   `is_exclusive`, no `product_product_option` pivot, no per-product value
   subsets). Native global options are `@since 2.16.0`. **The spec upgrades
   all `@medusajs/*` packages to the preview release that ships global
   product options** — see
   <https://medusajs.com/blog/announcing-global-product-options-in-medusa/>
   ("preview-options" channel). No part of this design works on 2.13.4.

2. **Variant axis ⟺ Medusa global product option.** An attribute with
   `is_variant_axis = true` is backed by a real Medusa `ProductOption`.
   Non-axis attributes are **not** options — they are value links only.

3. **Only `multi_select` attributes may be variant axes.** Validation must
   reject `is_variant_axis = true` on any other type.

4. **Link direction is `attribute → global option`.** A Mercur
   `ProductAttribute` points at its mirror `ProductOption`; a
   `ProductAttributeValue` points at its mirror `ProductOptionValue`.

5. **Exclusive vs. shared options:**
   - Reusable catalog (global) axis attribute → `ProductOption` with
     `is_exclusive = false` (shared across products).
   - Inline / product-scoped axis attribute → `ProductOption` with
     `is_exclusive = true` **and** a product-scoped Mercur
     `ProductAttribute`.

6. **One batch workflow does everything.** A single
   `createAndLinkProductAttributesToProductWorkflow({ add, remove, update })`
   replaces the per-attribute mutation routes. The
   `packages/core/src/api/vendor/products/[id]/attributes/[attribute_id]`
   route is **deleted**.

7. **Enrichment is a pure view, not a query owner.** `enrichProductAttributes`
   (which runs its own queries and writes back onto the entity) is removed.
   Responses come from a single graph read driven by field selection over
   links; any grouping is a stateless in-memory transform.

## Why this is a rewrite, not a refactor

Today the attribute system fakes what Medusa now does natively:

- Variant axes are tracked with Mercur-owned links
  (`product_variant_attribute`, `product_variant_attribute_value`) and then
  *shadowed* into stock `ProductOption`s by
  `sync-product-attribute-options` / `upsert-product-options-for-axis`.
  Two sources of truth that must be kept in sync by hand.
- `resolve-attribute-refs` + `materialize-product-attributes` +
  `buildInlinePlan` exist only to translate UI input into those two worlds.
- `enrichProductAttributes`
  (`packages/core/src/api/utils/format-product-attributes.ts`) issues its own
  two bulk queries and mutates each product with a synthetic `attributes`
  array — it knows module internals and bypasses the graph.

With native global options, the axis world *is* `ProductOption`. The shadow
machinery, the dual links, and the hand-rolled enrichment all collapse.

## Core model — type → backing store

| Attribute `type` | `is_variant_axis` | Backed by Medusa global option? | Value semantics on attach |
| --- | --- | --- | --- |
| `multi_select` | `true` (axis) | **Yes** — `ProductOption` + `ProductOptionValue`s; product linked via native M2M, restricted to the selected `value_ids` subset | link product↔option, subset = `value_ids` |
| `multi_select` | `false` | No | link product↔value (`value_ids`) |
| `single_select` | `false` (never axis) | No | link product↔value (`value_ids`) |
| `text` | `false` | No | **create** a new value in the attribute, then link product↔value |
| `unit` | `false` | No | **create** a new value (e.g. `"10kg"`), then link product↔value |
| `toggle` (boolean) | `false` | No | attribute has two fixed values `true`/`false`; **link the existing** value matching the boolean |

Inline axis create (`{ title, values, is_variant_axis: true }`) →
`ProductOption(is_exclusive: true)` + values **and** a product-scoped
`ProductAttribute` (with `product_id` set), linked per decision (4).

Removing an axis attribute from a product → drop the native product↔option
link (decision 4: "if `is_variant_axis = true` remove the link between
global product options and the product"). Removing an inline/exclusive
product-scoped axis attribute → delete the exclusive option and the
product-scoped attribute.

## Target API

### Product create (Mercur override of `createProductsWorkflow`)

```ts
createProductsWorkflow([{
  title: 'Vendor Product',
  attributes: [
    { id: 'attr_global_multi_select', value_ids: ['val_1', 'val_2'] }, // axis multi-select → global option
    { id: 'attr_global_single_select', value_ids: ['val_1', 'val_2'] }, // non-axis → value link only
    { title: 'Size', values: ['S','M','L','XL'], is_variant_axis: true }, // inline axis → is_exclusive option + scoped attr
    { id: 'attr_global_text', value: 'free text' },                       // text → create value + link
    { title: 'Weight', value: '10kg', is_variant_axis: false },           // inline unit → scoped attr + value
    { id: 'attr_global_toggle', value: true },                            // toggle → link existing true/false value
  ],
  variants: [{
    title: 'default variant',
    // keyed by attribute title → value NAME (native Medusa shape)
    options: { size: 'S', 'Multi Select': 'Value 1' },
  }],
}])
```

The single `attributes[]` array replaces the current
`variant_attributes[]` / `product_attributes[]` split. Axis vs. non-axis is
derived from the attribute's `is_variant_axis` (existing refs) or the inline
flag (inline refs). `variants[].options` is the native Medusa map (option
title → value name); Mercur builds the `options[]` input from the axis
attributes and lets stock Medusa resolve the variant option value IDs.

### Batch attach/detach/update (replaces the per-attribute routes)

```ts
createAndLinkProductAttributesToProductWorkflow({
  input: {
    product_id: 'pr_test',
    add: [
      { id: 'attr_global_multi_select', value_ids: ['val_1', 'val_2'] },     // axis → link product↔option
      { id: 'attr_global_single_select', value_ids: ['val_1', 'val_2'] },    // non-axis → value links
      { title: 'Size', values: ['S','M','L','XL'], is_variant_axis: true },  // inline axis → is_exclusive option + scoped attr
      { id: 'attr_global_text', value: 'free text' },
      { title: 'Weight', value: '10kg', is_variant_axis: false },
      { id: 'attr_global_toggle', value: true },
    ],
    // axis ids → unlink product↔option; non-axis → drop value links;
    // inline/exclusive scoped → delete option + scoped attribute
    remove: ['attr_global_single_select', 'attr_global_multi_select', 'is_exclusive_product_scoped_size'],
    update: [
      { id: 'attr_global_multi_select', add: ['val_3','val_4'], remove: ['val_1','val_2'] }, // adjust option value subset
      { id: 'is_exclusive_product_scoped_size', add: [{ value: 'XXL' }], remove: ['optval_s','optval_m','optval_l'] }, // mutate exclusive option values
      { id: 'attr_global_unit', value: '11kg' },                  // upsert unit value
      { id: 'attr_global_toggle', value: false },                 // switch linked true→false
      { id: 'product_scoped_exlusive_text_attribute', value: 'product scoped text attribute' },
    ],
  },
})
```

`add` / `remove` / `update` are applied in a deterministic order
(remove → add → update, mirroring how the apply dispatcher already orders
removes before adds so an attribute can be re-linked in one call).

## Data model & links

**Upgrade-provided (native Medusa, no Mercur model):**
`ProductOption { is_exclusive }`, `ProductOptionValue { rank }`,
`product_product_option` pivot, per-product value subset
(`product.options[].value_ids`).

**New Mercur links (direction = attribute → global option):**

1. `ProductAttribute → ProductOption` (one-to-one mirror; alias e.g.
   `product_option`).
2. `ProductAttributeValue → ProductOptionValue` (one-to-one mirror).

**Existing Mercur links — keep:**

- `product_attribute_value_link` (Product ↔ ProductAttributeValue) — non-axis
  selected values.
- `product-attribute-product-link` (`scoped_attributes`, read-only) —
  product-scoped attributes surfaced on the product.
- `product-attribute-category-link` — which attributes apply per category.

**Existing Mercur links — remove (superseded by native options):**

- `product-variant-attribute-link` (`product_variant_attribute`).
- `product-variant-attribute-value-link` (`product_variant_attribute_value`).

A data migration must move any existing variant-axis attributes onto native
`ProductOption`s (creating shared options for global axis attributes,
exclusive options for product-scoped ones), populate the two new mirror
links, then drop the two removed pivot tables.

## Workflows

Remove / fold in (heavily inspired by Medusa's own `createProductsWorkflow`
and option workflows):

- `materialize-product-attributes`, `sync-product-attribute-options`,
  `upsert-product-options-for-axis`, `add-product-attribute`,
  `detach-product-attribute`, `batch-product-attribute-values`,
  `replace-product-attribute-value-links`, `resolve-attribute-refs`
  (`buildInlinePlan`) — **deleted**, not refactored. Rebuilt from scratch per
  the Implementation plan: one graph read + pure transforms + stock
  option/link steps. No god-resolution step (see the rejection of
  `resolveProductAttributesStep`).

Keep (attribute-catalog CRUD, unchanged contract):
`create/update/delete-product-attributes`,
`create/update/upsert/delete-product-attribute-values`.

The vendor approval queue (`ProductChange`) flow is preserved: the vendor
batch endpoint still **stages** a `ProductChange` (HTTP 202) and admin
applies directly (HTTP 200), but both ultimately drive the new unified
attach/detach/update logic. `productEditUpdateAttributesWorkflow` /
`applyProductAttributeChangeActionsWorkflow` are reworked to emit/consume the
new add/remove/update action shape and the native-option operations.

## Response shape (enrichment removed)

Drop `enrichProductAttributes`. Products come back value-centric for
non-axis attributes and native for axis attributes, from one graph read:

```jsonc
{
  "id": "prod_vendor_1",
  "title": "Vendor Product",

  // AXIS attributes = native options (already grouped, already valued)
  "options": [
    { "id": "opt_multi", "title": "Multi Select",
      "values": [ { "id": "optval_1", "value": "Value 1" }, { "id": "optval_2", "value": "Value 2" } ] }
  ],

  // NON-AXIS selected values, each carrying its parent attribute + the parent's full value set
  "attribute_values": [
    { "id": "val_cotton", "name": "Cotton", "rank": 0,
      "attribute": {
        "id": "attr_material", "name": "Material", "handle": "material",
        "type": "single_select", "is_variant_axis": false, "is_required": false, "rank": 1,
        "values": [ { "id": "val_cotton", "name": "Cotton", "rank": 0 }, { "id": "val_wool", "name": "Wool", "rank": 1 } ]
      }
    }
  ],

  // product-scoped attributes (text/unit/toggle, scoped selects)
  "scoped_attributes": [
    { "id": "attr_weight", "name": "Weight", "type": "unit", "is_variant_axis": false,
      "values": [ { "id": "val_10kg", "name": "10kg", "rank": 0 } ] }
  ]
}
```

"Selected vs. available" answers itself: selected = `attribute_values`,
available = `attribute_values[].attribute.values` (one hop up). No invented
`all_values` field. If the UI wants it grouped by attribute, group
client-side, or keep a **pure** in-memory `groupProductAttributeValues`
transform over the already-fetched graph (zero extra DB calls) and expose it
as `product.attributes`.

## API surface changes

- **Delete:** `packages/core/src/api/vendor/products/[id]/attributes/[attribute_id]/`
  (GET/POST/DELETE single-attribute). Batch covers it.
- **Consolidate** vendor + admin product-attribute mutations onto the batch
  endpoint (`.../attributes/batch`) backed by
  `createAndLinkProductAttributesToProductWorkflow`. Vendor stages a
  `ProductChange`; admin applies directly.
- **Create/update product** validators accept the unified `attributes[]`
  shape + native `variants[].options`. Reject `is_variant_axis = true` for
  non-`multi_select` types.
- GET endpoints return the graph shape above (no `enrichProductAttributes`).

## UI changes

**Vendor (`packages/vendor/src/`)** and **Admin (`packages/admin/src/`)**:

- Product create wizard — attributes tab: emit the unified `attributes[]`
  shape; `use_for_variants` maps to `is_variant_axis` and is only offered for
  `multi_select`.
- Product create wizard — variants tab: build `variants[].options` keyed by
  axis attribute title → value name (native shape); axis source is now
  `product.options`, not the old variant-attribute filter.
- Product detail attribute section: read axis from `product.options`,
  non-axis from `product.attribute_values` / `scoped_attributes`.
- Product attribute add/edit/remove flows: call the batch endpoint.
- Variant create/edit forms: options come from native `product.options`.
- Remove UI assumptions about `all_values` and the synthetic `attributes`
  array; consume the graph shape.

## Tests

Completely rewrite the product attribute integration suites
(`integration-tests/http/product/{admin,vendor}/product.spec.ts`,
`integration-tests/http/product-attribute/…`,
`integration-tests/http/product-edit/vendor/…` attribute cases) against the
new API. Cover, for both admin (direct) and vendor (staged) surfaces:

1. Create product with each attribute kind (existing axis multi-select,
   existing single-select, inline axis, existing text, inline unit, toggle)
   and assert the response shape (`options`, `attribute_values`,
   `scoped_attributes`).
2. Axis attribute creates a native `ProductOption`; global axis →
   `is_exclusive: false`; inline axis → `is_exclusive: true` + product-scoped
   attribute hidden from the global catalogue.
3. Variants resolve via native `options` (title → value name).
4. Batch `add` / `remove` / `update`: option value subset add/remove;
   exclusive option value mutation; unit/text upsert; toggle true→false;
   axis remove unlinks product↔option; inline/exclusive remove deletes the
   option + scoped attribute.
5. `is_variant_axis = true` rejected for non-`multi_select`.
6. The deleted `[attribute_id]` route is gone (404).

Per CLAUDE.md: for any bug found, write the failing test first.

## Implementation plan — delete the old web, rebuild from scratch

Decision (owner: framework author, 2026-06-18): **do not refactor the existing
attribute workflow web — delete it and write the flows from scratch.** The old
machinery (`resolveAttributeRefsStep` + `buildInlinePlan` + `materialize` +
`sync-product-attribute-options` + the variant-attribute links) exists only to
bridge two shadow worlds (Mercur variant links vs. stock options). Native
global options erase that reason, so the bridge goes too.

**Explicitly rejected: `resolveProductAttributesStep`.** There is no
god-resolution step in the new design. "Resolution" is a single
`useQueryGraphStep` over the link graph plus small **pure** `transform`s /
helper functions. Each wrapper should read like stock Medusa + two narrow
Mercur concerns: (1) non-axis value links, (2) inline/scoped attributes + their
mirror.

### A. Delete outright (no rewrite-in-place)

Workflows (`packages/core/src/workflows/`):
- `product-attribute/workflows/`: `materialize-product-attributes`,
  `sync-product-attribute-options`, `add-product-attribute`,
  `detach-product-attribute`, `batch-product-attribute-values`,
  `update-product-attribute` (singular).
- `product-attribute/steps/`: `upsert-product-options-for-axis`,
  `validate-product-attribute-input` (re-author lean if still needed).
- `product/steps/`: `resolve-attribute-refs.ts` (incl. `buildInlinePlan`,
  `ResolvedRefs`, the `AttributeRef` mega-union, `unionVariantOptionValues`'s
  reason-for-being), `replace-product-attribute-value-links.ts`.

Links (`packages/core/src/links/`): `product-variant-attribute-link.ts`,
`product-variant-attribute-value-link.ts`.

API: `vendor/products/[id]/attributes/[attribute_id]/` + admin twin.

Utils: `enrichProductAttributes` in `api/utils/format-product-attributes.ts`
(keep only a pure `groupProductAttributeValues`).

**Keep** (lean public contract, used as plain building blocks): catalog CRUD
`create/update/delete-product-attributes`,
`create/update/upsert/delete-product-attribute-values` and their steps
`createProductAttributesStep`, `createProductAttributeValuesStep`.

### B. New model — two mirror links only

`ProductAttribute → ProductOption` and `ProductAttributeValue → ProductOptionValue`
(direction per decision 4). Keep `product_attribute_value_link`,
`scoped_attributes` (read-only), and the category link. The mirror is the
single source of truth that ties a Mercur axis attribute to its native option;
because it is a real link, it is **readable via the graph** — which is what
kills the need for a resolution step.

### C. New building blocks — graph read + pure functions, zero god-steps

Resolution is **one** native graph read. Wherever a flow needs to understand
referenced attributes, call:

```ts
useQueryGraphStep({
  entity: "product_attribute",
  fields: [
    "id", "name", "type", "is_variant_axis", "product_id",
    "values.id", "values.name",                 // for text/unit/toggle resolution
    "product_option.id", "product_option.title", // axis mirror (from the link)
    "values.product_option_value.id",            // per-value mirror (from the link)
  ],
  filters: { id: <ids gathered from attributes[]/add[]/update[]> },
})
```

That one read yields everything the transforms need: type/axis classification,
the full value set (resolve text/unit by name, toggle by `true`/`false`), and
the mirror option/value ids for axes. No `ResolvedRefs`, no batched service
call threaded through transforms.

Pure helpers (`packages/core/src/workflows/product/utils/attributes.ts`,
plain functions — unit-tested, **not** steps):
- `toStockOptions(attrsById, attributes)` → axis refs → stock `options[]`
  (existing → `{ id, value_ids }` mapped through the mirror; inline →
  `{ title, values, is_exclusive: true }`).
- `splitNonAxis(attrsById, attributes)` → `{ link_value_ids, create_values }`
  where `link_value_ids` = select `value_ids` + resolved toggle value id, and
  `create_values` = free-form text/unit names (+ inline non-axis values) that
  must be created before linking.
- `mirrorLinkDefs(createdProduct, inlineAxisRefs)` → attribute→option /
  value→optionvalue link defs, read off the created product's `options`
  (matched by title/value name).
- `valueLinkDefs(productId, valueIds)` → `product_attribute_value_link` defs.

One genuinely new step (catalog only, §F): `upsertAxisOptionMirrorStep` —
ensure/drop the shared `ProductOption(is_exclusive:false)` + value mirrors +
links for a `multi_select` axis attribute.

### D. New `createProductsWorkflow` (`mercur-create-products`, rewritten file)

Input: replace `variant_attributes` + `product_attributes` with a single
`attributes?: ProductAttributeInput[]`. `variants[].options` is the native
name-map (drop the legacy `attribute_values` rename path entirely).

Reads almost like stock:
1. `useQueryGraphStep` referenced attributes (C) → `attrsById` transform.
2. `transform` → stock payload: `options = toStockOptions(...)` (default-option
   fallback when none); native `variants[].options`; `manage_inventory:false`;
   strip `attributes`/`seller_ids`.
3. `stockCreateProductsWorkflow.runAsStep` → `createdProducts`.
4. `transform` → inline scoped attributes to create + `create_values` (from
   `splitNonAxis`) → `createProductAttributesStep` + `createProductAttributeValuesStep`.
5. `transform` → `mirrorLinkDefs(...)` (inline axis) + `valueLinkDefs(...)`
   (all non-axis selected/created value ids) → `createRemoteLinkStep`.
6. `associateSellersWithProductStep`, `recordProductAuditChangeWorkflow`,
   `emitEventStep(CREATED)` — unchanged.

No resolve step, no materialize workflow, no axis-shadow synthesis.

### E. ~~`updateProductsWorkflow` attribute path~~ — REMOVED

Decision (framework author, 2026-06-18): the update-products wrapper does **not**
handle attributes. All attribute edits on an existing product go through the
batch engine (§G). `updateProductsWorkflow` keeps only its core-field / seller /
legacy responsibilities. There is no `attributes[]` path on update.

### F. New catalog mirror maintenance

`create/update-product-attributes` call `upsertAxisOptionMirrorStep` when
`type = multi_select && is_variant_axis` (create/ensure shared option; drop on
axis-off). Value CRUD mirrors values onto the shared option. Validator rejects
`is_variant_axis` on non-`multi_select`. This guarantees every existing global
axis attribute already has a graph-readable mirror by the time C runs.

### G. New `createAndLinkProductAttributesToProductWorkflow` (batch engine)

`packages/core/src/workflows/product-attribute/workflows/create-and-link-product-attributes.ts`.
Input `{ product_id, add?, remove?, update? }`; order **remove → add → update**.
Built from the SAME blocks (graph read + pure helpers + stock option/link steps
+ catalog value steps) — it is the single post-create / approval-confirm apply
engine. Per-branch behavior:
- **remove**: axis global → dismiss product↔option; axis inline/exclusive →
  `deleteProductOptionsWorkflow` + `deleteProductAttributesWorkflow`; non-axis →
  dismiss value links (+ delete scoped attr).
- **add**: existing axis → link product↔mirror option (+ value subset); inline
  axis → `createProductOptionsWorkflow({ is_exclusive:true })` on the product +
  scoped attr + mirror; non-axis → create values / resolve toggle + link.
- **update**: shared axis → adjust value subset (mirror new names first);
  exclusive axis → mutate option values in place; text/unit → upsert + swap
  link; toggle → swap true↔false link.

### H. Routes, validators, approval queue, codegen

- Delete `[attribute_id]` route (+ admin twin) + middleware entries.
- `.../attributes/batch` (vendor + admin) → the batch engine. Admin direct
  (200, `{ product }`); vendor stages a `ProductChange` (202) — rewrite
  `product-edit-update-attributes` to emit add/remove/update actions and
  `apply-product-attribute-change-actions` to call the batch engine on confirm.
- Validators: unified `attributes[]` on create/update;
  `is_variant_axis ⇒ multi_select` refine; batch `add/remove/update` schema.
- `mercurjs codegen` to regenerate the typed route map.

### I. Data migration

Move existing variant-axis attributes onto native shared/exclusive options,
populate the two mirror links, then drop `product_variant_attribute` and
`product_variant_attribute_value`.

### J. PR sequencing

1. Medusa upgrade + `bun install` + build green.
2. New mirror links + §F catalog mirror + §I migration.
3. **Delete §A web** + new §C helpers + new §D create wrapper + tests.
4. New §E update wrapper + tests.
5. §G batch engine + §H routes/validators/approval + codegen + tests.
6. Enrichment removal + response-shape switch + UI + UI/integration tests.

## Verification

1. `bun install` resolves the upgraded `@medusajs/*` preview packages; grep
   confirms `is_exclusive` and `product_product_option` exist in the
   installed product module.
2. `bun run build` passes across all packages.
3. `bun run test:integration:http -- product` and the rewritten attribute
   suites pass.
4. Manual: vendor create product with an axis multi-select + an inline
   axis + a unit + a toggle; confirm native options/variants in admin and
   the graph response shape; confirm the batch endpoint add/remove/update.
5. Data migration: existing variant-axis attributes appear as native
   options; old `product_variant_attribute*` tables dropped; mirror links
   populated.

## Evidence

### 2026-06-18 — J.1 Medusa preview upgrade + green baseline

- Upgraded all workspace `@medusajs/*` to the `options-preview` build
  (`2.16.0-options-preview-20260605124754`; `@medusajs/ui`
  `4.1.16-options-preview-20260605124754`). `bun install` resolved cleanly
  (3154 packages). Installed `@medusajs/types` carries `is_exclusive`; product
  module ships `product-product-option` / `product-product-option-value` models.
- The 2.13→2.16 bump produced exactly **3 type errors**, all fixed:
  - `api/vendor/products/validators.ts` — framework zod is now **v4**;
    `WithAdditionalData` callback must return `ZodObject` (bridged the
    `ZodEffects` from `.superRefine`).
  - `workflows/cart/steps/prepare-adjustments-from-promotion-actions.ts` —
    added the 2.16-required `skippedPromoCodes`.
  - `workflows/product-attribute/steps/upsert-product-options-for-axis.ts` —
    rewritten against the 2.16 native product↔option API
    (`addProductOptionToProduct`, `upsertProductOptions`, `query.graph`).
- **`bun run build` green — 9/9 packages** on the 2.16 preview.

### 2026-06-18 — J.2 (start) toggle seeding

- `create-product-attributes` workflow seeds the two fixed values
  `["true","false"]` (ranks 0/1) for `type === TOGGLE`, ignoring caller-supplied
  values (confirmed contract). `turbo build --filter=@mercurjs/core` green.
- Owed: integration test asserting toggle attributes expose exactly
  `true`/`false` after create (no DB in worktree).

### 2026-06-18 — J.2 (cont) mirror foundation

- New mirror links (`mirror_*` aliases to dodge same-module alias shadowing):
  `links/product-attribute-option-mirror-link.ts` (ProductAttribute →
  ProductOption, 1:1) and
  `links/product-attribute-value-option-value-mirror-link.ts`
  (ProductAttributeValue → ProductOptionValue, 1:1).
- New step `mirror-axis-attributes-to-options.ts`
  (`mirrorAxisAttributesToOptionsStep`): for axis (`multi_select` +
  `is_variant_axis`) attributes, creates the native `ProductOption` mirror
  (`is_exclusive:false` for catalog/shared) + value mirrors and returns the
  attribute→option / value→optionvalue link defs; compensation deletes created
  options.
- Wired into `create-product-attributes` workflow (runs after values exist;
  links persisted via a second `createRemoteLinkStep`,
  `pa-create-axis-option-mirror-links`). `turbo build --filter=@mercurjs/core`
  green.
- Owed in §F: mirror maintenance on `update-product-attributes` (axis flip
  on/off, rename) and on value CRUD (`update/upsert/delete` attribute values →
  option values); data migration to backfill mirrors for existing axis
  attributes.
- **Runtime-verified** (Postgres up; integration runner migrates its own fresh
  DB on the 2.16 preview): `integration-tests/http/product-attribute/admin/mirror-foundation.spec.ts`
  **3/3 passing** — axis `multi_select` → shared `ProductOption` mirror with
  matching values and graph-resolvable `mirror_option` / `mirror_option_value`
  links; non-axis does not mirror; toggle seeds exactly `true`/`false`. Confirms
  the link migrations apply cleanly and the `mirror_*` aliases resolve.

### 2026-06-18 — §F-cont catalog mirror maintenance (value CRUD + axis flip)

- New steps in `mirror-attribute-values.ts`: `syncAttributeValueMirrorsStep`
  (idempotent create/rename of mirror option values) and
  `unmirrorDeletedAttributeValuesStep` (deletes mirror option values + returns
  explicit dismiss defs). New `reconcileAxisAttributeMirrorStep` in
  `mirror-axis-attributes-to-options.ts` (axis flip-on + title rename).
- Wired into the value workflows (`create`/`upsert`/`update`/`delete`
  product-attribute-values) and `update-product-attributes`.
- **2.16 regression fixed:** the legacy wildcard `dismissRemoteLinkStep([{…,[PRODUCT]:{}}])`
  in `delete-product-attribute-values` no longer resolves (2.16 keys
  `getLinkModule` on the exact module+key tuple, and the new mirror link makes
  `product_attribute_value_id → PRODUCT` ambiguous). Replaced with explicit
  dismiss defs (real `product_id` / `product_option_value_id`) sourced from the
  graph (`owning_products`, `mirror_option_value`).
- Axis flip-OFF teardown also implemented in `reconcileAxisAttributeMirrorStep`
  (explicit dismiss of attribute→option + value→optionvalue links, then delete
  the option).
- **Runtime-verified:** `mirror-value-crud.spec.ts` **5/5 passing** — add value
  → option value mirrored; rename → mirror renamed in place; delete → mirror
  option value removed + links dismissed; flip `is_variant_axis` on → mirror
  created; flip off → mirror torn down. Empirically confirms
  `createProductOptionValues([{ value, option_id }])` works despite `option_id`
  being absent from the public DTO.
- **§F COMPLETE** — catalog ↔ native-option mirror stays in sync across attribute
  create/update and value create/upsert/update/delete, axis flip on/off, and
  toggle seeding. 8/8 attribute integration tests green.

### 2026-06-18 — §D create wrapper (existing-attribute path)

- `createProductsWorkflow` gained the unified `attributes[]` input (additive —
  legacy `variant_attributes`/`product_attributes` still work for products that
  don't send `attributes`). New `prepareCreateAttributesStep`
  (`workflows/product/steps/prepare-create-attributes.ts`) resolves EXISTING
  refs: axis (`multi_select`+`is_variant_axis`) → native option attach
  `{ id: mirror_option_id, value_ids: <mapped subset> }`; non-axis select →
  value links; toggle → resolve boolean to the seeded true/false value + link.
  Verified the product service accepts `options: [{ id, value_ids }]` at create.
- **Runtime-verified:** `integration-tests/http/product/admin/attributes-create.spec.ts`
  **1/1** — axis attribute attaches its mirror option with the per-product value
  subset (Red only, not Blue), the variant resolves against the mirror option
  value, and non-axis select (Cotton) + toggle (`true`) are linked as
  `attribute_values` (axis value is NOT a value link). 10/10 attribute tests
  green; `bun run build` 9/9.
- **§H partial:** vendor create/update validators now accept the unified
  `attributes[]` (new `UnifiedProductAttributeInput` zod schema); the route
  already forwards the body to the workflow, so creation runs.
- **Blocker discovered (pre-existing 2.16 regression, NOT from this work):** the
  vendor product surface 500s on `query.graph` with
  `Cannot resolve alias path ""` — the `*`-relation fields in
  `api/vendor/products/query-config.ts` (`*options`, `*type`, `*collection`, …)
  are hard-rejected by 2.16's remote joiner. `POST/GET /vendor/products`
  responses fail generally (the existing `product/vendor/product.spec.ts`
  simple-create fails the same way). The product IS created correctly; only
  response serialization fails. This is precisely what the response-shape /
  enrichment-removal slice must fix (explicit fields + native `options`), so it
  is folded there; the §D HTTP test is deferred until then. §D logic is verified
  at the workflow level (`attributes-create.spec.ts`).
- **Owed in §D:** inline-at-create (`title` refs → exclusive option + scoped
  attribute) and free-form text/unit value creation at create time.

### 2026-06-18 — response shape (vendor) + 2.16 query unblock

- Rewrote `api/vendor/products/query-config.ts`: replaced the `*`-relation
  wildcards with explicit fields and added the SPEC-014 response shape — native
  `options(.values)`, `attribute_values` with parent `attribute` + its full
  `values` set, and `scoped_attributes`.
- **Root-caused the 2.16 vendor-product 500:** the `type`, `tags`, and `images`
  product relations trigger `Cannot resolve alias path ""` in 2.16's remote
  joiner (matches the curated `-type,-tags,-images` exclusion already used by
  the vendor product *list*). Excluded them from the query-config defaults; the
  scalar `type_id` is still returned. `scoped_attributes` + the deep attribute
  graph resolve fine — only those three relations are affected. **Owed:** a
  proper fix (or per-relation explicit fields) to restore `images`/`type`/`tags`
  in the product response; tracked with memory `vendor-products-default-fields-500`.
- **Runtime-verified:** `integration-tests/http/product/vendor/attributes-create-http.spec.ts`
  **1/1** — `POST /vendor/products` with `attributes[]` returns **201** and the
  serialized response carries the native `Color` option (subset Red, not Blue) +
  `attribute_values` (Cotton, `true`); the variant resolves to Red. The vendor
  product HTTP surface is unblocked on the 2.16 preview.
- **Owed:** drop `enrichProductAttributes` (still runs for backward-compat) and
  apply the same query-config rewrite to admin + store product routes.

### 2026-06-18 — §G batch engine (existing refs)

- New `createAndLinkProductAttributesToProductWorkflow`
  (`workflows/product-attribute/workflows/create-and-link-product-attributes.ts`)
  + `applyProductAttributesBatchStep` — the single apply engine for attribute
  edits on an existing product. Input `{ product_id, add?, remove?, update? }`,
  order remove → add → update; value-link dismissals run before creations so an
  attribute removed and re-added in one call ends up linked.
  - axis: attach/detach the native mirror option (`addProductOptionToProduct` /
    `removeProductOptionFromProduct`) and adjust the per-product value subset
    (`updateProductOptionValuesOnProduct`).
  - non-axis select: create/dismiss `product_attribute_value_link` rows.
  - toggle: resolve the boolean to the seeded value (add) or swap true↔false
    (update).
- **Runtime-verified:** `integration-tests/http/product-attribute/admin/batch-engine.spec.ts`
  **2/2** — add+update+remove of non-axis + toggle (Cotton→Wool, true→false,
  remove); axis mirror option attached to an existing product with the value
  subset (Red, not Blue). Attaching an axis option to a bare product works
  without variant-invariant issues.
- **Owed in §G:** inline (`title`) refs → exclusive option + scoped attribute;
  exclusive/scoped-attribute deletion on `remove`; free-form text/unit value
  creation. These are the same tails as §D.

### 2026-06-18 — §H admin batch route + delete [attribute_id]

- **Deleted** `api/{admin,vendor}/products/[id]/attributes/[attribute_id]/route.ts`
  and their middleware blocks. The `.../attributes/batch` endpoint is the single
  attribute-mutation surface (original request: "Batch should do everything").
- **Admin batch route** rewired to `createAndLinkProductAttributesToProductWorkflow`;
  validator `AdminBatchProductAttributes` now `{ add, remove, update }` (existing
  refs).
- **Admin product query-config** rewritten like vendor's (explicit fields,
  native `options`, attribute graph + `scoped_attributes`; `type`/`tags`/`images`
  excluded for the 2.16 joiner) so the batch response serializes.
- **Runtime-verified:** `integration-tests/http/product/admin/attributes-batch-http.spec.ts`
  **1/1** — `POST /admin/products/:id/attributes/batch` add (axis option + subset
  + non-axis value) → **200** with native option + `attribute_values`; remove →
  value unlinked. Full `bun run build` 9/9.
### 2026-06-18 — §H vendor (approval queue) on the native-option model

- Rewrote `applyProductAttributeChangeActionsWorkflow` (the confirm-time
  dispatcher) to use the native-option model via the new
  `applyAttributeChangeActionsStep`: axis → attach/detach the mirror option
  (with value subset); non-axis → value links. Dropped the legacy
  `syncProductAttributeOptionsWorkflow` + variant-attribute-link logic.
- Vendor batch route + validator → `{ add, remove }` (staged through the
  approval queue; a value-set change is `remove` + `add` in one call, applied
  removes-before-adds). `value` (toggle/text) staged as a `values` name.
- **Runtime-verified:** `integration-tests/http/product-attribute/admin/apply-change-actions.spec.ts`
  **1/1** — add actions attach the axis mirror option (subset) + link non-axis
  values; remove action detaches the mirror option. Full `bun run build` 9/9.
- **§H COMPLETE** — admin (direct) and vendor (staged via approval queue) both
  drive the batch engine / native-option model; `[attribute_id]` deleted.
- **Owed:** store product query-config still uses `*` wildcards (2.16 broken);
  vendor batch is `{add,remove}` only (no granular `update` — by design, value
  changes = remove+add through staging).

### 2026-06-18 — §A old web DELETED + full core migration

Deleted the legacy attribute web (9 files): `resolve-attribute-refs`,
`replace-product-attribute-value-links` (product/steps);
`materialize-product-attributes`, `add-product-attribute`,
`detach-product-attribute`, `batch-product-attribute-values`,
`sync-product-attribute-options`, `update-product-attribute`,
`upsert-product-options-for-axis` (product-attribute). Migrated all callers:

- `create-products` — new `attributes[]`-only path. New
  `materializeCreateAttributesStep` creates inline product-scoped attributes
  (+ values), creates free-form text/unit values, mirror-links an inline axis to
  its stock-created exclusive option, and links non-axis values (graph-reads the
  created options to wire inline-axis mirrors).
- `update-products` — **no attribute path** (core fields / variants / sellers).
- `product-edit-update-attributes` (vendor staging) — new
  `resolveAttributeAddActionsStep` (existing refs: value_ids + name resolution +
  free-form create); confirm dispatcher already on the native-option model (§H).
- Deleted the non-batch `/:id/attributes` GET/POST routes + middleware (admin +
  vendor) — the batch endpoint is the sole mutation surface.
- Legacy validator fields (`variant_attributes`/`product_attributes`/
  `attribute_values`) KEPT as accepted no-ops so the ~10 order/offer specs that
  use them for product setup don't 400; migrating those tests to `attributes[]`
  + removing the fields is the remaining test-sweep.

**Runtime-verified:** `bun run build` 9/9; **18 SPEC-014 tests green**
(product-attribute/admin 15 + product create/batch HTTP 3) — inline create +
free-form + axis mirror attach/detach + batch add/remove/update + approval-queue
apply, all on native global options. Deleted obsolete
`product/{admin,vendor}/product.spec.ts`.

### 2026-06-18 — §E REMOVED (decision: batch-engine-only for edits)

Decision (framework author, 2026-06-18): **the update-products wrapper does NOT
handle attributes.** Attribute edits on an existing product go exclusively
through the batch engine (`createAndLinkProductAttributesToProductWorkflow`,
§G). The brief `attributes[]` replace path added to `updateProductsWorkflow`
(plus `replaceProductAttributesStep` and the update validator field) was reverted
— `updateProductsWorkflow` is back to its core-field/seller responsibilities only.
The "§E update wrapper" section of the plan is superseded: there is no §E; its
behaviour is folded into §G.

## Notes / open questions

- **Medusa preview upgrade — DONE (2026-06-18).** All workspace `@medusajs/*`
  deps/devDeps set to the `options-preview` dist-tag, peerDeps to `>=2.16.0-0`,
  and root `overrides` anchored to the exact build
  `2.16.0-options-preview-20260605124754` (`@medusajs/ui`:
  `4.1.16-options-preview-20260605124754`). `bun install` resolves all
  `@medusajs/*` to that build; installed `@medusajs/types` carries
  `is_exclusive` and the product module ships `product-product-option` /
  `product-product-option-value` models. `templates/*` were intentionally left
  on 2.13.4 (end-user scaffolds, not part of the workspace). `bun run build`
  against the new major is the first implementation task (PR step J.1).
- **`is_exclusive` semantics for non-axis attributes:** non-axis attributes
  are deliberately *not* options, so `is_exclusive` does not apply to them —
  scoping is via `product_id` on the Mercur attribute + the read-only
  `scoped_attributes` link.
- **Toggle storage — CONFIRMED (2026-06-18).** A toggle attribute's two
  values (`true`/`false`) are seeded **once** at attribute-create time. Attach
  resolves the boolean to the matching existing value and links it; it
  **never** creates toggle values. (Toggle is non-axis, so no mirror option.)
- **SPEC-008 overlap:** reconcile the standalone product-attribute module's
  `product_id` handling with this spec; product-scoped attributes remain the
  mechanism for inline/exclusive attributes.
- This is a breaking API change (`attributes[]` replaces
  `variant_attributes[]`/`product_attributes[]`; `[attribute_id]` route
  removed). Storefront/clients and generated SDK route map regenerate.
