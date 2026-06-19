import type {
  ProductAttributeDTO,
  ProductAttributeValueDTO,
  WrappedProductAttributeDTO,
  WrappedProductAttributeValueDTO,
} from "@mercurjs/types"

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
 *   - `product.product_attribute_values` (the `product_attribute_value_link`
 *     pivot): the non-axis values selected on this product. Each row carries
 *     its parent `attribute` (and the attribute's full `values` set when the
 *     query fetched the 2-hop path), so we group selected values per attribute.
 *   - `product.scoped_attributes` (read-only product → product-attribute link):
 *     product-scoped inline attributes, surfaced with their full value set.
 *
 * Each emitted entry exposes:
 *   - `values`: the values selected on this product (sorted by rank).
 *   - `all_values`: the parent attribute's full value set so the edit form can
 *     render the dropdown with `values` pre-selected.
 *
 * Always seeds `product.attributes = []` so downstream code can rely on the
 * field existing. Mutates each product in place.
 */
export function wrapProductWithProductAttributes(products: any[]): void {
  if (!products?.length) return

  for (const product of products) {
    if (!product) continue

    const attrsById = new Map<string, WrappedProductAttributeDTO>()

    // 1. Non-axis selected values via the product_attribute_value_link pivot.
    //    The product-side graph alias for this link is `product_attribute_values`.
    const linkedValues: ProductAttributeValueDTO[] =
      product.product_attribute_values ?? []

    for (const value of linkedValues) {
      const attributeId = value?.attribute?.id ?? value?.attribute_id
      if (!attributeId || typeof value?.id !== "string") continue

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

    // 2. Product-scoped inline attributes via the read-only link.
    const scopedAttributes: ProductAttributeDTO[] =
      product.scoped_attributes ?? []

    for (const scoped of scopedAttributes) {
      if (typeof scoped?.id !== "string" || attrsById.has(scoped.id)) continue

      attrsById.set(scoped.id, {
        id: scoped.id,
        name: scoped.name,
        handle: scoped.handle ?? null,
        type: scoped.type,
        is_variant_axis: !!scoped.is_variant_axis,
        is_required: !!scoped.is_required,
        rank: scoped.rank,
        all_values: (scoped.values ?? []).map(toValue),
        values: [],
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
 * Async-signature wrapper used by the product GET/POST routes. The
 * admin/vendor query-config already fetches the full attribute graph
 * (`attribute_values.attribute.values`, `scoped_attributes`), so this just
 * groups it into `product.attributes` in memory — no extra queries. The
 * `scope` argument is accepted for call-site symmetry and future store
 * enrichment (whose query-config is single-hop) but is currently unused.
 */
export async function enrichProductAttributes(
  _scope: unknown,
  products: any[],
): Promise<void> {
  wrapProductWithProductAttributes(products)
}
