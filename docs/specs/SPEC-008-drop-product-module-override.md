---
status: in_progress
canonical: true
priority: 1
area: core/product
created: 2026-05-27
last_updated: 2026-05-28
implementation_step: 4e_mirror_rename_workflows_and_subscribers_landed
---

# SPEC-008 Drop Mercur Product Module Override, Split Into `product-attribute` and `product-change`

> Design note (2026-05-28): there are only two new modules:
> `product-attribute` and `product-change`. `ProductBrand` is **dropped
> entirely** — brand becomes a category-scoped `ProductAttribute` with
> `handle = "brand"` (see "Drop `ProductBrand`" below). The legacy
> marketplace product-status extension (`requires_action`) and the
> `is_restricted` flag on both `Product` and `ProductCategory` are
> **dropped** — see "Computed fields: `requires_action`" and "Drop
> `is_restricted` from `ProductCategory`" below. `created_by` /
> `created_by_actor` already live on `ProductChange`, so no augment
> table is required.

## Why this exists

Mercur currently ships a complete *override* of Medusa's stock Product module
at `packages/core/src/modules/product/`. The override is registered before
`@mercurjs/core` in `withMercur()` so that `container.resolve(Modules.PRODUCT)`
returns the Mercur subclass, and the type shim from SPEC-006
(`.mercur/types.d.ts`) re-declares `ModuleImplementations.product` against
`MercurProductModuleService`.

That override does four orthogonal things, fused into one module:

1. **Re-defines stock Medusa entities** (`Product`, `ProductVariant`,
   `ProductCategory`, `ProductCollection`, `ProductTag`, `ProductType`,
   `ProductImage`, `ProductVariantProductImage`) with computed
   `manage_inventory`/`allow_backorder` constants on the variant and
   slug/handle semantics on category. The legacy `status` enum
   extension (`requires_action`) and the `is_restricted` flag on
   product are **dropped** — `requires_action` becomes a computed
   field derived from `ProductChange` (see "Computed fields:
   `requires_action`" below).
2. **Adds product attribute entities** — `ProductAttribute`,
   `ProductAttributeValue` — with three independent product-side
   relationships: `Product.custom_attributes` (1:N owned by a product —
   **dropped in this spec**, see migration below),
   `Product.variant_attributes` (M:N variant-axis attributes), and
   `Product.attribute_values` (M:N selected values).
3. **Adds product-change entities** — `ProductChange`, `ProductChangeAction`
   — to record the vendor approval lifecycle (`PENDING` →
   `REQUIRES_ACTION` / `CONFIRMED` / `DECLINED` / `CANCELED`).
   `REQUIRES_ACTION` is the state admin sets when the vendor must
   update the product (e.g., add a description). `created_by` already
   lives on this entity.
4. **Adds product-brand entity** — `ProductBrand` with a seller
   whitelist link. **Dropped in this spec.** Brand collapses into
   `ProductAttribute` with `handle = "brand"` (see "Drop
   `ProductBrand`" below); the seller whitelist is dropped along with
   `ProductCategory.is_restricted`.

Fusing all of this into the stock Medusa module means **every Mercur project
loses access to stock Medusa product features** (`ProductOption` /
`ProductOptionValue` are missing entirely, native `manage_inventory` is
hard-coded `false`, stock workflows can't be reused because `MedusaService`
generated methods point at Mercur's entities). It also forces every
Mercur-side workflow that touches a product to import
`ProductModuleService` from the Mercur module instead of going through
Medusa's standard workflow surface.

The override is also opaque to downstream blocks: a block author who wants
to drop in a stock-Medusa-shaped Product surface gets Mercur's surface
silently. The build-time type shim (SPEC-006) helps with TypeScript but it
does not make the modules behaviorally identical.

This spec retires the Mercur Product module entirely. It splits the four
fused responsibilities into:

- **Stock `@medusajs/medusa/product`** — owns `Product`, `ProductVariant`,
  `ProductOption`, `ProductOptionValue`, `ProductCategory`,
  `ProductCollection`, `ProductTag`, `ProductType`, `ProductImage`. No
  Mercur subclass.
- **New `product-attribute` module** — owns `ProductAttribute` and
  `ProductAttributeValue`. Wired to stock `Product`, `ProductVariant`,
  and `ProductCategory` through Module Links — no entity-level
  relations cross the module boundary. Brand is modeled as a
  category-scoped `ProductAttribute` (`handle = "brand"`,
  `type = SINGLE_SELECT`), not a separate entity.
- **New `product-change` module** — owns `ProductChange`,
  `ProductChangeAction`. Wired to `Product` through a Module Link. The
  status enum is extended to include `REQUIRES_ACTION` (admin asking
  vendor for follow-up work).

No marketplace-only augment table on `Product`. The previous
`requires_action` value of the product-status enum is replaced by a
**computed field** that scans linked `ProductChange` rows — see
"Computed fields: `requires_action`" below. `is_restricted` is removed
entirely. `created_by` / `created_by_actor` already exist on
`ProductChange`, so they are not duplicated on the product side.

Compatibility shape for vendor / admin / store query configs (see
`packages/core/src/api/vendor/products/query-config.ts:32-41`) is
preserved for `*variant_attributes`, `*attribute_values`,
`*variants.attribute_values` and `*variants.attribute_values.attribute`
field paths through Module-Link aliases. The `*custom_attributes` path
is **removed** — product-scoped custom attributes are migrated to stock
Medusa `ProductOption` / `ProductOptionValue` (queried via
`*options,*options.values`). The new modules' linkable names are chosen
so the remaining field-tree strings are valid against the joiner config
without rewriting every route's query config.

## Target architecture

```
+---------------------------------------------------------+
|              @medusajs/medusa/product                   |
|  Product, ProductVariant, ProductOption,                |
|  ProductOptionValue, ProductCategory, ProductCollection,|
|  ProductTag, ProductType, ProductImage                  |
+---------------------------------------------------------+
                |                              |
                | links                        | links
                v                              v
+----------------------------------------+  +------------------+
| product-attribute                      |  | product-change   |
|   ProductAttribute                     |  | ProductChange    |
|   ProductAttributeValue                |  | ProductChange    |
|   (brand = ProductAttribute            |  |   Action         |
|    with handle = "brand")              |  +------------------+
+----------------------------------------+
                |
                | link aliases:
                |   product.variant_attributes
                |   product.attribute_values
                |   product_variant.attribute_values
                |   product.changes (used by requires_action util)
                v
+---------------------------------------------------------+
|       Module Links (packages/core/src/links/)           |
|  - product-variant-attribute-link.ts                    |
|  - product-attribute-value-link.ts                      |
|  - product-variant-attribute-value-link.ts              |
|  - product-attribute-category-link.ts                   |
|  - product-change-link.ts (Product <-> ProductChange)   |
+---------------------------------------------------------+
```

### Module: `product-attribute`

Location: `packages/core/src/modules/product-attribute/`.

**Joiner config.** Required for every link file under "Module Links"
to resolve its `linkable.*` exports. Pattern-match
`medusa/packages/modules/payment/src/joiner-config.ts`:

```ts
// packages/core/src/modules/product-attribute/joiner-config.ts
import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import ProductAttribute from "./models/product-attribute"
import ProductAttributeValue from "./models/product-attribute-value"

export const joinerConfig = defineJoinerConfig(Modules.PRODUCT_ATTRIBUTE, {
  linkableKeys: {
    product_attribute_id: ProductAttribute.name,
    product_attribute_value_id: ProductAttributeValue.name,
  },
})
```

`Modules.PRODUCT_ATTRIBUTE` is added to a Mercur-side `Modules` const
(exported from `@mercurjs/types`) since stock Medusa's `Modules` enum
doesn't carry marketplace-only module identifiers. The same string
literal (`"productAttribute"`) is what surfaces as
`productAttributeModule.linkable.productAttribute` in the link files.

Models:

- `ProductAttribute` — id, handle, name, description, type, is_required,
  is_filterable, is_variant_axis, rank, is_active, created_by, metadata.
  **Dropped from this model**: every `product`, `variant_products`,
  `categories` relation — those become module links.
- `ProductAttributeValue` — id, handle, name, rank, is_active, metadata,
  `attribute: belongsTo(ProductAttribute, { mappedBy: "values" })`.
  **Dropped**: the `variants` and `products` M:N relations.
There is **no** `ProductBrand` model. Brand is a category-scoped
`ProductAttribute` (`handle = "brand"`, `type = SINGLE_SELECT`),
selected per product via the same `product_attribute_value_link`
pivot that backs every other attribute. See "Drop `ProductBrand`"
below for the migration of existing brand rows.

Service: `ProductAttributeModuleService` exposes CRUD for both
entities (attributes, values). No product/variant/category mutations.

Joiner aliases exported as `Module.linkable.productAttribute` and
`Module.linkable.productAttributeValue`.

#### Workflows and steps owned by `product-attribute`

This module operates on `ProductAttribute` / `ProductAttributeValue`
rows. The Module Link pivots that join them to stock `Product` /
`ProductVariant` / `ProductCategory` are written through the **stock**
`createRemoteLinkStep` from `@medusajs/medusa/core-flows` — there are
no module-specific link-writer steps. Composition is exactly the
shape of `medusa/packages/core/core-flows/src/product/workflows/create-products.ts:203-221`:

```ts
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

const links = transform(
  { createdProducts, input },
  ({ createdProducts, input }) =>
    createdProducts.flatMap((p, i) =>
      (input.products[i].attribute_value_ids ?? []).map((value_id) => ({
        [Modules.PRODUCT]: { product_id: p.id },
        productAttribute: { product_attribute_value_id: value_id },
      }))
    )
)

createRemoteLinkStep(links)
```

The module never mutates stock product entities directly; that is
left to the wrapper that composes it.

Classification rule (mirrors stock Medusa core-flows):

- **Step** — single atomic operation: one query, one mutation, one
  validation. No compensation that spans multiple writes. Lives
  under `packages/core/src/workflows/product-attribute/steps/`.
  Pattern-match `medusa/packages/core/core-flows/src/product/steps/`.
- **Workflow** — composition of two or more steps (validator step
  + mutation step + `emitEventStep` + `createHook`), or fan-out
  across many rows with compensation. Lives under
  `packages/core/src/workflows/product-attribute/workflows/`.
  Pattern-match `medusa/packages/core/core-flows/src/product/workflows/`.

Naming: kebab-case files (`create-product-attributes.ts`), kebab-case
workflow IDs (`"create-product-attributes"`), constants suffixed with
`Workflow` / `Step`.

| Name | Kind | Purpose |
|---|---|---|
| `createProductAttributesWorkflow` | workflow | `validateProductAttributeInputStep` → `createProductAttributesStep` → `createRemoteLinkStep` (category links if provided) → `emitEventStep` → `createHook("productAttributesCreated", …)`. Mirrors `createProductsWorkflow` shape. |
| `updateProductAttributesWorkflow` | workflow | `validate...Step` → `updateProductAttributesStep` → `emitEventStep("product-attribute.updated")` → `createHook("productAttributesUpdated", …)`. The emitted event is what triggers the rename-propagation subscriber. |
| `deleteProductAttributesWorkflow` | workflow | `validateProductAttributeNotMirroredStep` (soft-block via `product_option_attribute_link`) → `dismissRemoteLinkStep` (drop link rows) → `deleteProductAttributesStep` → `emitEventStep` → `createHook("productAttributesDeleted", …)`. |
| `createProductAttributeValuesWorkflow` | workflow | `validateAttributeAcceptsValuesStep` → `createProductAttributeValuesStep` → `emitEventStep` → `createHook("productAttributeValuesCreated", …)`. |
| `updateProductAttributeValuesWorkflow` | workflow | `validateAttributeAcceptsValuesStep` → `updateProductAttributeValuesStep` → `emitEventStep("product-attribute-value.updated")` → `createHook(…)`. |
| `deleteProductAttributeValuesWorkflow` | workflow | `validateProductAttributeValueNotMirroredStep` (soft-block via `product_option_value_attribute_value_link`) → `dismissRemoteLinkStep` → `deleteProductAttributeValuesStep` → `emitEventStep` → `createHook(…)`. |
| `upsertProductAttributeValuesWorkflow` | workflow | Idempotent create-or-update; mirrors stock `upsertVariants` shape if/where applicable. |
| `batchProductAttributesWorkflow` | workflow | `parallelize(when(...).then(create), when(...).then(update), when(...).then(delete))` — verbatim shape of `medusa/packages/core/core-flows/src/product/workflows/batch-products.ts:95-116`. |
| `mirrorProductAttributeRenameWorkflow` | workflow | Subscriber-triggered. `useQueryGraphStep` → fan-out via `transform` → stock `updateProductOptionsWorkflow.runAsStep` → `updateProductOptionAttributeLinkFingerprintStep` → `emitEventStep`. |
| `mirrorProductAttributeValueRenameWorkflow` | workflow | Same shape as above for `ProductOptionValue.value`. **No stock per-value workflow exists** — `updateProductOptionsWorkflow` only accepts a flat `values: string[]` that would re-create the entire value set (destroying variant identity anchored to `ProductOptionValue.id`). Mercur ships `updateProductOptionValuesStep` (below) that calls `productModuleService.updateProductOptionValues` directly, preserving ids. |
| `reconcileMirroredOptionsWorkflow` | workflow | Scheduled / on-demand. Walks the two mirror link tables, recomputes fingerprints, runs the mirror workflows on drift. |
| `validateProductAttributeInputStep` | step | Pure validator. Pattern-match `medusa/packages/core/core-flows/src/product/workflows/create-products.ts:73-91 validateProductInputStep`. Throws `MedusaError(INVALID_DATA)`; no revert. |
| `validateAttributeAcceptsValuesStep` | step | Pure validator — type/whitelist check. Same shape as above. |
| `validateProductAttributeNotMirroredStep` | step | Pure validator. Loads `product_option_attribute_link` rows; throws if any reference this attribute. |
| `validateProductAttributeValueNotMirroredStep` | step | Pure validator. Same shape for `product_option_value_attribute_value_link`. |
| `createProductAttributesStep` | step | Module mutation. Pattern-match `medusa/packages/core/core-flows/src/product/steps/create-products.ts`: resolve `Modules.PRODUCT_ATTRIBUTE`, call service, return `StepResponse(created, createdIds)` with delete revert. |
| `updateProductAttributesStep` | step | Module mutation. Same shape — captures before-state for revert. |
| `deleteProductAttributesStep` | step | Module mutation. Soft-delete with restore revert. |
| `createProductAttributeValuesStep` | step | Module mutation. |
| `updateProductAttributeValuesStep` | step | Module mutation. |
| `deleteProductAttributeValuesStep` | step | Module mutation. |
| `updateProductOptionAttributeLinkFingerprintStep` | step | Module mutation. Updates `fingerprint` column on the link row after a successful propagation. |
| `updateProductOptionValuesStep` | step | Module mutation. Resolves `Modules.PRODUCT`, calls `productModuleService.updateProductOptionValues({ id, value })` for each linked `ProductOptionValue`. Revert restores the prior `value`. Exists because no stock per-value update workflow does — `updateProductOptionsWorkflow` would clobber `ProductOptionValue.id` identity. |

**Module Link writes** (never their own steps in this module — all go
through stock `createRemoteLinkStep` / `dismissRemoteLinkStep`):

| Target pivot | Module keys passed to `createRemoteLinkStep` |
|---|---|
| `product_attribute_value_link` | `[Modules.PRODUCT]: { product_id }, productAttribute: { product_attribute_value_id }` |
| `product_variant_attribute_value` | `[Modules.PRODUCT]: { variant_id }, productAttribute: { product_attribute_value_id }` |
| `product_attribute_category_link` | `[Modules.PRODUCT]: { product_category_id }, productAttribute: { product_attribute_id }` |
| `product_option_attribute_link` | `[Modules.PRODUCT]: { product_option_id }, productAttribute: { product_attribute_id }` (with `data: { fingerprint }`) |
| `product_option_value_attribute_value_link` | `[Modules.PRODUCT]: { product_option_value_id }, productAttribute: { product_attribute_value_id }` (with `data: { fingerprint }`) |

The `data` field on `LinkDefinition` carries the link-row payload
(`fingerprint`); see
`medusa/packages/core/core-flows/src/common/steps/create-remote-links.ts`
for the call site.

All "delete" workflows above are soft-blocking — the first step is a
validator that raises before any write if dependent link rows exist.
The rename-propagation pair is invoked from subscribers, never
directly from a route; the reconciliation workflow is the manual /
scheduled escape hatch when a subscriber missed an event.

Every workflow above ends with a `createHook("<name>Created" |
"<name>Updated" | "<name>Deleted", payload)` and returns
`new WorkflowResponse(result, { hooks: [hook] })` — mirroring
`medusa/packages/core/core-flows/src/product/workflows/create-products.ts:281-289`
so consumers can extend behavior via subscribers without modifying
the workflow.

### Module: `product-change`

Location: `packages/core/src/modules/product-change/`.

**Joiner config.** Required for `product-change-link.ts` to resolve
its `linkable.productChange` export:

```ts
// packages/core/src/modules/product-change/joiner-config.ts
import { defineJoinerConfig, Modules } from "@medusajs/framework/utils"
import ProductChange from "./models/product-change"
import ProductChangeAction from "./models/product-change-action"

export const joinerConfig = defineJoinerConfig(Modules.PRODUCT_CHANGE, {
  linkableKeys: {
    product_change_id: ProductChange.name,
    product_change_action_id: ProductChangeAction.name,
  },
})
```

`Modules.PRODUCT_CHANGE` is added to the same Mercur-side `Modules`
const as `PRODUCT_ATTRIBUTE` above. The string literal
(`"productChange"`) surfaces as
`productChangeModule.linkable.productChange` in the link file.

Models:

- `ProductChange` — id, status (`PENDING` | `REQUIRES_ACTION` |
  `CONFIRMED` | `DECLINED` | `CANCELED`), internal_note, external_note,
  created_by, confirmed_by, confirmed_at, declined_by, declined_at,
  declined_reason, canceled_by, canceled_at, requires_action_by,
  requires_action_at, requires_action_reason, metadata, `actions:
  hasMany(ProductChangeAction)`. **Dropped**: the `product` belongsTo
  relation — becomes a module link. The `REQUIRES_ACTION` status is
  the signal "admin asked the vendor to do additional work on this
  product"; the existence of *any* such row is what flips the
  computed `Product.requires_action` field to `true`.
- `ProductChangeAction` — id, product_id (kept as a denormalised text
  column for fast filtering), ordering, action, details, internal_note,
  applied, `product_change: belongsTo(ProductChange)`.

Service: `ProductChangeModuleService` exposes change/action CRUD plus
two helpers:
- `addAction(input: AddProductActionInput)` — moved from the fused
  service (logic preserved; the `PENDING`-parent validation runs
  against the change row, not the product).
- `requestProductChanges(input: { product_id, requires_action_reason?,
  requires_action_by })` — creates (or transitions an existing
  `PENDING` change to) `REQUIRES_ACTION`. Used by the admin
  request-changes flow described in "Workflow migration" below.

#### Workflows and steps owned by `product-change`

This module is a **near-mirror of Medusa's `OrderChange`** subsystem.
Pattern-match files (all under `medusa/packages/core/core-flows/src/`):

- `order/steps/confirm-order-changes.ts` → `confirmProductChangesStep`
- `order/steps/decline-order-change.ts` → `declineProductChangeStep`
- `order/steps/update-order-change-actions.ts` → `updateProductChangeActionsStep`
- `order/workflows/order-edit/confirm-order-edit-request.ts` → `confirmProductChangeWorkflow` (the 5-step shape: load → validate → mutate → downstream effects → emit)

The module operates on `ProductChange` / `ProductChangeAction` rows
and the `product-change-link.ts` pivot that joins them to stock
`Product`. It never mutates stock product entities directly;
transitions on the linked product (e.g., publish on confirm) are
delegated back to the wrapper that composes it, using stock
`updateProductsWorkflow.runAsStep`. Classification rule is the same
as for `product-attribute` above.

Naming: kebab-case files (`confirm-product-change.ts`), kebab-case
workflow IDs (`"confirm-product-change"`).

| Name | Kind | Purpose / pattern reference |
|---|---|---|
| `createProductChangeWorkflow` | workflow | `validateNoPendingProductChangeStep` → `createProductChangeStep` → `emitEventStep` → `createHook("productChangeCreated", …)`. Used internally by `submit-seller-products` after stock create returns. |
| `confirmProductChangeWorkflow` | workflow | Mirrors `confirm-order-edit-request.ts`:<br>1. `useQueryGraphStep` (load change),<br>2. `confirmProductChangeValidationStep` (status guard),<br>3. `confirmProductChangesStep` (mutation),<br>4. `applyProductChangeActionsWorkflow.runAsStep` (downstream effects),<br>5. `emitEventStep` → `createHook("productChangeConfirmed", …)`. |
| `rejectProductChangeWorkflow` | workflow | `useQueryGraphStep` → `validateProductChangeIsPendingStep` → `declineProductChangeStep` → `emitEventStep` → `createHook(…)`. Mirrors `declineOrderChangeStep` in shape. |
| `requestProductChangesWorkflow` | workflow | `useQueryGraphStep` (find / open) → `requestProductChangesStep` (transitions to `REQUIRES_ACTION` + stamps) → `emitEventStep("product-changes.requires-action")` → `createHook(…)`. This is the workflow that flips the computed `Product.requires_action` boolean to `true`. |
| `resubmitProductChangeWorkflow` | workflow | `useQueryGraphStep` → `validateProductChangeIsRequiresActionStep` → `resubmitProductChangeStep` (transition back to `PENDING`) → `emitEventStep` → `createHook(…)`. |
| `cancelProductChangeWorkflow` | workflow | `useQueryGraphStep` → `validateProductChangeIsPendingStep` → `cancelProductChangeStep` → `emitEventStep` → `createHook(…)`. |
| `applyProductChangeActionsWorkflow` | workflow | Replays the `ProductChangeAction` rows of a confirmed change against the underlying product. Each action type maps to a stock workflow call (e.g., `STATUS_CHANGE` → `updateProductsWorkflow.runAsStep`). Composed with the wrapper, not invoked directly from a route. |
| `createProductChangeStep` | step | Module mutation. Pattern-match `medusa/packages/core/core-flows/src/order/steps/create-order-change.ts`: resolve `Modules.PRODUCT_CHANGE`, insert, return `StepResponse(created, createdIds)` with delete revert. |
| `confirmProductChangesStep` | step | Module mutation. Pattern-match `medusa/packages/core/core-flows/src/order/steps/confirm-order-changes.ts:26-62`: capture current state, call `confirmProductChange()`, revert calls `undoLastChange()`. |
| `declineProductChangeStep` | step | Module mutation. Pattern-match `medusa/packages/core/core-flows/src/order/steps/decline-order-change.ts:17-44`: retrieve before-state, call `declineProductChange()`, revert calls `updateProductChanges()` with the before-state. |
| `requestProductChangesStep` | step | Module mutation. Same shape as `declineProductChangeStep`. |
| `resubmitProductChangeStep` | step | Module mutation. |
| `cancelProductChangeStep` | step | Module mutation. |
| `updateProductChangeActionsStep` | step | Module mutation. Pattern-match `medusa/packages/core/core-flows/src/order/steps/update-order-change-actions.ts:21-60`: list-before, update, revert updates with before-state. |
| `addProductChangeActionStep` | step | Module mutation. Appends a single `ProductChangeAction` row. Precondition (parent change is `PENDING`) is enforced by composing `validateProductChangeIsPendingStep` ahead of this in the workflow — not inside the step itself. |
| `validateProductChangeIsPendingStep` | step | Pure validator. Pattern-match `medusa/packages/core/core-flows/src/common/steps/validate-presence-of.ts` shape: throws `MedusaError(INVALID_DATA)`, no revert. |
| `validateProductChangeIsRequiresActionStep` | step | Pure validator. Same shape. |
| `confirmProductChangeValidationStep` | step | Pure validator. Composite of "row exists" + "status is `PENDING`" + "row not stale". Same shape. |
| `validateNoPendingProductChangeStep` | step | Pure validator used by `createProductChangeWorkflow` to enforce one pending change per product. |

The wrapper layer (see "Cross-module workflow composition" below)
combines these with stock product workflows so that, for example,
**confirming a change** runs:
`confirmProductChangeWorkflow → applyProductChangeActionsWorkflow →
stock updateProductsWorkflow.runAsStep`
inside one transactional wrapper.

### Module Links

All new links live under `packages/core/src/links/`. Each link declares a
`field` alias so that the existing field-tree strings in query configs
keep working.

**`defineLink` pluralization rule.** When a side is declared with
`isList: true`, `defineLink` runs the `field` string through
`pluralize()` before exposing it as a property on the parent entity
(`medusa/packages/core/utils/src/modules-sdk/define-link.ts:431-443`):

```ts
fieldAlias: buildFieldAlias({
  property: serviceBObj.isList ? pluralize(aliasB) : aliasB,
  path: aliasB + "_link." + aliasB,
  isList: serviceBObj.isList,
  forwardArguments: [aliasB + "_link." + aliasB],
})
```

Always declare the `field` as the **singular noun** when `isList:
true`. Declaring it already-plural (`variant_attributes`) produces
the double-pluralized property `variant_attributess`. The table
below lists each link's `field` value (singular) and the resolved
property name (what the field-tree path references).

| Link file | `field` (singular) | Resolved property on parent | `isList` | Left | Right |
|---|---|---|---|---|---|
| `product-variant-attribute-link.ts` | `variant_attribute` | `variant_attributes` (on Product) | true | `productModule.linkable.product` | `productAttributeModule.linkable.productAttribute` |
| `product-attribute-value-link.ts` | `attribute_value` | `attribute_values` (on Product) | true | `productModule.linkable.product` | `productAttributeModule.linkable.productAttributeValue` |
| `product-variant-attribute-value-link.ts` | `attribute_value` | `attribute_values` (on ProductVariant) | true | `productModule.linkable.productVariant` | `productAttributeModule.linkable.productAttributeValue` |
| `product-attribute-category-link.ts` | `attribute` | `attributes` (on ProductCategory) | true | `productModule.linkable.productCategory` | `productAttributeModule.linkable.productAttribute` |
| `product-change-link.ts` | `change` | `changes` (on Product) | true | `productModule.linkable.product` | `productChangeModule.linkable.productChange` |
| `product-option-attribute-link.ts` | `source_attribute` | `source_attribute` (on ProductOption, singular — `isList: false`) | false | `productModule.linkable.productOption` | `productAttributeModule.linkable.productAttribute` |
| `product-option-value-attribute-value-link.ts` | `source_attribute_value` | `source_attribute_value` (on ProductOptionValue) | false | `productModule.linkable.productOptionValue` | `productAttributeModule.linkable.productAttributeValue` |

`defineLink` supports `alias` on either side via the `database.table` and
`field` options; the alias picked here is what makes the existing
field-tree strings resolve. The mapping the spec must produce:

| Field string from `vendorProductFields` | Resolved via |
|---|---|
| `*variants` | stock product joiner (`Product.variants`) |
| `*variants.attribute_values` | `product-variant-attribute-value-link` |
| `*variants.attribute_values.attribute` | product-attribute joiner (`ProductAttributeValue.attribute`) |
| `*variant_attributes` | `product-variant-attribute-link` |
| `*variant_attributes.values` | product-attribute joiner (`ProductAttribute.values`) |
| `*options,*options.values` | stock product joiner (`Product.options`) |
| `*attribute_values` | `product-attribute-value-link` |
| `*attribute_values.attribute` | product-attribute joiner |

The link's `database.table` points each new link at the existing pivot
table name. **But re-pointing is not free.** The override's pivots are
all FK-pair-only with composite primary keys (audited against
`migrations/Migration20260422112250.ts:6` and
`migrations/Migration20260414141012.ts:96,114`). Medusa's link runtime
expects an `id` column, `created_at` / `updated_at` / `deleted_at`
timestamps, and a single-column PK. Each pivot therefore needs a
pre-link `ALTER TABLE` migration before the new module's link
declaration attaches.

| Existing pivot | Current shape | Pre-link `ALTER TABLE` |
|---|---|---|
| `product_attribute_value_link` | FK pair (`product_id`, `product_attribute_value_id`), composite PK | `ADD COLUMN id text NOT NULL DEFAULT gen_random_uuid()::text`; `ADD COLUMN created_at`, `updated_at`, `deleted_at`; `ALTER TABLE DROP CONSTRAINT product_attribute_value_link_pkey`; `ADD PRIMARY KEY (id)`; `ADD CONSTRAINT product_attribute_value_link_pair_unique UNIQUE (product_id, product_attribute_value_id) WHERE deleted_at IS NULL` (partial UNIQUE preserves the legacy dedup invariant while allowing soft-delete + recreate). |
| `product_variant_attribute_value` | FK pair (`product_attribute_value_id`, `product_variant_id`), composite PK | Identical column additions; `DROP CONSTRAINT product_variant_attribute_value_pkey`; `ADD PRIMARY KEY (id)`; partial UNIQUE on the FK pair. |
| `product_variant_attribute` | FK pair (`product_attribute_id`, `product_id`), composite PK | Identical column additions; `DROP CONSTRAINT product_variant_attribute_pkey`; `ADD PRIMARY KEY (id)`; partial UNIQUE on the FK pair. |
| `product_change_link` (new) | n/a — created fresh | `CREATE TABLE` with stock link metadata + FK columns `product_id`, `product_change_id`. The legacy `change.product_id` FK on `ProductChange` is dropped and rows are moved into this pivot to make the link symmetrical. |
| `product_option_attribute_link` (new) | n/a | `CREATE TABLE` with `id`, FK columns, `fingerprint text NOT NULL`, timestamps. Declared via `database.extraColumns: { fingerprint: { type: "text", nullable: false } }`. |
| `product_option_value_attribute_value_link` (new) | n/a | Same shape. |

The migrations live in `packages/core/src/migrations/` (Mercur-side,
not in a module — they pre-condition the module loading) and run as
part of the "Order of operations" (see Data migration below) **before**
the new modules are registered. No row-level data is moved by the
ALTER passes; only the column shape changes.

The legacy `ProductAttribute.product_id` FK (the column that backed
`Product.custom_attributes`) is dropped without a replacement pivot —
its rows are migrated into stock `ProductOption` / `ProductOptionValue`
(see Data migration below).

### Computed fields: `requires_action`

There is no augment table on `Product` for marketplace flags. The two
signals the override used to carry on the product row are handled
elsewhere:

- `is_restricted` — **dropped**. The feature it backed (a per-product
  hard block) is being removed in this spec; restriction lives on
  brand-level workflows instead and no product-side column is needed.
- `created_by` / `created_by_actor` — **dropped from the product
  side**. The authoritative `created_by` already lives on
  `ProductChange` (one row per submission). Vendor-attribution
  queries should go through `*changes` rather than reading a column
  on the product.
- `status = 'requires_action'` — **dropped from the product-status
  enum**. The product's stored `status` returns to stock Medusa
  (`draft` / `proposed` / `published` / `rejected`).
  `requires_action` becomes a **computed boolean** on the product
  surface, derived from `ProductChange`.

The derivation follows Medusa's `aggregate-status` pattern
(`/packages/core/core-flows/src/order/utils/aggregate-status.ts` in
the stock repo): a workflow-level util that scans linked child rows
and returns the formatted product DTOs, computed in a `transform` step.

The util is named `formatProducts` rather than after the specific
field it derives, because it is the single seam where Mercur enriches
the stock product DTO with marketplace-computed fields. New computed
fields (e.g., a future `seller_visibility`, `is_authorized_for_buyer`,
etc.) are added inside this util without renaming it or adding a new
util per field.

```ts
// packages/core/src/workflows/product/utils/format-products.ts
import { ProductChangeStatus } from "@mercurjs/types"

type RawProduct = {
  changes?: { status: ProductChangeStatus }[]
  [key: string]: unknown
}

type FormattedProduct<T extends RawProduct> = T & {
  requires_action: boolean
}

export function formatProducts<T extends RawProduct>(
  products: T[]
): FormattedProduct<T>[] {
  return products.map((product) => ({
    ...product,
    requires_action:
      product.changes?.some(
        (c) => c.status === ProductChangeStatus.REQUIRES_ACTION
      ) ?? false,
  }))
}
```

New wrapper workflow `getProductsWithDetailsWorkflow`
(`packages/core/src/workflows/product/workflows/get-products-with-details.ts`)
runs the stock product query with `*changes.status` included, then a
`transform` step passes the result through `formatProducts` to append
the computed fields. All vendor and admin product list / detail
routes call this wrapper instead of `useQueryGraphStep` directly.

**`requires_action` is not a joiner field — it is part of the
wrapper's response contract.** Module-Link joiners
(`defineLink.extends[].fieldAlias` in
`medusa/packages/core/utils/src/modules-sdk/define-link.ts`) only
rewrite paths through real entity attributes; there is no
computed-expression slot, so a boolean derived from
`changes.some(c => c.status === REQUIRES_ACTION)` cannot be a joiner
property. `useQueryGraphStep` silently drops unknown field paths, so a
caller writing `*requires_action` in `fields` gets nothing back from
the graph itself.

The wrapper sidesteps this by:

1. Unconditionally including `changes.status` in the `useQueryGraphStep`
   `fields` arg (so the data is present in the response regardless of
   the caller's selection).
2. Unconditionally appending `requires_action: boolean` to every
   product DTO in a `formatProducts` transform step.
3. Returning the enriched DTOs to the route handler.

Clients **do not** put `*requires_action` in their field-tree. The
boolean ships on every product the wrapper returns.

**Field-tree change**:

| Field string | Resolved via |
|---|---|
| `*changes,*changes.status` | `product-change-link.ts` joiner (only field-tree path needed) |

`requires_action` is intentionally absent — it is part of the wrapper
response shape, not the joiner.

### Vendor product-create form change

`packages/vendor/src/pages/products/create/components/product-create-attributes-form/product-create-attributes-form.tsx`
currently fuses two flows in one UI:

1. **Add Existing** — pulls attributes that are flagged
   `is_required` for the chosen category (via
   `useProductAttributes({ category_id, is_required: true })`),
   resolves their type, and lets the vendor pick values from
   `attribute.values`. **This stays** — it is the
   `product-attribute` module surface. Linking happens via
   `product_attribute_value_link` (and `product_variant_attribute_value`
   for variant axes).
2. **Create New** — lets the vendor type a freeform attribute name and
   either a textarea value or a chip list, optionally toggling
   `use_for_variants`. **This is replaced** by stock Medusa
   `ProductOption` / `ProductOptionValue`. Custom (product-scoped)
   attributes are no longer created at all — vendors define
   `options[]: { title, values: string[] }` instead, and the
   `useForVariants` toggle is gone (every option is a variant axis by
   construction in Medusa).

Field-array shape after migration. Selected attribute values use the
same shape as the `ProductAttributeValue` model
(`packages/core/src/modules/product/models/product-attribute-value.ts`):
`{ id, handle, name, rank, is_active, metadata }`. There is no
separate "available values" field — the dropdown source is the
attribute's own `values` relation, resolved at render time from the
`product-attribute` module; what the form persists is the selected
subset, already in the model shape.

```ts
// Existing/required (linked product-attribute path)
attributes: [{
  attribute_id: string,
  title: string,
  is_required: boolean,
  use_for_variants: boolean,
  values: {
    id: string,
    handle: string | null,
    name: string,
    rank: number,
    is_active: boolean,
    metadata: Record<string, unknown> | null,
  }[]
}]

// New (stock Medusa options) — replaces every "custom" attribute path
options: [{
  title: string,
  values: string[]
}]
```

For `TOGGLE` attributes, `values` contains a single
`ProductAttributeValue` row representing the on-state; the off-state
is the absence of any row in the field array (no need for a synthetic
boolean column on the form).

On submit, `options[]` is passed straight to
`createProductsWorkflow.input.products[i].options`. The `attributes[]`
list is split per attribute type into:

- `attribute_values[]` (M:N link on Product) — for `SINGLE_SELECT`,
  `MULTI_SELECT`, `TOGGLE` value picks against an existing
  `ProductAttributeValue`, when the attribute is **not** used as a
  variant axis.
- **Mirrored option** — when the attribute is selected with
  `use_for_variants = true`, the wrapper workflow materialises it into a
  stock `ProductOption` (and its chosen values into `ProductOptionValue`)
  so the stock `createProductsWorkflow` accepts the payload and generates
  variants from `options × values`. The materialised rows stay linked to
  the source attribute — see **Mirrored options for existing attributes**
  below.

The `custom_attributes` 1:N path (a product owning its own
`ProductAttribute` row) is removed entirely — from the model, from the
field tree, from the create form, and from query configs. There is no
`*custom_attributes` field path post-migration.

**Simple products (no variant axes).** Stock `validateProductInputStep`
(`medusa/packages/core/core-flows/src/product/workflows/create-products.ts:73-91`)
throws when `product.options.length === 0`. The override's
`createProducts` (`packages/core/src/modules/product/services/service.ts:1551-1581`)
bypassed this check entirely; once that override is gone, every simple
product (no `options[]`, no `attributes[]` with `use_for_variants:
true`) hits the throw at `createProductsWorkflow.runAsStep`.

The `submit-seller-products` wrapper therefore injects a default option
for products whose computed option set is empty — mirroring the
behavior Medusa admin uses internally for simple products:

```ts
const productDataWithDefaultOption = transform(
  { productData },
  ({ productData }) =>
    productData.map((p) => ({
      ...p,
      options: p.options?.length
        ? p.options
        : [{ title: "Default option", values: ["Default option value"] }],
    }))
)
```

This runs **after** the mirrored-options materialisation transform
(so products with `use_for_variants` attributes already have non-empty
`options[]` and skip the default) and **before**
`createProductsWorkflow.runAsStep`. Variants generated against the
default option are indistinguishable from stock Medusa's "simple
product" representation — no UI change, no client-side migration.

### Mirrored options for existing attributes

**Why this exists.** Stock `createProductsWorkflow` rejects any product
that has variants but no `options[]` (see
`validate-product-input` in `@medusajs/medusa/core-flows`). A product
with three variants and zero options is not creatable through the
standard workflow. We cannot drop the option requirement, and we cannot
keep variants tied only to `ProductAttributeValue` link rows because
variant identity in Medusa is anchored to `ProductOptionValue` rows that
physically belong to the product.

The naive workaround — copy the chosen attribute's name and values into
fresh `ProductOption` / `ProductOptionValue` rows at create time and
forget the link — turns those rows into **snapshots**. When the source
attribute is renamed (`Material` → `Fabric`) or a value is renamed
(`Cotton` → `Organic Cotton`), every product created from that
attribute keeps the stale label. That's exactly the failure mode the
existing Mercur override was avoiding (its `Product.variant_attributes`
M:N relation was a live reference, not a snapshot).

**The design.** Materialise + link, then propagate renames via
subscribers. The materialised `ProductOption` / `ProductOptionValue`
rows are real (so stock workflows + variant generation work), but each
row carries a Module Link back to the source so a rename of the source
fans out to every mirrored row.

1. **Create-time materialisation.** When the vendor picks an existing
   attribute with `use_for_variants = true`, the
   `createSellerProductsWorkflow` wrapper:
   - Resolves the attribute and its chosen `ProductAttributeValue` rows.
   - Injects a stock option into the createProductsWorkflow payload:
     ```ts
     options.push({
       title: attribute.name,                  // snapshot for display
       values: chosenValues.map(av => av.name) // snapshot for display
     })
     ```
   - Lets stock `createProductsWorkflow` run unchanged.
   - After the workflow returns, looks up the newly-created
     `ProductOption` (matched by title within that product) and its
     `ProductOptionValue` rows, then creates link rows:
     ```
     product_option_attribute_link
       product_option_id          → ProductOption.id
       product_attribute_id       → ProductAttribute.id
       fingerprint                → sha256(attribute_id|attribute.name)

     product_option_value_attribute_value_link
       product_option_value_id    → ProductOptionValue.id
       product_attribute_value_id → ProductAttributeValue.id
       fingerprint                → sha256(av_id|av.name)
     ```
   - These links are exposed through the joiner as aliases
     `ProductOption.source_attribute` and
     `ProductOptionValue.source_attribute_value`, so field-tree paths
     like `*options.source_attribute,*options.values.source_attribute_value`
     resolve.

   The `fingerprint` column is a content hash of the source row at the
   moment the link was created. It is **not** the integrity check — the
   foreign keys are. The fingerprint is what a reconciliation job uses
   to cheaply detect drift (`fingerprint != sha256(current source)` ⇒
   propagate or flag).

2. **Rename propagation.** Two subscribers in the `product-attribute`
   module:

   - `product-attribute.updated`: when `name` changes, run
     `mirrorProductAttributeRenameWorkflow`. Steps:
     1. Find every `product_option_attribute_link` row pointing at this
        attribute.
     2. For each linked `ProductOption`, call
        `productModuleService.updateProductOptions({ id, title: newName })`.
     3. Update `fingerprint = sha256(attribute_id|newName)` on the link
        row.
   - `product-attribute-value.updated`: when `name` changes, run
     `mirrorProductAttributeValueRenameWorkflow`. Steps:
     1. Find every `product_option_value_attribute_value_link` row
        pointing at this value.
     2. For each linked `ProductOptionValue`, call
        `productModuleService.updateProductOptionValues({ id, value: newName })`.
     3. Update `fingerprint = sha256(av_id|newName)`.

   Both subscribers run async, batched per attribute / value (so a bulk
   rename of one attribute touches all linked products in one
   transaction set). They are idempotent — re-running them with the
   same input is a no-op because the fingerprint already matches.

3. **Value additions / deletions on the source attribute.**
   - **Add value** to the source attribute → **not** automatically
     propagated to mirrored options. Adding a global "Linen" to
     `Material` should not silently spawn a new variant on every linked
     product. Vendors opt in per product via the edit flow ("Pull new
     values from `Material`"), which appends the new value and
     regenerates the option's `ProductOptionValue` rows.
   - **Delete value** from the source attribute → soft-blocked at the
     module level: `ProductAttributeValue.delete()` raises if any
     `product_option_value_attribute_value_link` still references the
     value. Operator must reassign the affected products first. (The
     reason: deleting a value would orphan variants whose identity is
     anchored to the corresponding `ProductOptionValue`.)
   - **Delete the source attribute** → same soft-block via
     `product_option_attribute_link`.

4. **Reconciliation job.** A scheduled task (daily, plus on-demand via
   `mercurjs reconcile-mirrored-options`) walks both link tables and
   compares `fingerprint` against `sha256(current source)`. Mismatches
   are either auto-fixed (subscriber missed an event) or flagged in the
   admin "Marketplace health" panel for operator review. The
   fingerprint avoids hot-loading the source row when reconciling.

5. **What this is NOT.**
   - Not a virtual-option pattern. The `ProductOption` and
     `ProductOptionValue` rows are real, persisted, queryable through
     stock joins, and variants reference them with FKs. The link is
     additive metadata, not a substitute.
   - Not a cache. The mirrored row's `title`/`value` is the source of
     truth for storefront display until the next propagation run; the
     link enforces a same-on-both-sides invariant only after the
     subscriber lands.

**Storage summary** (new tables added by this section, all owned by
`product-attribute`):

```
product_option_attribute_link
  id, product_option_id, product_attribute_id, fingerprint
  created_at / updated_at / deleted_at provided by Medusa link base
  unique (product_option_id) -- one source per option
  index (product_attribute_id)

product_option_value_attribute_value_link
  id, product_option_value_id, product_attribute_value_id, fingerprint
  created_at / updated_at / deleted_at provided by Medusa link base
  unique (product_option_value_id) -- one source per option value
  index (product_attribute_value_id)
```

**Field-tree additions**:

| Field string | Resolved via |
|---|---|
| `*options.source_attribute` | `product_option_attribute_link` joiner |
| `*options.values.source_attribute_value` | `product_option_value_attribute_value_link` joiner |

### Order of operations (single deploy, no feature flag)

The cutover is a single deploy with a fixed sequence of migrations and
module-registration changes. Each step is a precondition for the next.
Boot from a fresh DB skips steps 2–4 (no legacy rows); steps 1, 5, 6
become no-ops because the columns / tables / module never existed. All
data-migration scripts are **idempotent** so re-running on a fresh DB
or a partially-migrated DB does not fail.

1. **Pre-link schema migrations** — apply the per-pivot `ALTER TABLE`
   migrations from the Module Links section (add `id`, timestamps,
   `deleted_at`, swap PK, add partial UNIQUE) to
   `product_attribute_value_link`, `product_variant_attribute_value`,
   `product_variant_attribute`. After this step the pivots have
   Medusa-link-shaped schemas but are still managed by the old module.
2. **Brand → attribute data migration** — create the `brand`
   `ProductAttribute` rows + their `ProductAttributeValue` rows;
   insert `product_attribute_value_link` rows for each
   `product.brand_id`. The legacy `product.brand_id` column stays
   populated for rollback during this deploy.
3. **Custom-attribute → stock-option data migration** — convert
   `ProductAttribute WHERE product_id IS NOT NULL` rows + their
   `ProductAttributeValue` children into stock `ProductOption` /
   `ProductOptionValue` rows on the owning product.
4. **`requires_action` re-stamp** — for every product with
   `status = 'requires_action'`, set
   `status = 'proposed'` and insert a `ProductChange` row with
   `status = 'REQUIRES_ACTION'` so the computed
   `Product.requires_action` boolean lights up post-cutover.
5. **Module-registration swap in `withMercur()`** — drop
   `@mercurjs/core/modules/product`; register
   `@mercurjs/core/modules/product-attribute` and
   `@mercurjs/core/modules/product-change`. The new modules' joiner
   configs attach to the migrated pivot tables (`database.table:
   "<existing>"`) without recreating them. **Critical**: this must
   happen between the data migrations (steps 2–4) and the post-cutover
   drops (step 6) — never with both modules registered simultaneously,
   or MikroORM tries to manage the same physical tables from two
   modules.
6. **Post-cutover migrations** — drop legacy columns / tables that no
   one reads anymore: `product.is_restricted`,
   `product_category.is_restricted`, `product.brand_id`,
   `product_brand` table, `product_brand_seller_link` table. Restrict
   the `product.status` enum to stock values (`draft` / `proposed` /
   `published` / `rejected`).

### Data migration: custom_attributes → stock options

Every legacy `ProductAttribute.product_id IS NOT NULL` row is migrated
to a stock Medusa `ProductOption` on the owning product, with its
`ProductAttributeValue` children migrated to that option's
`ProductOptionValue` rows:

```
ProductAttribute  (product_id = P, name = "Material", type = TEXT|SELECT|...)
  └─ ProductAttributeValue (name = "Cotton") ─┐
  └─ ProductAttributeValue (name = "Wool")    ─┤
                                              v
ProductOption     (product_id = P, title = "Material")
  └─ ProductOptionValue (value = "Cotton")
  └─ ProductOptionValue (value = "Wool")
```

Rules:

- Title for the new `ProductOption` is the attribute's `name`.
- Option-value `value` is the attribute-value's `name`. If the legacy
  type was `TEXT` and the attribute had no `ProductAttributeValue`
  children, fall back to the free-text payload stored on the legacy
  product link (one option with a single value, or skip the row with a
  log line if no value exists).
- After the rows are moved, the legacy
  `ProductAttribute WHERE product_id IS NOT NULL` rows (and their
  `ProductAttributeValue` children) are deleted, and the
  `ProductAttribute.product_id` column is dropped.
- Category-scoped attributes (`product_id IS NULL`) are untouched —
  they remain in the `product-attribute` module and continue to flow
  through the Add-Existing path.

The migration is idempotent and dry-runnable: a `--check` mode reports
counts of attributes that will become options, option-values that will
be created, and rows with no resolvable value (which are logged for
operator review and skipped).

### Drop `ProductBrand` — brand becomes a category-scoped attribute

`ProductBrand` is **removed entirely** in this spec. A brand is not a
distinct domain concept in marketplace terms — it is a structured
selection assigned per product, which is exactly the shape
`ProductAttribute` already provides. Carrying a separate model, set of
workflows, and pair of link tables for a single string-with-rules is
duplicated machinery.

Mapping:

- `ProductBrand.name` → `ProductAttributeValue.name` of a special
  category-scoped attribute (`handle = "brand"`,
  `type = SINGLE_SELECT`, `is_required` per category configuration).
- `ProductBrand → Product` association → existing
  `product_attribute_value_link` pivot (the M:N already used for
  attribute-value selections). Cardinality
  `count(values where attribute.handle = 'brand') ≤ 1` per product is
  enforced by `validateBrandCardinalityStep` (defined below); Module
  Links cannot enforce per-pair cardinality on their own.
- `ProductBrand ↔ Seller` whitelist → **removed**. The brand
  restriction feature (`is_restricted = true` + seller whitelist) is
  dropped along with category-level `is_restricted` (see next
  section). Brands are universally available to all sellers within a
  category. If a future spec needs gated brands, model that as a
  category-level permission, not as a brand-side flag.

Files to delete from `packages/core/src/`:

- `modules/product/models/product-brand.ts`
- `workflows/product/workflows/create-product-brands.ts`
- `workflows/product/workflows/update-product-brands.ts`
- `workflows/product/workflows/delete-product-brands.ts`
- `workflows/product/workflows/link-sellers-to-product-brand.ts`
- `workflows/product/steps/create-product-brands.ts`
- `workflows/product/steps/update-product-brands.ts`
- `workflows/product/steps/delete-product-brands.ts`
- Any `links/product-brand-link.ts` /
  `links/product-brand-seller-link.ts` if present.
- The `brand_ids` whitelist branch of
  `validate-seller-product-permissions.ts` (see next section — that
  step is being rewritten anyway).

Routes that read/write brands move to the existing product-attribute
routes (`/admin/product-attributes`, `/vendor/product-attributes`)
scoped to the `brand` handle. No new endpoints.

**Cardinality enforcement: `validateBrandCardinalityStep`.**

Module-Link pivots do not enforce per-pair cardinality
(`product_attribute_value_link` has a composite PK on
`(product_id, product_attribute_value_id)` — that prevents the *same*
brand value being linked twice, but a vendor can still link two
*different* brand values to one product). The `≤ 1 brand per product`
invariant is enforced by a Mercur-owned pure validator step.

Location: `packages/core/src/workflows/product/steps/validate-brand-cardinality.ts`.

Shape (pattern-match
`medusa/packages/core/core-flows/src/common/steps/validate-presence-of.ts`):

```ts
type ValidateBrandCardinalityInput = {
  // One entry per product being created / updated. Each lists the
  // brand-value-ids the caller is asserting on that product.
  products: {
    product_id?: string                       // null on create
    incoming_brand_value_ids: string[]        // from payload
  }[]
}

export const validateBrandCardinalityStep = createStep(
  "validate-brand-cardinality",
  async (input: ValidateBrandCardinalityInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // For each product with a product_id, load its existing brand-handle
    // attribute_values via the link pivot, scoped to attribute.handle = "brand".
    const existing = await query.graph({
      entity: "product",
      fields: [
        "id",
        "attribute_values.id",
        "attribute_values.attribute.handle",
      ],
      filters: {
        id: input.products.map((p) => p.product_id).filter(Boolean),
      },
    })

    for (const product of input.products) {
      const existingBrandIds = (existing.data
        .find((p) => p.id === product.product_id)?.attribute_values ?? [])
        .filter((v) => v.attribute?.handle === "brand")
        .map((v) => v.id)
      const union = new Set([
        ...existingBrandIds,
        ...product.incoming_brand_value_ids,
      ])
      if (union.size > 1) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `one brand per product (product ${product.product_id ?? "(new)"} ` +
          `would have ${union.size} brand values)`
        )
      }
    }
  }
)
```

Wired in as the **first step** (before any link write or stock
create) of:

- `submit-seller-products` workflow.
- Any product-update wrapper that mutates `attribute_values`
  (e.g., a future `update-vendor-product-attributes` workflow).
- Any bulk-edit wrapper that touches brand-handle values.

No revert function — pure validator, throws or no-ops.

The brand → attribute data migration described below is itself
constrained: each product gets exactly one
`product_attribute_value_link` row to the migrated brand value (the
legacy `product.brand_id` column carried at most one row, so the
invariant holds at migration time without an extra dedup pass).

**Data migration: brand → attribute.**

```
ProductBrand (name = "Acme", handle = "acme")
  └─ Products linked via product_brand_link
      ↓
ProductAttribute (handle = "brand", type = SINGLE_SELECT,
                  scope: linked to all categories that previously
                  allowed the brand via seller whitelist or
                  unrestricted access)
  └─ ProductAttributeValue (handle = "acme", name = "Acme")
      ↓
Each product that had a brand row gets a
product_attribute_value_link row pointing at the corresponding
ProductAttributeValue.
```

The migration is idempotent: re-running collapses duplicate
`ProductAttributeValue` rows by handle and de-dupes the
`product_attribute_value_link` rows.

### Drop `is_restricted` from `ProductCategory`

The `is_restricted` boolean on `ProductCategory` (override line 14 of
`modules/product/models/product-category.ts`) and the corresponding
seller-whitelist enforcement in
`workflows/product/steps/validate-seller-product-permissions.ts` are
**removed**. This was the only consumer of the column. Reason: the
override was the sole carrier of the field, the stock Medusa category
has no equivalent, and continuing to ship it would force us to keep
extending the category model after dropping the override.

Files to update:

- Drop the `is_restricted` column from any migration that still
  declares it (the column does not exist on stock Medusa
  `product_category`, so no `ALTER TABLE` is needed on stock — the
  override migration that creates the column is deleted along with
  the override).
- `validate-seller-product-permissions.ts` keeps only the brand-as-
  attribute validation (none, after the brand whitelist is dropped)
  and the seller-category link presence check (which stays — sellers
  still need to be associated with categories they sell into). The
  "Seller is restricted from categories" branch is deleted entirely.

If a category-level access gate is required again, model it as a
Module Link between `seller` and `product_category` (whitelist), not
as a column on the category — a link table is auditable, easy to
revoke, and doesn't require schema changes per gate.

### Variant `manage_inventory = false` invariant

The override variant model carries `manage_inventory` as a
`.computed()` constant pinned to `false`
(`modules/product/models/product-variant.ts:28`). Once the override
is dropped, the field becomes a real stock Medusa column with default
`true`. The marketplace invariant — vendor-owned variants never
participate in Medusa's inventory bookkeeping — must therefore be
enforced explicitly by **every wrapper workflow that ingests
variants** before delegating to the stock `createProductsWorkflow` /
`createProductVariantsWorkflow`:

```ts
const productData = transform(input, ({ products }) =>
  products.map((product) => ({
    ...product,
    variants: product.variants?.map((variant) => ({
      ...variant,
      manage_inventory: false,
    })),
  }))
)
```

Wrappers that must inject this:

- `submit-seller-products`
- Any future direct create wrapper around stock
  `createProductVariantsWorkflow`
- The seller-side wrapper(s) for `update-products` /
  `update-product-variants` when a caller could overwrite
  `manage_inventory` (defensive — never let the column come back to
  `true` after a vendor PATCH).

This requirement applies even after `create-products.ts` /
`create-product-variants.ts` themselves are deleted as duplicates
(see "Workflows to delete" below) — the constraint moves to whichever
wrapper survives (`submit-seller-products` plus any new seller-scoped
update wrapper).

A regression test must assert that `POST /vendor/products` produces
variants with `manage_inventory = false` and that
`PATCH /vendor/products/:id` with `manage_inventory: true` in the
payload is either rejected or overridden back to `false`.

### Stock core-flows reused (no Mercur reimplementation)

Maximize reuse of `@medusajs/medusa/core-flows`. Every primitive
listed below is imported directly; the spec does not ship a Mercur
clone. Concrete stock primitives the Mercur side depends on:

| Stock primitive | Path | Used for |
|---|---|---|
| `createRemoteLinkStep` | `core-flows/src/common/steps/create-remote-links.ts` | All Module Link writes (`product_attribute_value_link`, `product_variant_attribute_value`, `product_attribute_category_link`, `product_option_attribute_link`, `product_option_value_attribute_value_link`, `product-change-link`, `product-seller-link`). |
| `dismissRemoteLinkStep` | `core-flows/src/common/steps/dismiss-remote-links.ts` | All Module Link removals (delete workflows, vendor-side detach). |
| `emitEventStep` | `core-flows/src/common/steps/emit-event.ts` | Every Mercur workflow's terminal event. Events are committed only when the workflow succeeds. |
| `useQueryGraphStep` | `core-flows/src/common/steps/use-query-graph.ts` | Loading rows by id / filter inside workflows (used by `getProductsWithDetailsWorkflow`, every `confirm/reject/...ProductChangeWorkflow`). |
| `validatePresenceOfStep` | `core-flows/src/common/steps/validate-presence-of.ts` | Generic required-field validator. Composed by Mercur validator steps that need it; not duplicated. |
| `createProductsWorkflow` | `core-flows/src/product/workflows/create-products.ts` | The single source of truth for product creation. `submit-seller-products` calls this via `runAsStep`. |
| `updateProductsWorkflow` | `core-flows/src/product/workflows/update-products.ts` | Product mutation. Called by `applyProductChangeActionsWorkflow` when replaying `STATUS_CHANGE` actions. |
| `deleteProductsWorkflow` | `core-flows/src/product/workflows/delete-products.ts` | Product deletion. Callers go through stock directly (the Mercur wrapper is deleted — see "Workflows to delete"). |
| `createProductVariantsWorkflow` | `core-flows/src/product/workflows/create-product-variants.ts` | Variant creation. Callers go through stock directly. |
| `updateProductVariantsWorkflow` | `core-flows/src/product/workflows/update-product-variants.ts` | Variant mutation. |
| `updateProductOptionsWorkflow` | `core-flows/src/product/workflows/update-product-options.ts` | Mirror-rename target for **attribute** renames — `mirrorProductAttributeRenameWorkflow` calls this to update linked `ProductOption.title` rows. (Note: its `values: string[]` input is **not** suitable for per-value renames — see next row.) |
| _no stock workflow for per-value rename_ | — | Stock only ships `update-product-options.ts` (which accepts a flat `values: string[]` and would re-create `ProductOptionValue` rows, destroying variant identity). `mirrorProductAttributeValueRenameWorkflow` therefore uses Mercur's own `updateProductOptionValuesStep` that calls `productModuleService.updateProductOptionValues({ id, value })` directly to preserve ids. |
| `createProductCategoriesWorkflow` / `update…` / `delete…` | `core-flows/src/product-category/workflows/` | Category CRUD. Callers go through stock directly. |

Rules:

- Do **not** write a Mercur step that wraps `createRemoteLinkStep` —
  inline the `transform(...) → createRemoteLinkStep(links)` pair in
  the workflow (mirrors `create-products.ts:203-221`).
- Do **not** emit events from inside a mutation step — always use
  `emitEventStep` as the terminal step of a workflow, exactly like
  stock (`create-products.ts:276-279`).
- Do **not** wrap a stock workflow in a thin Mercur workflow just to
  rename it or add an event — call the stock workflow directly from
  the route (the "Workflows to delete" section is the enforcement of
  this rule).
- When in doubt, copy the shape of the closest stock equivalent. The
  spec lists the closest equivalent for every Mercur workflow above.

### Cross-module workflow composition

The Mercur wrapper workflows under
`packages/core/src/workflows/product/workflows/` compose three
sources:

- stock Medusa workflows from `@medusajs/medusa/core-flows`
  (`createProductsWorkflow`, `updateProductsWorkflow`,
  `useQueryGraphStep`, `emitEventStep`, etc.),
- workflows owned by `product-attribute`,
- workflows owned by `product-change`.

The composition mechanics mirror Medusa's own cross-module wrappers
(reference:
`/Users/viktorholik/Desktop/medusa/packages/core/core-flows/src/product/workflows/create-products.ts`
and `order/workflows/create-order.ts`). The four primitives below are
the **only** way Mercur wrappers cross module boundaries:

#### 1. `runAsStep` — embed another workflow as a step

Used when the upstream workflow needs the downstream workflow's
output. Reference:
`medusa/packages/core/core-flows/src/product/workflows/create-products.ts:247`.

```ts
import { createProductsWorkflow as stockCreateProductsWorkflow }
  from "@medusajs/medusa/core-flows"
import { createProductChangeWorkflow }
  from "../../product-change/workflows"

const createdProducts = stockCreateProductsWorkflow.runAsStep({
  input: { products: productData },
})

const changes = createProductChangeWorkflow.runAsStep({
  input: createdProducts.map((p) => ({ product_id: p.id })),
})
```

Rule: never call a module service directly from a wrapper. Compose
**workflows** with `runAsStep` and **steps** as direct calls — the
choice follows the classification rule from the module workflow
tables above (atomic operation → step; multi-step composition →
workflow). Both participate in compensation; the distinction is
about whether the unit can stand alone or needs to chain its own
sub-steps.

#### 2. `transform` — reshape upstream output into downstream input

Reference:
`medusa/packages/core/core-flows/src/product/workflows/create-products.ts:167-180`.

```ts
const attributeLinkInput = transform(
  { createdProducts, input },
  ({ createdProducts, input }) =>
    createdProducts.flatMap((p, i) =>
      (input.products[i].attribute_value_ids ?? []).map((value_id) => ({
        product_id: p.id,
        product_attribute_value_id: value_id,
      }))
    )
)

createRemoteLinkStep(attributeLinkInput)
```

`transform` is the only mechanism allowed for fan-in / fan-out
between workflow steps; never compute downstream inputs inline.

#### 3. `createRemoteLinkStep` — wire Module Links after creation

Reference:
`medusa/packages/core/core-flows/src/product/workflows/create-products.ts:203-221`
and
`medusa/packages/core/core-flows/src/cart/workflows/create-payment-collection-for-cart.ts:127-141`.

Mercur wrappers use this exactly once per link they own (seller link,
change link, attribute-value link), called immediately after the
upstream entity is created and before `emitEventStep`:

```ts
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

const sellerProductLinks = transform(
  { createdProducts, input },
  ({ createdProducts, input }) =>
    createdProducts.map((p) => ({
      [Modules.PRODUCT]: { product_id: p.id },
      seller: { seller_id: input.seller_id }, // alias from the seller link
    }))
)

createRemoteLinkStep(sellerProductLinks)
```

The dual is `dismissRemoteLinkStep` from
`@medusajs/medusa/core-flows`, used by the corresponding delete
wrappers (reference:
`medusa/packages/core/core-flows/src/common/steps/dismiss-remote-links.ts`).
Its built-in compensation re-creates the link if the workflow
aborts, so wrappers don't need to special-case rollback.

#### 4. `when(...).then(...)` — conditional sub-workflow

Reference:
`medusa/packages/core/core-flows/src/order/workflows/create-order.ts:260-286`.

```ts
when(
  "create-mirrored-options",
  { input },
  ({ input }) =>
    input.products.some((p) =>
      p.attributes?.some((a) => a.use_for_variants)
    )
).then(() => {
  createMirroredOptionsWorkflow.runAsStep({
    input: { products: createdProducts, attributes: input.products },
  })
})
```

Used for the "mirrored options for existing attributes" path (only
fires when the vendor picked at least one attribute with
`use_for_variants = true`).

#### 5. `parallelize` — fan out independent steps and sub-workflows

Reference:
`medusa/packages/core/core-flows/src/order/workflows/create-order.ts:182-193`.

```ts
parallelize(
  createRemoteLinkStep(attrLinks),     // product_attribute_value_link
  createRemoteLinkStep(sellerLinks),   // product-seller-link
  createProductChangeWorkflow.runAsStep({ input: changeInput })
)
```

Only used when the units are genuinely independent (no shared
input/output). For the submit-seller flow this is true for
seller-link + attribute-value-link + change-creation; they all
consume only `createdProducts` from the upstream step. Atomic link
writes use stock `createRemoteLinkStep` directly (never a Mercur
wrapper step); multi-step compositions go via `runAsStep`.

#### 6. `emitEventStep` — last

Reference:
`medusa/packages/core/core-flows/src/product/workflows/create-products.ts:276-279`.

In every Mercur wrapper, `emitEventStep` is the **last** step before
the workflow returns. This means subscribers (including the
mirror-rename pair) see a fully-consistent state: stock entity +
seller link + attribute-value links + change row all written.

#### Worked example: `submit-seller-products` (target shape)

The current implementation is at
`packages/core/src/workflows/product/workflows/submit-seller-products.ts`.
After this spec lands it becomes:

```ts
function (input: SubmitSellerProductsWorkflowInput) {
  // 1. seller permission check (product-attribute query, not module call)
  validateSellerProductPermissionsStep(permissionData)

  // 2. transform input: inject manage_inventory=false + created_by
  const productData = transform(input, ({ products, seller_id }) =>
    products.map((p) => ({
      ...p,
      created_by: "seller",
      created_by_actor: seller_id,
      variants: p.variants?.map((v) => ({
        ...v,
        manage_inventory: false,
      })),
    }))
  )

  // 3. stock create — single source of truth for the product row
  const createdProducts = stockCreateProductsWorkflow.runAsStep({
    input: { products: productData },
  })

  // 4. parallel: seller link + attribute-value links + open change
  const sellerLinks = transform(...)
  const attrLinks   = transform(...)
  const changeInput = transform(...)

  parallelize(
    createRemoteLinkStep(sellerLinks),    // product-seller-link
    createRemoteLinkStep(attrLinks),      // product_attribute_value_link
    createProductChangeWorkflow.runAsStep({ input: changeInput })
  )

  // 5. mirrored options for any attribute marked use_for_variants
  when({ input }, ({ input }) =>
    input.products.some((p) => p.attributes?.some((a) => a.use_for_variants))
  ).then(() => {
    createMirroredOptionsWorkflow.runAsStep({
      input: { createdProducts, sourceProducts: input.products },
    })
  })

  // 6. confirm immediately — submission is a closed change
  confirmProductChangeWorkflow.runAsStep({ input: confirmInput })

  // 7. event last
  emitEventStep({
    eventName: ProductWorkflowEvents.CREATED,
    data: transform({ createdProducts }, ({ createdProducts }) =>
      createdProducts.map((p) => ({ id: p.id }))
    ),
  })

  return new WorkflowResponse(createdProducts, { hooks: [...] })
}
```

#### Worked example: `requestProductChangesWorkflow` (admin route)

Pure `product-change` work — no stock product mutation, because
`requires_action` is computed:

```ts
function (input: { product_id: string; reason?: string; admin_id: string }) {
  const change = requestProductChangesWorkflow.runAsStep({ input })
  emitEventStep({
    eventName: ProductWorkflowEvents.CHANGES_REQUESTED,
    data: [{ id: input.product_id }],
  })
  return new WorkflowResponse(change)
}
```

The admin route `POST /admin/products/:id/request-changes` calls
this. No `updateProductsWorkflow.runAsStep` is needed because
`Product.status` doesn't carry `requires_action` anymore — the
computed field flips on the next list/detail query through
`getProductsWithDetailsWorkflow`.

#### Worked example: subscriber → workflow trigger (rename propagation)

Pattern-match
`medusa/packages/medusa/src/subscribers/payment-webhook.ts:52-53`.
Mirror-rename uses the same subscriber → workflow shape:

```ts
// packages/core/src/subscribers/mirror-product-attribute-rename.ts
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function ({
  event,
  container,
}: SubscriberArgs<{ id: string; new_name: string }>) {
  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run("mirror-product-attribute-rename", {
    input: {
      product_attribute_id: event.data.id,
      new_name: event.data.new_name,
    },
  })
}

export const config: SubscriberConfig = {
  event: "product-attribute.updated",
  context: { subscriberId: "mirror-product-attribute-rename-handler" },
}
```

A sibling subscriber listens to `product-attribute-value.updated` and
runs `mirror-product-attribute-value-rename`. Both subscribers stay
intentionally thin — all logic lives in the workflow.

#### Worked example: bulk operations (`batchProductAttributesWorkflow`)

Verbatim shape of
`medusa/packages/core/core-flows/src/product/workflows/batch-products.ts:95-116`
— do not invent a new bulk pattern.

```ts
export const batchProductAttributesWorkflow = createWorkflow(
  "batch-product-attributes",
  (input: WorkflowData<BatchProductAttributesInput>) => {
    const res = parallelize(
      when({ input }, ({ input }) => !!input.create?.length).then(() =>
        createProductAttributesStep(input.create!)
      ),
      when({ input }, ({ input }) => !!input.update?.length).then(() =>
        updateProductAttributesStep(input.update!)
      ),
      when({ input }, ({ input }) => !!input.delete?.length).then(() =>
        deleteProductAttributesStep(input.delete!)
      )
    )

    return new WorkflowResponse(
      transform({ res, input }, (data) => ({
        created: data.res[0] ?? [],
        updated: data.res[1] ?? [],
        deleted: data.input.delete ?? [],
      }))
    )
  }
)
```

#### Worked example: `getProductsWithDetailsWorkflow` (read wrapper)

Reference shape:
`medusa/packages/core/core-flows/src/order/workflows/get-order-detail.ts`.

```ts
function (input: { filters?: object; fields?: string[]; pagination?: ... }) {
  const { data: products } = useQueryGraphStep({
    entity: "product",
    fields: [
      ...(input.fields ?? DEFAULT_PRODUCT_FIELDS),
      "changes.status",
    ],
    filters: input.filters,
    pagination: input.pagination,
  })

  const enriched = transform({ products }, ({ products }) =>
    formatProducts(products)
  )

  return new WorkflowResponse(enriched)
}
```

Every admin / vendor product list and detail route calls this
wrapper instead of `useQueryGraphStep` directly.

### Workflow migration

Every workflow under
`packages/core/src/workflows/product/workflows/` that currently
resolves `Modules.PRODUCT` as the Mercur subclass must be updated.

**Workflows to delete (pure pass-throughs to stock Medusa).**
Each of these wraps a stock Medusa workflow with no marketplace
behavior beyond emitting a `mercur-*` event that duplicates the stock
event. Callers move to the stock workflow directly; events are picked
up from the stock event names. Files:

| File | Replacement |
|---|---|
| `create-product-variants.ts` | `@medusajs/medusa/core-flows::createProductVariantsWorkflow` |
| `update-product-variants.ts` | `@medusajs/medusa/core-flows::updateProductVariantsWorkflow` |
| `delete-product-variants.ts` | `@medusajs/medusa/core-flows::deleteProductVariantsWorkflow` |
| `create-product-categories.ts` | `@medusajs/medusa/core-flows::createProductCategoriesWorkflow` |
| `update-product-categories.ts` | `@medusajs/medusa/core-flows::updateProductCategoriesWorkflow` |
| `delete-product-categories.ts` | `@medusajs/medusa/core-flows::deleteProductCategoriesWorkflow` |
| `update-products.ts` | `@medusajs/medusa/core-flows::updateProductsWorkflow` (plus the `manage_inventory` defensive transform when called from the vendor surface) |
| `delete-products.ts` | `@medusajs/medusa/core-flows::deleteProductsWorkflow` |
| `create-products.ts` | `@medusajs/medusa/core-flows::createProductsWorkflow` — only kept if a non-vendor caller needs an unsubmitted create; otherwise delete and route every caller through `submit-seller-products` |

Their corresponding `steps/<workflow>.ts` files are deleted in the
same pass.

`batch-products.ts` is **kept** — it bundles update + delete with
status-transition event emission, which is real marketplace logic.
It is updated to call the stock workflows internally and to map
status transitions against the **new** product-status enum (without
`requires_action`, since that value moves to `ProductChange`).

**Workflows to keep / move.**

- **Vendor-scoped create** (`submit-seller-products`) — kept. Adds:
  seller permission check, seller link creation, ProductChange +
  STATUS_CHANGE action emission, immediate confirm, and the
  `manage_inventory = false` transform. Delegates to stock
  `createProductsWorkflow.runAsStep` instead of the deleted
  `create-products` wrapper.
- **Attribute CRUD** (`create-product-attributes`,
  `update-product-attributes`, `delete-product-attributes`,
  `create-product-attribute-values`,
  `update-product-attribute-values`,
  `delete-product-attribute-values`,
  `upsert-product-attribute-values`, `batch-product-attributes`,
  `validate-attribute-accepts-values`,
  `remove-attribute-from-product`) — moved to the `product-attribute`
  module and re-pointed at `productAttributeModuleService`.
- **Change-flow** (`confirm-products`, `reject-product`,
  `request-product-changes`, `resubmit-product`, plus the
  `validate-*` siblings) — moved to `product-change`.
  `request-product-changes` writes a `ProductChange` with status
  `REQUIRES_ACTION` (no Product column write).
- **Read-side wrapper** (`get-products-with-details`) — **new**.
  Wraps the stock product query, joins `*changes.status`, runs the
  `formatProducts` util in a `transform` step, and exposes
  `requires_action: boolean` on each product DTO. Every admin /
  vendor product list + detail route is re-pointed at this wrapper.

**Workflows to delete (brand).**

- `create-product-brands.ts`, `update-product-brands.ts`,
  `delete-product-brands.ts`, `link-sellers-to-product-brand.ts` —
  removed. Brand is now a category-scoped attribute; CRUD goes
  through the existing attribute workflows. The deletion is wired
  into the data migration so existing brand rows are rewritten as
  attribute-value rows before the files are removed.

The step file
`packages/core/src/workflows/product/steps/create-products.ts` is
deleted (no replacement wrapper). Callers move to
`createProductsWorkflow.runAsStep` from
`@medusajs/medusa/core-flows` directly, plus the manage_inventory
transform at the call site.

The `withMercur()` modules array drops the explicit
`@mercurjs/core/modules/product` entry (lines 45–52 of
`packages/core/src/with-mercur.ts`) and instead adds two new modules:

```ts
{ resolve: "@mercurjs/core/modules/product-attribute" },
{ resolve: "@mercurjs/core/modules/product-change" },
```

The build-time type shim from SPEC-006 (`.mercur/types.d.ts` /
`MercurProductModuleService` re-export) is removed.

### Event-constant cleanup (step 5 follow-up)

The legacy `packages/core/src/workflows/product/events.ts` file
duplicates names that are now owned by the new groups. During step 5
(when the legacy `workflows/product/workflows/*` group is deleted), the
legacy events file must be slimmed down accordingly.

| Constant in `workflows/product/events.ts` | Disposition |
|---|---|
| `ProductWorkflowEvents.CREATED` / `.UPDATED` / `.DELETED` / `.DRAFT` / `.PROPOSED` | **Keep**, but re-point at stock Medusa product events. Mercur no longer owns the per-product event surface for the basic lifecycle. |
| `ProductWorkflowEvents.PUBLISHED` | **Move semantics to** `ProductChangeWorkflowEvents.CONFIRMED` (the act of publishing is a confirmed change with a `STATUS_CHANGE → PUBLISHED` action). Keep the `product.published` constant if downstream subscribers still want a per-product signal — emitted by `applyProductChangeActionsWorkflow` when a STATUS_CHANGE → PUBLISHED action fires. |
| `ProductWorkflowEvents.CHANGES_REQUESTED` | **Drop.** Replaced by `ProductChangeWorkflowEvents.REQUIRES_ACTION` (per-change). Consumers that need a per-product signal resolve `product_id` via the `product_change_link` pivot. |
| `ProductWorkflowEvents.REJECTED` | **Drop.** Replaced by `ProductChangeWorkflowEvents.DECLINED`. |
| `ProductWorkflowEvents.RESUBMITTED` | **Drop.** Replaced by `ProductChangeWorkflowEvents.RESUBMITTED`. |
| `ProductWorkflowEvents.EDIT_REQUESTED` / `.EDIT_CANCELED` / `.EDIT_DECLINED` / `.EDIT_CONFIRMED` | **Drop.** The `product-edit` legacy flow is replaced by the standard change-lifecycle (`CREATED` / `REQUIRES_ACTION` / `CANCELED` / `DECLINED` / `CONFIRMED` on `ProductChangeWorkflowEvents`). |
| `ProductBrandWorkflowEvents.*` | **Drop entirely.** Brand is dropped — there are no brand workflows after this spec. |
| `ProductAttributeWorkflowEvents.*` | **Drop entirely.** Owned by `packages/core/src/workflows/product-attribute/events.ts` (the new module). |
| `ProductAttributeValueWorkflowEvents.*` | **Drop entirely.** Owned by `packages/core/src/workflows/product-attribute/events.ts`. |
| `ProductCategoryWorkflowEvents.*` | **Keep**, but re-point at stock Medusa product-category events. |
| `ProductVariantWorkflowEvents.*` | **Keep**, but re-point at stock Medusa product-variant events. |

After the cleanup, `workflows/product/events.ts` contains only the
slimmed `ProductWorkflowEvents` (basic lifecycle + optional
`product.published` shim), `ProductCategoryWorkflowEvents`, and
`ProductVariantWorkflowEvents`. Everything attribute / value / brand /
change-flow lives in the new module-specific event files
(`workflows/product-attribute/events.ts`,
`workflows/product-change/events.ts`).

**Event-name change**: the new files use hyphenated names
(`product-attribute.created`) where the legacy ones used underscored
names (`product_attribute.created`). Subscribers must be re-pointed.
The cleanup commit should also re-export the surviving event constants
from the top-level workflow barrel under stable names so consumers
don't need to know the file moved.

## User-Visible Behavior

- Vendor product **list** and **detail** views render with the field
  tree `*variants`, `*variants.attribute_values`,
  `*variant_attributes`, `*attribute_values`, plus stock `*options` /
  `*options.values`. `*custom_attributes` is no longer a valid field
  path. What was previously surfaced under `custom_attributes` appears
  under `options` instead.
- Vendor product **create** form:
  - "Add existing attributes" modal works exactly as before.
  - "Create new" no longer creates a Mercur `ProductAttribute` row.
    Instead it adds a stock Medusa `ProductOption` with a value list, and
    the resulting variants are spawned from `options × values` by the
    stock workflow.
  - Required attributes from the chosen category still appear and
    behave as before.
- Admin product views (admin detail page, lists) keep working with the
  updated field tree (custom attributes appear as options).
- Storefront product queries keep working — `product.variants[i].options`
  and `product.options[].values[]` are now the canonical surface for
  what used to be `custom_attributes`.
- Product approval flow (submit / confirm / reject / request changes /
  resubmit) keeps working; status / changelog moves to the
  `product-change` module without any user-visible difference.

## Dashboard impact (admin + vendor)

The audit below lists every dashboard surface touched by this spec.
Paths are concrete; the **Change** column is one of `delete`,
`rewire`, `rename`, `no-op`. Items are grouped by concern.

### `packages/admin`

#### Brand pages, hooks, and forms (delete entirely)

Brand becomes a category-scoped attribute, queried through the
existing attribute-value APIs filtered by `attribute.handle = "brand"`.
There is no separate brand surface.

| Path | Change | Notes |
|---|---|---|
| `src/pages/product-brands/` (entire folder, ~18 files) | delete | List, detail, create, edit, common — all dead. |
| `src/hooks/api/product-brands.tsx` | delete | `sdk.admin.productBrands.*` no longer exists. |
| `src/hooks/table/query/use-product-brand-table-query.tsx` | delete | |
| `src/hooks/table/filters/use-product-brand-table-filters.tsx` | delete | |
| `src/hooks/table/columns/use-product-brand-table-columns.tsx` | delete | |
| `src/pages/products/product-organization/components/product-organization-form/product-organization-form.tsx` (schema + brand picker, ~lines 22–95) | rewire | Replace brand `Select` with attribute-value picker scoped to `attribute.handle = "brand"`; selection writes a row to `product_attribute_value_link`. |
| `src/pages/products/product-detail/components/product-organization-section/product-organization-section.tsx` (~lines 73–84) | rewire | Read brand from `*attribute_values` filtered by `attribute.handle = "brand"`. |
| Sidebar / route map entries referencing `/product-brands` | delete | |
| i18n keys under `product-brands.*` | delete | |

#### `Product.status = 'requires_action'` removal

The enum value is gone; the new boolean lives on
`Product.requires_action` (computed). Every reference below either
drops the enum literal or reads the boolean instead.

| Path | Change | Notes |
|---|---|---|
| `src/pages/products/constants.ts` (line 8) | rewire | Drop `*custom_attributes,*custom_attributes.values` from `PRODUCT_DETAIL_FIELDS`; add `*requires_action,*changes.status` so the computed field and underlying changes resolve. |
| `src/pages/products/product-list/components/product-list-table/use-product-table-filters.tsx` (~lines 113–114) | rewire | Filter chip switches from `status: 'requires_action'` to `requires_action: true`. |
| `src/pages/products/product-edit/components/edit-product-form/edit-product-form.tsx` (lines 26, 132) | rewire | Status select drops `requires_action` option; "needs action" affordance reads computed boolean. |
| `src/pages/products/product-bulk-edit/schema.ts` (line 9) | rewire | Remove `requires_action` from the status zod enum. |
| `src/pages/products/product-bulk-edit/hooks/use-product-bulk-edit-columns.tsx` (line 20) | rewire | Remove `requires_action` from bulk-edit status options. |
| `src/pages/products/product-detail/components/product-general-section/product-general-section.tsx` (lines 20, 73) | rewire | Status switch reads stock enum only; "needs action" badge reads `requires_action` boolean. |
| `src/components/table/table-cells/product/product-status-cell/product-status-cell.tsx` (lines 17–19) | rewire | Drop `REQUIRES_ACTION` from the enum mapping; add a separate `<RequiresActionBadge />` driven by the computed boolean. |
| `src/hooks/table/filters/use-product-table-filters.tsx` (lines 129–130) | rewire | Same as list-table filters above. |

#### `ProductChange.status` rendering

`REQUIRES_ACTION` is a new status value. Any admin product-change
table/badge needs a label + color for it. Audit found no dedicated
product-changes admin page today; add a renderer to the shared
`product-change-status-cell` if/when one is added — out of scope for
this spec beyond reserving the i18n key
`product-changes.status.requires_action`.

#### `is_restricted` UI

Audit found **no** `is_restricted` UI on category in `packages/admin`
(the column was a server-only gate). Removing the column is a no-op
on the dashboard side — but the seller-permission error string
"Seller is restricted from categories" is no longer raised; any test
asserting it must be removed (handled in Verification).

### `packages/vendor`

#### Brand picker (rewire)

Vendor doesn't have a brand list page (audit confirmed). It does
have a brand selector in product organization:

| Path | Change | Notes |
|---|---|---|
| `src/pages/products/[id]/organization/product-organization-form/product-organization-form.tsx` (schema lines 23–28, brand hook lines 71–79, fields ~lines 85, 99) | rewire | Replace brand `Select` (using `sdk.vendor.productBrands.*`) with attribute-value picker scoped to `attribute.handle = "brand"`, populated from `sdk.vendor.productAttributes.query({ handle: "brand" })`. |

#### `Product.status = 'requires_action'` removal

| Path | Change | Notes |
|---|---|---|
| `src/pages/products/common/constants.ts` (lines 14–15) | rewire | Drop `*custom_attributes,*custom_attributes.values` from `PRODUCT_DETAIL_FIELDS`; add `*requires_action,*changes.status`. |
| `src/hooks/table/filters/use-product-table-filters.tsx` (lines 160–161) | rewire | Filter chip uses `requires_action: true` boolean. |
| `src/components/table/table-cells/product/product-status-cell/product-status-cell.tsx` (lines 17–19) | rewire | Drop `REQUIRES_ACTION` from the enum mapping; add `<RequiresActionBadge />`. |
| `src/pages/products/[id]/_components/product-general-section/product-general-section.tsx` (line 20) | rewire | Status switch reads stock enum only; "needs action" affordance reads computed boolean. |

#### Vendor product-create "Create new attribute" panel

The Mercur custom-attribute form in
`pages/products/create/components/product-create-attributes-form/`
(see "Vendor product-create form change" earlier in this spec)
already has the migration plan: the "Create new" tab is replaced by
the stock Medusa options panel. No additional dashboard work beyond
what's already in that section.

#### `is_restricted` UI

Audit found **no** `is_restricted` UI in `packages/vendor` either.
No-op on the dashboard side.

### SDK-level cleanup (shared by both)

Once `packages/core/src/api/admin/product-brands/*` and
`packages/core/src/api/vendor/product-brands/*` routes are removed,
the generated route map at
`packages/core-plugin/.mercur/_generated/index.ts` drops every
`productBrands.*` entry. Any dashboard import of
`sdk.admin.productBrands.*` / `sdk.vendor.productBrands.*` becomes a
type error — the audit above lists every site.

### New shared component

A small `<RequiresActionBadge />` lives in `@mercurjs/dashboard-shared`
(reads `Product.requires_action: boolean`, renders a yellow
`StatusBadge` with the i18n key `products.badges.requires_action`).
Both admin and vendor consume it; the per-package list/detail pages
above import it instead of branching on the legacy enum value.

## Verification

1. `bun install` succeeds against the new module layout.
2. `bun run lint` passes — there should be no remaining imports of
   `@mercurjs/core/modules/product` outside the new modules, no
   imports of the deleted brand workflows, and no imports of the
   deleted pure-pass-through workflows
   (`create-product-variants`, `update-product-variants`,
   `delete-product-variants`, `create-product-categories`,
   `update-product-categories`, `delete-product-categories`,
   `create-products`, `update-products`, `delete-products`,
   `create-product-brands`, `update-product-brands`,
   `delete-product-brands`, `link-sellers-to-product-brand`).
3. `bun run build` produces all packages, including the
   `core-plugin/.mercur/_generated/index.ts` route map. The map MUST
   contain joiner entries for `productAttribute` and `productChange`
   modules and for every new link.
4. Database migrations run cleanly on a fresh DB (`bun run dev`
   booting `apps/api` for the first time):
   - new tables owned by `product-attribute`: `product_attribute`,
     `product_attribute_value`. **No** `product_brand` table.
     **No** `product_extension` table.
   - new tables owned by `product-change`: `product_change`,
     `product_change_action`. `product_change.status` enum includes
     `REQUIRES_ACTION`.
   - new pivot/link tables: `product_change_link`,
     `product_option_attribute_link`,
     `product_option_value_attribute_value_link`. Existing pivots
     (`product_attribute_value_link`,
     `product_variant_attribute_value`,
     `product_variant_attribute`) are re-pointed at the new module
     joiner without data loss.
   - existing FK columns dropped:
     `product_attribute.product_id`, `product_change.product_id`,
     `product_brand.product_id` (if present on the legacy table),
     `product_category.is_restricted`, `product.is_restricted`,
     and the `requires_action` value from the `product.status`
     enum.
   - dropped tables: `product_brand`,
     `product_brand_seller_link` (and any other brand-only pivots).
5. Data-migration script runs against a snapshot DB containing rows
   from each of:
   - `ProductAttribute` with `product_id IS NOT NULL` (custom
     attributes — these become stock `ProductOption` rows).
   - `ProductChange` rows in all statuses (including a synthesized
     `REQUIRES_ACTION` row to confirm the new enum value migrates).
   - `ProductBrand` rows with seller whitelist links (these become
     `ProductAttributeValue` rows under the `brand` attribute).
   - `Product` rows with `status = 'requires_action'` (these are
     re-stamped to `proposed` and get a `ProductChange` with status
     `REQUIRES_ACTION`).

   After the migration:
   - `count(product_attribute WHERE product_id IS NOT NULL)` is `0`.
   - `count(product_option)` increases by the pre-migration count of
     custom attributes (modulo skipped rows that had no resolvable
     value).
   - `count(product_option_value)` increases by the pre-migration count
     of `ProductAttributeValue` children of custom attributes (plus one
     synthesized value per TEXT-typed custom attribute that had no
     children but had a stored value).
   - `count(product_attribute WHERE handle = 'brand')` ≥ 1 (one per
     category that previously had brands; values mapped from the
     legacy `product_brand` rows).
   - `count(product_attribute_value_link WHERE attribute.handle =
     'brand')` equals the pre-migration count of products that had a
     brand assigned.
   - `count(product_change WHERE status = 'REQUIRES_ACTION')` equals
     the pre-migration count of `Product.status = 'requires_action'`
     rows.
   - `count(product_change)`, `count(product_change_action)` are
     unchanged otherwise.
   - `product_brand` table is dropped after the migration completes;
     no orphan rows remain.
6. Integration tests:
   - `bun run test:integration:tests -- products` passes against the
     new module shape (vendor + admin + store routes).
   - `bun run test:integration:tests -- attributes` passes
     (product-attribute module CRUD).
   - `bun run test:integration:tests -- product-changes` passes
     (submit / confirm / reject / request-changes / resubmit).
   - New test: vendor `POST /vendor/products` with `options: [...]`
     payload produces a product whose variants are
     `options × values` from stock Medusa, **plus** any
     `attribute_values[]` from the linked attribute path.
   - New test: querying `/vendor/products?fields=*variants,\
     *variants.attribute_values,*variants.attribute_values.attribute,\
     *variant_attributes,*variant_attributes.values,\
     *options,*options.values,\
     *attribute_values,*attribute_values.attribute`
     returns the same JSON shape as before the migration for the same
     data set, with what used to live under `custom_attributes` now
     surfaced under `options`.
   - New test: `*custom_attributes` is rejected by the field-tree
     validator (no joiner alias matches), proving the path is gone.
   - New test (mirrored options): vendor creates a product with
     `attributes: [{ attribute_id, value_ids, use_for_variants: true }]`.
     Assert: a `ProductOption` is created with the attribute's title,
     `ProductOptionValue` rows are created for each chosen value, and
     `product_option_attribute_link` + `product_option_value_attribute_value_link`
     rows exist with fingerprints matching the source.
   - New test (rename propagation): renaming the source
     `ProductAttribute.name` triggers the subscriber and the linked
     `ProductOption.title` updates within one tick. Same for
     `ProductAttributeValue.name` → linked `ProductOptionValue.value`.
   - New test (delete soft-block): deleting a
     `ProductAttributeValue` while a linked
     `ProductOptionValue` exists raises a controlled error.
   - New test (`requires_action` computed): admin calls
     `request-product-changes` → a `ProductChange` with status
     `REQUIRES_ACTION` is created → `GET /vendor/products/:id`
     (routed through `getProductsWithDetailsWorkflow`) returns
     `requires_action: true`. Vendor resubmits → the change moves to
     `CONFIRMED` → the same GET returns `requires_action: false`.
     Asserts the field is computed, not stored.
   - New test (`requires_action` field tree): `*requires_action`
     resolves through the wrapper; product list and detail endpoints
     return the boolean for every row without an explicit DB column.
   - New test (brand-as-attribute): vendor `POST /vendor/products`
     with `attributes: [{ attribute_id: <brand_attr_id>, value_ids:
     [<acme_value_id>] }]` produces a product with a single brand
     value linked via `product_attribute_value_link`. Asserts the
     constraint `count(values where attribute.handle = 'brand') = 1`
     per product and that there is no `product_brand` row.
   - New test (`manage_inventory` invariant): vendor
     `POST /vendor/products` with `variants: [{ ... }]` (no
     `manage_inventory` in payload) produces variants with
     `manage_inventory = false`. Asserts: even with
     `variants: [{ ..., manage_inventory: true }]` the persisted row
     ends up `false` (the wrapper transform overrides the input).
     `PATCH /vendor/products/:id` with `variants: [{ ...,
     manage_inventory: true }]` is either rejected or persists
     `false`.
   - New test (`is_restricted` removal):
     `product_category.is_restricted` column does not exist;
     `product.is_restricted` column does not exist; the validator
     step `validate-seller-product-permissions` no longer raises
     "Seller is restricted from categories" because the column it
     read is gone.
   - New test (simple product default option): vendor
     `POST /vendor/products` with no `options[]` and no
     `attributes[]` flagged `use_for_variants: true` succeeds. The
     persisted product has exactly one `ProductOption` with title
     `"Default option"` and one `ProductOptionValue` with value
     `"Default option value"`; the single generated variant is
     anchored to that option value. Asserts the wrapper's default-
     option transform fires before `validateProductInputStep`.
   - New test (brand cardinality on create): vendor
     `POST /vendor/products` with `attributes: [{ attribute_id:
     <brand_attr>, value_ids: [acmeId, contosoId] }]` fails with
     `MedusaError(INVALID_DATA, /one brand per product/)`. No
     `product_attribute_value_link` rows are written (validator runs
     first, throws before any link mutation).
   - New test (brand cardinality on update): create a product with
     one brand value; then `PATCH /vendor/products/:id` with
     `attributes: [{ attribute_id: <brand_attr>, value_ids:
     [contosoId] }]` while the existing acme link is still present.
     The validator's union check counts both the existing and the
     incoming and fails identically.
   - New test (pivot ALTER TABLE assertions): after migrations run,
     `\d product_attribute_value_link` shows columns `id`,
     `product_id`, `product_attribute_value_id`, `created_at`,
     `updated_at`, `deleted_at`; primary key is on `id`; a partial
     unique index exists on `(product_id, product_attribute_value_id)
     WHERE deleted_at IS NULL`. Same shape assertions for
     `product_variant_attribute_value` and
     `product_variant_attribute`.
   - New test (joiner config registration): the joiner registry
     resolves `Modules.PRODUCT_ATTRIBUTE` →
     `productAttributeModule.linkable.productAttribute` and
     `productAttributeModule.linkable.productAttributeValue` at
     runtime; same for `Modules.PRODUCT_CHANGE` →
     `productChangeModule.linkable.productChange`. Asserts the
     `defineJoinerConfig` call in each new module took effect.
   - New test (`defineLink` singular field rule): the link file
     `product-variant-attribute-link.ts` declares `field:
     "variant_attribute"` (singular) and `isList: true`. The
     resulting `Product` joiner exposes `variant_attributes`
     (plural, one `s`). The same property accessed as
     `variant_attributess` is undefined. Catches the regression
     where an implementer copies the plural alias name into `field`.
7. Admin/vendor dashboards build (`bun run build` inside
   `packages/admin` and `packages/vendor`) and the vendor product-create
   form renders both Add-Existing and the new Stock-Options panel.
   Dashboard regression checks:
   - `packages/admin/src/pages/product-brands/` no longer exists; a
     grep for `sdk.admin.productBrands` returns zero matches.
   - `packages/vendor` grep for `sdk.vendor.productBrands` returns
     zero matches.
   - `packages/admin` and `packages/vendor` greps for the string
     literal `requires_action` return zero matches inside
     `Product.status` enum contexts (the string may still appear as
     a `ProductChange.status` value and as the i18n key
     `products.badges.requires_action`).
   - The `<RequiresActionBadge />` component exists in
     `@mercurjs/dashboard-shared` and is consumed by the product
     list, detail, and bulk-edit pages in both dashboards.
   - Vendor product-organization form renders a brand picker backed
     by attribute values where `attribute.handle = "brand"`;
     selecting a brand writes a `product_attribute_value_link` row
     (asserted via UI integration test or component snapshot).
8. `withMercur()` no longer registers
   `@mercurjs/core/modules/product`. A grep for that string returns
   only this spec and `claude-progress.md`.
9. SPEC-006's `MercurProductModuleService` re-export and the
   `.mercur/types.d.ts` shim's product module declaration are removed
   (or marked obsolete in SPEC-006 with a forward-pointer to this
   spec).

## Evidence

_To be filled in by the agent. Required artefacts:_

1. PR(s) merged (link), with passing CI.
2. Output of `bun run lint` and `bun run build` from a clean tree
   (paste tail of the log).
3. `psql` output of `\dt product_*` against a freshly-migrated DB,
   showing the new tables and the absence of dropped FK columns.
4. `psql` output of the row-count sanity check from Verification step 5.
5. Test summary from
   `bun run test:integration:tests -- products attributes product-changes`.
6. Diff of `vendorProductFields` — `custom_attributes` paths replaced
   with `options` / `options.values`. Integration test asserting the
   JSON shape of a product query for the existing data set: legacy
   `custom_attributes` payload appears under `options` post-migration.
7. Row-count report from the data-migration script (custom attributes
   converted, option-values created, rows skipped with reasons), plus
   the dry-run output from the `--check` pass.

## Notes

- **Influence from `/Users/viktorholik/Desktop/medusa`**: use the stock
  `packages/modules/product` layout and the stock
  `packages/core/core-flows/src/product/workflows/*` as the reference
  for what the Mercur side is delegating to. The thin Mercur wrappers
  should mirror the stock workflow input/output exactly so consumers
  can swap them transparently.
- **Order matters when implementing**:
  1. Land the two new modules with empty migrations and a joiner
     config first; this gets the `Module.linkable.*` exports in place.
  2. Land the link files. Field-tree validation will then accept the
     new alias paths in dev.
  3. Land the data-migration script (idempotent, dry-runnable).
  4. Land workflow wrappers, one workflow group at a time, behind a
     feature flag if needed.
  5. Drop the Mercur product module registration from `withMercur()`.
  6. Delete `packages/core/src/modules/product/` and update SPEC-006.
- **Risk: shared `PriceSet` from SPEC-007.** SPEC-007 relies on
  `ProductVariant ↔ PriceSet` being native Medusa. That stays true here
  — the variant is stock Medusa after this spec lands, so the
  shared-PriceSet model is unaffected. The variant's computed
  `manage_inventory = false` constant (override line 28-29) is dropped
  silently; downstream code that depends on the constant must be
  audited and either rely on Medusa's real column or be removed.
- **Out of scope for this spec**:
  - Search reindexing (Algolia / Meilisearch). The reindexers read the
    same field paths via the new links; no surface change expected,
    but a smoke test against `apps/api` with search enabled is
    required before close.
  - The `vendor-product-attribute` module under
    `packages/core/src/modules/vendor-product-attribute/` already
    exists as a separate concern; this spec does not touch it.
- **SPEC-006 follow-up**: once the Mercur product module is gone, the
  build-wrapper / type-shim machinery from SPEC-006 still exists for
  other modules but no longer declares
  `ModuleImplementations.product`. The shim emitter must skip the
  product re-declaration. Update SPEC-006 to record that the product
  surface returned to stock and that the shim is now empty by default
  for fresh projects.
