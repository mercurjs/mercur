import { AttributeType } from "@mercurjs/types"

/**
 * Computes a unified `attributes` array on the product by merging
 * variant_attributes, custom_attributes, and attribute_values into
 * a single grouped structure with values nested under each attribute.
 *
 * For non-select types (text, unit, toggle), values are cleared since
 * they don't have predefined option sets.
 *
 * Mutates the product object in place.
 */
export function formatProductAttributes(product: any): void {
  const hasAttrData =
    product.variant_attributes ||
    product.custom_attributes ||
    product.attribute_values

  if (!hasAttrData) return

  const attrsById = new Map<string, any>()

  for (const attr of product.variant_attributes ?? []) {
    attrsById.set(attr.id, { ...attr, values: [...(attr.values ?? [])] })
  }

  for (const attr of product.custom_attributes ?? []) {
    if (!attrsById.has(attr.id)) {
      attrsById.set(attr.id, {
        ...attr,
        values: [...(attr.values ?? [])],
      })
    }
  }

  for (const val of product.attribute_values ?? []) {
    if (!val.attribute) continue
    const attrId = val.attribute.id ?? val.attribute_id
    if (!attrId || attrsById.has(attrId)) continue
    attrsById.set(attrId, { ...val.attribute, values: [] })
  }

  const productValueIds = new Set(
    (product.attribute_values ?? []).map((v: any) => v.id)
  )

  for (const attr of attrsById.values()) {
    if (
      attr.type !== AttributeType.SINGLE_SELECT &&
      attr.type !== AttributeType.MULTI_SELECT
    ) {
      attr.values = []
      continue
    }

    attr.values = (attr.values ?? []).filter((v: any) =>
      productValueIds.has(v.id)
    )
    attr.values.sort((a: any, b: any) => (a.rank ?? 0) - (b.rank ?? 0))
  }

  product.attributes = [...attrsById.values()].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
  )
}
