import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  AttributeType,
  type ProductAttributeDTO,
  type ProductAttributeValueDTO,
  type WrappedProductAttributeDTO,
  type WrappedProductAttributeValueDTO,
} from "@mercurjs/types"

/**
 * Types with a fixed, selectable value catalog — the only ones for which
 * `all_values` (the full set of pickable values) is meaningful. Free-form
 * types (`text`/`unit`) accumulate every product's entered value on the
 * attribute, so their `values` are NOT a catalog; `toggle` is a boolean
 * switch. Backfilling `all_values` is restricted to these select types.
 */
const SELECT_TYPES = new Set<AttributeType>([
  AttributeType.SINGLE_SELECT,
  AttributeType.MULTI_SELECT,
])

const byRank = (
  a: WrappedProductAttributeValueDTO,
  b: WrappedProductAttributeValueDTO,
) => (a.rank ?? 0) - (b.rank ?? 0)

const toValue = (
  v: ProductAttributeValueDTO,
): WrappedProductAttributeValueDTO => ({ id: v.id, name: v.name, rank: v.rank })

/**
 * Builds a unified `product.attributes` array on each product purely from the
 * link relations already present on the product object — no extra queries:
 *
 *   - `product.scoped_attributes` (read-only product → product-attribute link):
 *     product-scoped inline attributes, surfaced with their full value set.
 *   - `product.product_attribute_values` (the `product_attribute_value_link`
 *     pivot): the values selected on this product — both non-axis selects and
 *     the selected axis subset (axis values are linked here too so the variant
 *     axis "selected of available" is readable without the broken
 *     `product.options` populate). Each row carries its parent `attribute`.
 *
 * Each emitted entry exposes:
 *   - `values`: the values selected on this product (sorted by rank).
 *   - `all_values`: the parent attribute's full value set so the edit form can
 *     render the dropdown with `values` pre-selected (populated for scoped
 *     attributes; for global attributes the dashboard merges the catalog set).
 *
 * Dangling links (a pivot row whose value was deleted) resolve to `null` in the
 * graph; those are filtered so the response never contains a `null` selection.
 *
 * Always seeds `product.attributes = []` so downstream code can rely on the
 * field existing. Mutates each product in place.
 */
export function wrapProductWithProductAttributes(products: any[]): void {
  if (!products?.length) return

  for (const product of products) {
    if (!product) continue

    const attrsById = new Map<string, WrappedProductAttributeDTO>()

    // 1. Seed product-scoped inline attributes first — they carry the full
    //    value set (`all_values`); selected values are filled in step 2.
    const scopedAttributes: ProductAttributeDTO[] =
      product.scoped_attributes ?? []

    for (const scoped of scopedAttributes) {
      attrsById.set(scoped.id, {
        id: scoped.id,
        name: scoped.name,
        handle: scoped.handle ?? null,
        type: scoped.type,
        is_variant_axis: !!scoped.is_variant_axis,
        is_required: !!scoped.is_required,
        rank: scoped.rank,
        is_scoped: true,
        all_values: (scoped.values ?? []).map(toValue),
        values: [],
      })
    }

    // 2. Selected values via the product_attribute_value_link pivot (non-axis
    //    selects + selected axis subset). The product-side alias is
    //    `product_attribute_values`. Skip `null` rows (dangling links).
    const linkedValues: ProductAttributeValueDTO[] =
      product.product_attribute_values ?? []

    for (const value of linkedValues) {
      const attributeId = value.attribute?.id ?? value.attribute_id
      if (!attributeId) continue

      let entry = attrsById.get(attributeId)
      if (!entry) {
        const attribute = value.attribute
        entry = {
          id: attributeId,
          name: attribute?.name,
          handle: attribute?.handle ?? null,
          type: attribute?.type,
          is_variant_axis: !!attribute?.is_variant_axis,
          is_required: !!attribute?.is_required,
          rank: attribute?.rank,
          is_scoped: false,
          all_values: (attribute?.values ?? []).map(toValue),
          values: [],
        }
        attrsById.set(attributeId, entry)
      }

      entry.values.push({
        id: value.id,
        name: value.name ?? "",
        rank: value.rank,
      })
    }

    for (const entry of attrsById.values()) {
      entry.all_values.sort(byRank)
      entry.values.sort(byRank)
    }

    product.attributes = [...attrsById.values()].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    )
  }
}

/**
 * Async wrapper used by the product GET/POST routes. First groups the already
 * fetched link graph into `product.attributes` in memory, then backfills
 * `all_values` (the parent attribute's full value set) for **global**
 * attributes with one batched query.
 *
 * Why the extra query: a product-scoped attribute carries its full value set
 * via the `scoped_attributes.values` populate, but a global (non-scoped)
 * attribute can only reach it through
 * `product_attribute_values.attribute.values` — a cross-link 2-hop chained
 * populate that resolves empty on the remote joiner (the documented
 * SPEC-014 limitation). We resolve it directly with a single in-module
 * `product_attribute → values` read (the same single-hop the workflows use)
 * and fill in any entry whose `all_values` came back empty.
 */
export async function enrichProductAttributes(
  scope: MedusaContainer,
  products: any[],
): Promise<void> {
  wrapProductWithProductAttributes(products)
  if (!products?.length) return

  // Select-type attribute ids that still lack their full value set after the
  // in-memory grouping (global selects; scoped ones already have `all_values`).
  // Free-form (text/unit) and toggle types are skipped — their `values` are
  // not a pickable catalog.
  const missingIds = new Set<string>()
  for (const product of products) {
    for (const attr of (product?.attributes ??
      []) as WrappedProductAttributeDTO[]) {
      if (SELECT_TYPES.has(attr.type as AttributeType) && !attr.all_values?.length) {
        missingIds.add(attr.id)
      }
    }
  }
  if (!missingIds.size) return

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "values.id", "values.name", "values.rank"],
    filters: { id: Array.from(missingIds) },
  })

  const valuesById = new Map<string, WrappedProductAttributeValueDTO[]>(
    ((data ?? []) as ProductAttributeDTO[]).map((a) => [
      a.id,
      (a.values ?? []).map(toValue).sort(byRank),
    ]),
  )

  for (const product of products) {
    for (const attr of (product?.attributes ??
      []) as WrappedProductAttributeDTO[]) {
      if (!attr.all_values?.length) {
        const full = valuesById.get(attr.id)
        if (full?.length) {
          attr.all_values = full
        }
      }
    }
  }
}
