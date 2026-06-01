import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

type AttrAccum = {
  id: string
  name?: string
  handle?: string | null
  type?: string
  is_variant_axis?: boolean
  rank?: number
  all_values: { id: string; name: string; rank?: number }[]
  values: { id: string; name: string; rank?: number }[]
}

/**
 * Sync placeholder kept for backwards-compatibility callers that don't
 * have the container in scope. It just initializes `product.attributes
 * = []` so downstream code doesn't crash when the response was queried
 * without the attribute joiner. Real work happens in
 * `enrichProductAttributes`.
 */
export function formatProductAttributes(product: any): void {
  if (!product) return
  if (!product.attributes) product.attributes = []
}

/**
 * Builds a unified `product.attributes` array from the product's linked
 * value ids (single-hop joiner) by issuing follow-up queries against
 * the product-attribute module directly. Each entry includes:
 *
 *   - `values`: the values selected on this product (sorted by rank).
 *   - `all_values`: the parent attribute's full value set so the edit
 *     form can render the dropdown with `values` pre-selected.
 *
 * Cross-module chained populate (`attribute_values.attribute.values`)
 * crashes Medusa's joiner here because the value side lives in another
 * module — splitting the read avoids that path entirely.
 */
export async function enrichProductAttributes(
  scope: MedusaContainer,
  product: any,
): Promise<void> {
  if (!product) return

  const valueIds = (
    (product.attribute_values ?? []) as Array<{ id?: string }>
  )
    .map((v) => v?.id)
    .filter((id): id is string => typeof id === "string")

  // Also pick up inline-scoped attributes (product_id FK) so the edit
  // form sees them even if no values are linked yet.
  const scopedIds = (
    (product.scoped_attributes ?? []) as Array<{ id?: string }>
  )
    .map((a) => a?.id)
    .filter((id): id is string => typeof id === "string")

  if (!valueIds.length && !scopedIds.length) {
    product.attributes = []
    return
  }

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: selectedValues } = valueIds.length
    ? await query.graph({
        entity: "product_attribute_value",
        fields: ["id", "name", "rank", "attribute_id"],
        filters: { id: valueIds },
      })
    : { data: [] as Array<{ id: string; name: string; rank?: number; attribute_id: string | null }> }

  const attributeIds = Array.from(
    new Set(
      [
        ...scopedIds,
        ...(
          selectedValues as Array<{ attribute_id: string | null }>
        )
          .map((v) => v.attribute_id)
          .filter((id): id is string => Boolean(id)),
      ],
    ),
  )

  if (!attributeIds.length) {
    product.attributes = []
    return
  }

  const { data: attributes } = await query.graph({
    entity: "product_attribute",
    fields: [
      "id",
      "name",
      "handle",
      "type",
      "is_variant_axis",
      "rank",
      "product_id",
    ],
    filters: { id: attributeIds },
  })
  const { data: allValues } = await query.graph({
    entity: "product_attribute_value",
    fields: ["id", "name", "rank", "attribute_id"],
    filters: { attribute_id: attributeIds },
  })

  const attrsById = new Map<string, AttrAccum>()
  for (const attr of attributes as Array<{
    id: string
    name?: string
    handle?: string | null
    type?: string
    is_variant_axis?: boolean
    rank?: number
  }>) {
    attrsById.set(attr.id, {
      id: attr.id,
      name: attr.name,
      handle: attr.handle ?? null,
      type: attr.type,
      is_variant_axis: !!attr.is_variant_axis,
      rank: attr.rank,
      all_values: [],
      values: [],
    })
  }

  for (const v of allValues as Array<{
    id: string
    name: string
    rank?: number
    attribute_id: string | null
  }>) {
    if (!v.attribute_id) continue
    const attr = attrsById.get(v.attribute_id)
    if (!attr) continue
    attr.all_values.push({ id: v.id, name: v.name, rank: v.rank })
  }

  for (const v of selectedValues as Array<{
    id: string
    name: string
    rank?: number
    attribute_id: string | null
  }>) {
    if (!v.attribute_id) continue
    const attr = attrsById.get(v.attribute_id)
    if (!attr) continue
    attr.values.push({ id: v.id, name: v.name, rank: v.rank })
  }

  for (const attr of attrsById.values()) {
    attr.all_values.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    attr.values.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }

  product.attributes = [...attrsById.values()].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
  )
}
