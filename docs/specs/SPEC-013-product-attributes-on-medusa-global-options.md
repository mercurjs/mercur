---
status: in_progress
canonical: false
priority: 3
area: core/product-attribute
created: 2026-06-17
last_updated: 2026-06-17
---

# SPEC-013 Back Product Attributes with Medusa Global Product Options

Migrate Mercur's variant-axis product attributes off the bespoke
option-synthesis machinery and onto **Medusa's native global product
options** (the many-to-many `Product ↔ ProductOption` model shipped in the
Medusa "options-preview" line). The Mercur `ProductAttribute` /
`ProductAttributeValue` models **stay** — they remain the marketplace
metadata layer (type, filterable, required, category scoping, ranking,
storefront semantics). What changes is the *storage and option behaviour
underneath*: instead of Mercur maintaining its own value-link tables and a
`syncProductAttributeOptionsWorkflow` that mirrors attributes into stock
options, variant-axis attributes become a thin projection over native
global product options.

This spec has a hard prerequisite (Phase 0): **bump the entire repo's
Medusa dependency to the options-preview version** that ships global
product options (`@medusajs/* 2.13.4` → the `2.16.x` options-preview
line). Nothing else in this spec can land until that bump is green.

> **Source feature**: "Announcing global product options in Medusa" —
> https://medusajs.com/blog/announcing-global-product-options-in-medusa/
> Reference implementation read from the local Medusa checkout at
> `/Users/viktorholik/Desktop/medusa` (branch
> `chore/add-many-to-many-between-product-and-option`, version `2.15.5`,
> feature lands as `2.16.0`).

It is **descriptive about intent** and **prescriptive about the contract**:
every existing HTTP behaviour proven by the integration suites
(`integration-tests/http/product/{admin,vendor}/product.spec.ts` and
`integration-tests/http/product-attribute/admin/product-attribute.spec.ts`)
must continue to pass unchanged. The API shape is frozen; only the
implementation underneath moves.

---

## The crux: which attributes can become options

Medusa's new global option model is **still variant-coupled**. Even with
the new per-product value subset (`ProductProductOption` /
`ProductProductOptionValue`), `ProductModuleService.validateProductPayload`
requires that **every variant carries a value for every option attached to
the product**:

- `packages/modules/product/src/services/product-module-service.ts:3047`
  — `options.forEach(... !variant.options?.[option.title] → missing)`
  throws `"… has variants with missing options"`.
- `…:3268` — the count of provided variant option values must equal the
  number of product options, else
  `"Product has N option values but there were M provided …"`.

That is exactly the constraint Mercur built its own attribute layer to
escape: native options are *always* variant axes, whereas Mercur needs
attributes that are informational / filterable but **do not** define
variants.

**Consequence — the split is mandatory, not stylistic:**

| Mercur attribute kind | Today | Target backing |
| --- | --- | --- |
| `is_variant_axis = true` (single/multi select) | Mercur value-link + `syncProductAttributeOptionsWorkflow` mirrors into a stock option | **Native Medusa global `ProductOption`** (`is_exclusive=false`), attached to the product with a per-product value subset |
| `is_variant_axis = false` (text / unit / toggle / non-axis select; filterable, required) | Mercur value-link `product_attribute_value_link` | **Unchanged** — stays on the Mercur value-link path (cannot be a Medusa option without forcing variant values) |

This spec therefore recommends a **hybrid** migration: move variant-axis
attributes onto native global options, leave informational attributes on
the existing Mercur link table. See **Open decision D1** for the
alternative (force *all* attributes onto options by patching Medusa
variant validation) and why it is not the default.

---

## What exists today (Mercur attribute system)

Module — `packages/core/src/modules/product-attribute/`:

- **`ProductAttribute`** (`models/product-attribute.ts`): `name`,
  `handle` (unique), `description`, `type` (`single_select` |
  `multi_select` | `unit` | `toggle` | `text`), `is_required`,
  `is_filterable`, `is_variant_axis`, `rank`, `is_active`, `created_by`,
  `product_id` (**nullable** — `null` = global, set = product-scoped /
  "inline"), `metadata`. `hasMany values`.
- **`ProductAttributeValue`** (`models/product-attribute-value.ts`):
  `name`, `handle` (unique per attribute), `rank`, `is_active`,
  `attribute_id`, `metadata`. `belongsTo attribute`.

Links — `packages/core/src/links/`:

- `product-attribute-value-link.ts` → pivot `product_attribute_value_link`
  (Product ↔ ProductAttributeValue). **The core "this product selected
  this value" table**, surfaced as `product.attribute_values`.
- `product-attribute-product-link.ts` → read-only via
  `ProductAttribute.product_id`, surfaced as `product.scoped_attributes`.
- `product-attribute-category-link.ts` → pivot
  `product_category_attribute` (ProductCategory ↔ ProductAttribute).
- `product-variant-attribute-link.ts` /
  `product-variant-attribute-value-link.ts` → variant-axis pivots.

Workflows — `packages/core/src/workflows/product-attribute/` (20+):
`createProductAttributes`, `addProductAttribute`,
`materializeProductAttributes`, `batchProductAttributeValues`,
`detachProductAttribute`, **`syncProductAttributeOptions`** (mirrors
variant-axis attributes into stock product options — the central piece
this spec deletes), plus value CRUD/upsert.

API — `packages/core/src/api/{admin,vendor,store}/`:

- `product-attributes/` — global attribute CRUD + value CRUD (admin),
  read-scoped to `product_id: null` (vendor), read-only (store).
- `products/[id]/attributes/` — list, attach (`POST`), update
  (`POST :attribute_id`), detach (`DELETE :attribute_id`), and `batch`.
  Admin mutates synchronously (`200`/`201`); vendor stages a
  `ProductChange` (`202`) via `productEditUpdateAttributesWorkflow`.

Response enrichment — `packages/core/src/api/utils/format-product-attributes.ts`
(`enrichProductAttributes`) surfaces, per product:
`attributes[].values` (selected on this product) and
`attributes[].all_values` (the attribute's full value set, for dropdowns).

UI — admin `packages/admin/src/pages/attributes/*` (define attributes +
values) and `packages/admin/src/pages/products/product-{create,edit,add-existing}-attribute/*`
(assign to product); vendor `packages/vendor/src/pages/products/[id]/attributes/*`;
shared input switch `components/inputs/attribute-value-input/*`. Hooks in
`packages/{admin,vendor}/src/hooks/api/{product-,}attributes.tsx`.

## What Medusa now provides (global product options)

From the options-preview checkout:

- **`ProductOption`** is now global: `is_exclusive` (bool, default
  `false`), `title`, `metadata`, **many-to-many `products`** via pivot
  `ProductProductOption`, `hasMany values`.
- **`ProductOptionValue`** gains `rank` (nullable, ordered display).
- **`ProductProductOption`** (`product_product_option`) — pivot Product ↔
  ProductOption, itself `hasMany values` via
  **`ProductProductOptionValue`** (`product_product_option_value`) — the
  **per-product subset** of an option's values. This is the native
  equivalent of `product_attribute_value_link`.
- `is_exclusive=true` marks legacy single-product options (what product
  creation produces); `false` marks reusable/global options. **Global →
  exclusive transition is forbidden** by the service.
- Admin API: `GET/POST /admin/product-options`,
  `GET/POST/DELETE /admin/product-options/:id`
  (`packages/medusa/src/api/admin/product-options/*`); attach/detach per
  product via `POST /admin/products/:id/options/batch`. Store API:
  `GET /store/product-options[/:id]`.
- Workflows: `createProductOptionsWorkflow`,
  `updateProductOptionsWorkflow`, `deleteProductOptionsWorkflow`, and
  **`setProductProductOptionsWorkflow`** (`add` / `remove` / `update`
  options *and their per-product value subsets* for a product — the
  native replacement for Mercur's attach/detach/batch value plumbing).
- Migrations: `Migration20251022153442` (pivot + `is_exclusive`, drops
  `product_option.product_id`), `Migration20251110180907` (value pivot),
  `Migration20251113183352` (populate), `Migration20251029150809`
  (value `rank`).

---

## Target architecture

### Model mapping

```
Mercur ProductAttribute (is_variant_axis=true, global)   1─1   Medusa ProductOption (is_exclusive=false)
Mercur ProductAttributeValue                              1─1   Medusa ProductOptionValue (carry rank)
product_attribute_value_link (variant-axis selection)     →    ProductProductOption + ProductProductOptionValue
syncProductAttributeOptionsWorkflow                        →    DELETED (variant axes are now native options)
```

- Add a link `ProductAttribute ↔ ProductOption` and
  `ProductAttributeValue ↔ ProductOptionValue` so the Mercur metadata row
  and the Medusa option/value stay paired (1:1). The Mercur row keeps
  what Medusa options lack: `type`, `is_filterable`, `is_required`,
  `is_variant_axis`, `description`, `created_by`, category scoping.
- A variant-axis attribute's per-product selection is expressed as the
  product being attached to the option with a `ProductProductOptionValue`
  subset — no more Mercur-owned value-link rows for variant axes, no more
  sync workflow.
- **Informational (non-axis) attributes stay exactly as they are** on
  `product_attribute_value_link`. Their CRUD, enrichment, and vendor
  staging are untouched by this spec.

### Workflow mapping (variant-axis path only)

| Mercur workflow (today) | Target |
| --- | --- |
| `createProductAttributes` (axis) | create Mercur metadata row **+** `createProductOptionsWorkflow` (global), link the two |
| `addProductAttribute` / `batchProductAttributeValues` (axis) | `setProductProductOptionsWorkflow({ add/update })` for the value subset |
| `detachProductAttribute` (axis) | `setProductProductOptionsWorkflow({ remove })` |
| `syncProductAttributeOptions` | **deleted** |
| value upsert (axis) | `updateProductOptionsWorkflow` (values + ranks) |

Vendor flows keep staging through `ProductChange` (`202`); only the step
that previously synthesised options is swapped for the native one.

### API contract — frozen

No route, payload, status code, or response field changes. In particular
the enriched product response must keep emitting, for variant-axis
attributes now backed by options:

- `product.options[]` with `title = attribute.name` and `values[]` = the
  product's selected subset (was synthesised, now read from
  `ProductProductOptionValue`).
- `product.attributes[]` with `is_variant_axis: true`, `values` (selected)
  and `all_values` (full option value set), read through the new links by
  `enrichProductAttributes`.

`product-scoped` (inline) variant-axis attributes map to global options
created on the fly and attached to a single product; they must still be
**hidden from `GET /{admin,vendor}/product-attributes`** (the global
catalogue filter stays `product_id: null`).

---

## Phases

**Phase 0 — Medusa options-preview bump (prerequisite, blocking).**
Raise every `@medusajs/*` pin from `2.13.4` to the options-preview
`2.16.x` line across the root `package.json` catalog,
`packages/core`, `packages/types`, `apps/api`, the dashboard packages,
and the Stripe provider (peer pin in `docs/PRODUCT.md` says framework is
pinned to `2.13.4` — update that note too). `bun install`,
`bun run build`, and the **existing** integration suites must be green on
the new version *before any attribute work begins*. Capture any unrelated
breakages from the major-ish bump separately; do not fold them into the
attribute migration.

**Phase 1 — Links + metadata pairing.** Add the
`ProductAttribute ↔ ProductOption` and
`ProductAttributeValue ↔ ProductOptionValue` links and the migration that
backfills them for existing variant-axis attributes (create a global
option per axis attribute, option values per attribute value, pivot rows
per existing `product_attribute_value_link` selection). Idempotent,
re-runnable.

**Phase 2 — Workflow swap (variant-axis).** Reroute the variant-axis
branches of create/add/batch/detach/upsert through the native option
workflows; **delete `syncProductAttributeOptionsWorkflow`** and the
`product-variant-attribute*` links it fed. Non-axis branches untouched.

**Phase 3 — Enrichment.** Update `enrichProductAttributes` to read
variant-axis selections from `ProductProductOptionValue` (and `all_values`
from `ProductOptionValue`), while still reading non-axis selections from
`product_attribute_value_link`. Output shape unchanged.

**Phase 4 — UI.** No user-visible change intended. Verify the admin/vendor
attribute pages and the product attribute assignment surfaces still
render and mutate correctly against the rerouted backend; adjust hooks
only if a field path moved.

**Phase 5 — Data migration + cleanup.** Production backfill script
(mirrors Phase 1 migration), remove dead Mercur option-sync code paths,
update `docs/PRODUCT.md` / `docs/ARCHITECTURE.md` framework-version notes.

---

## User-Visible Behavior

Identical to today for every audience:

- **Admin** defines global attributes and values, marks them
  variant-axis / filterable / required, scopes to categories, and assigns
  them to products — same pages, same results.
- **Vendor** selects existing global attributes or creates inline ones on
  a product; variant-axis selections drive variant options; changes stage
  as `ProductChange`.
- **Storefront** sees the same product `options`, `attributes`,
  `values`, and `all_values`.

The only intended observable difference is internal: variant-axis options
created by Mercur are now real, reusable Medusa global options
(`is_exclusive=false`) and appear in `GET /admin/product-options`.

## Verification

Run from repo root with `bun`.

1. **Phase 0 gate**: after the version bump, `bun install`,
   `bun run build`, and the full product + product-attribute HTTP suites
   pass on the options-preview line.
2. **Contract preservation** (the core acceptance gate): the existing
   suites pass **unmodified** —
   - `bun run test:integration:http -- product/admin/product.spec.ts`
   - `bun run test:integration:http -- product/vendor/product.spec.ts`
   - `bun run test:integration:http -- product-attribute/admin/product-attribute.spec.ts`
   These already cover: variant-axis option synthesis (option
   title=attribute name, values=selected subset, variants not
   regenerated), non-axis attributes producing **no** option, inline vs
   global scoping (inline hidden from the global catalogue), detach
   removing the matching option, batch attach/detach, free-form
   unit/text value upsert, `values` vs `all_values`, and vendor `202`
   staging. None of these assertions may be relaxed.
3. **New coverage**: a variant-axis attribute attached to a product
   appears in `GET /admin/product-options` as `is_exclusive=false` and is
   reusable across a second product with an independent value subset
   (proving the global-option backing, not per-product synthesis).
4. `bun run build` passes; `bun run lint` shows no new errors in changed
   files (baseline is red — see `[[lint-preexisting-failures]]`).

## Evidence

**Phase 0 + first Phase 2 slice (PR #1, 2026-06-17).**

- Medusa bumped repo-wide to `2.16.0-options-preview-20260605124754`
  (UI `4.1.16-options-preview-…`) via the root `overrides` block + every
  workspace `package.json` (106 pins). `bun install` green.
- `bun run build`: **9/9 tasks, exit 0.** Three breakages from the bump
  fixed:
  - `cart/steps/prepare-adjustments-from-promotion-actions.ts` — new
    required `skippedPromoCodes` field on the step output.
  - `api/vendor/products/validators.ts` — `WithAdditionalData` callback
    return type tightened to `ZodObject` (runtime-safe cast).
  - `product-attribute/steps/upsert-product-options-for-axis.ts` —
    rewritten off the dropped `product_option.product_id` onto the new
    global-options API.
- Option-model rewrite (variant-axis synthesis on the new model):
  - `upsert-product-options-for-axis.ts` → `createProductOptions`
    (`is_exclusive: true`) + `addProductOptionToProduct` +
    `updateProductOptionValuesOnProduct`.
  - New `detach-and-delete-product-options.ts` step: delete dependent
    variants → `removeProductOptionFromProduct` → `deleteProductOptions`
    (the new model guards both the unassign and the delete).
  - `update-products.ts` no longer forwards synthesised axis `options` to
    the stock update (value-subset selection lives in the attribute value
    links).
- **Contract suites green (unmodified):**
  - `product-attribute/admin/product-attribute.spec.ts` — 4/4.
  - `product/admin/product.spec.ts` — 30/30.
  - `product/vendor/product.spec.ts` — 27/27.

**Still open (later PRs):** Phase 1 (ProductAttribute↔ProductOption 1:1
link + backfill so axis options are reusable rather than per-product
exclusive), the new reuse coverage test, Phase 3 enrichment read-path
migration, Phase 4 UI verification, Phase 5 production data migration.

## Notes

**Open decision D1 — hybrid vs. all-attributes-on-options.** This spec
recommends the **hybrid** (variant-axis → native options; non-axis stays
on the Mercur link table) because Medusa still couples every attached
option to every variant (see *The crux*). The alternative — force *all*
attributes onto global options — requires patching/forking Medusa's
`validateProductPayload` so non-axis options don't demand variant values,
which is high-risk against an upstream preview that is still moving. If
the product owner wants a single unified backing, that becomes its own
spec with a Medusa-core change as a dependency.

**Open decision D2 — `rank` / `handle` / `metadata` ownership.** Medusa
options now carry value `rank`; Mercur values also have `rank` and
`handle`. Decide the source of truth (recommend: Mercur row stays
canonical for marketplace metadata, mirror `rank` into the option value
for storefront ordering).

**Risks.**
- The Medusa target is an unreleased *preview* branch (`2.16.0`); pin to
  a specific published preview tag and re-verify the model/API shape
  before Phase 1 — fields cited here (`is_exclusive`, `ranks`,
  `ProductProductOptionValue`) are read from a moving branch.
- Phase 0 is effectively a minor-version Medusa upgrade across the whole
  monorepo and may surface unrelated breakages; keep it isolated and
  green before touching attributes.
- Category-attribute association (`product_category_attribute`) and the
  promotions `rule-attribute-options` surfaces consume attributes and
  must be regression-checked even though they are out of direct scope.

**Out of scope.** Non-axis attribute storage changes; inventory-item
logistics fields (`width/height/length/weight/...`, a separate concern);
search/Algolia reindex semantics beyond confirming filterable attributes
still index.

**Related.** Builds on the SDK route-based client pattern; UI work must
follow `docs/UI-ARCHITECTURE.md`. Coordinates with any in-flight product
work touching `enrichProductAttributes`.
