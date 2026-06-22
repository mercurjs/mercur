import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

type AttrAccum = {
  id: string
  name?: string
  handle?: string | null
  type?: string
  is_variant_axis?: boolean
  is_required?: boolean
  rank?: number
  all_values: { id: string; name: string; rank?: number }[]
  values: { id: string; name: string; rank?: number }[]
}

/**
 * Builds a unified `product.attributes` array on each product from the
 * linked value ids (single-hop joiner) by issuing TWO bulk queries
 * against the product-attribute module — one for every selected value
 * across all input products, one for every attribute's full value set.
 * Each entry per product surfaces:
 *
 *   - `values`: the values selected on this product (sorted by rank).
 *   - `all_values`: the parent attribute's full value set so the edit
 *     form can render the dropdown with `values` pre-selected.
 *
 * Always seeds `product.attributes = []` even when there's nothing to
 * enrich, so downstream code can rely on the field existing. Cross-
 * module chained populate (`attribute_values.attribute.values`) crashes
 * Medusa's joiner here because the value side lives in another module —
 * splitting the read avoids that path entirely.
 *
 * Mutates each product object in place.
 */
export async function enrichProductAttributes(
  scope: MedusaContainer,
  products: any[],
): Promise<void> {
  if (!products?.length) return

  // Guarantee the field is present even if the product carries no
  // attribute joiner data.
  for (const product of products) {
    if (product && !product.attributes) product.attributes = []
  }

  // Collect linked value ids and product-scoped attribute ids across
  // the whole batch so we issue one query per module entity instead of
  // N (where N = list size).
  const linkedValueIds = new Set<string>()
  const inlineAttributeIds = new Set<string>()
  for (const product of products) {
    for (const v of (product?.attribute_values ?? []) as Array<{
      id?: string
    }>) {
      if (typeof v?.id === "string") linkedValueIds.add(v.id)
    }
    for (const a of (product?.scoped_attributes ?? []) as Array<{
      id?: string
    }>) {
      if (typeof a?.id === "string") inlineAttributeIds.add(a.id)
    }
  }

  if (!linkedValueIds.size && !inlineAttributeIds.size) return

  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: selectedValues } = linkedValueIds.size
    ? await query.graph({
        entity: "product_attribute_value",
        fields: ["id", "name", "rank", "attribute_id"],
        filters: { id: Array.from(linkedValueIds) },
      })
    : {
        data: [] as Array<{
          id: string
          name: string
          rank?: number
          attribute_id: string | null
        }>,
      }

  const selectedValueById = new Map<
    string,
    {
      id: string
      name: string
      rank?: number
      attribute_id: string | null
    }
  >()
  for (const v of selectedValues as Array<{
    id: string
    name: string
    rank?: number
    attribute_id: string | null
  }>) {
    selectedValueById.set(v.id, v)
  }

  const attributeIds = new Set<string>(inlineAttributeIds)
  for (const v of selectedValues as Array<{
    attribute_id: string | null
  }>) {
    if (v.attribute_id) attributeIds.add(v.attribute_id)
  }

  if (!attributeIds.size) return

  const { data: attributes } = await query.graph({
    entity: "product_attribute",
    fields: [
      "id",
      "name",
      "handle",
      "type",
      "is_variant_axis",
      "is_required",
      "rank",
      "product_id",
    ],
    filters: { id: Array.from(attributeIds) },
  })
  const { data: allValues } = await query.graph({
    entity: "product_attribute_value",
    fields: ["id", "name", "rank", "attribute_id"],
    filters: { attribute_id: Array.from(attributeIds) },
  })

  const attrTemplateById = new Map<
    string,
    Omit<AttrAccum, "values"> & { all_values: AttrAccum["all_values"] }
  >()
  for (const attr of attributes as Array<{
    id: string
    name?: string
    handle?: string | null
    type?: string
    is_variant_axis?: boolean
    is_required?: boolean
    rank?: number
  }>) {
    attrTemplateById.set(attr.id, {
      id: attr.id,
      name: attr.name,
      handle: attr.handle ?? null,
      type: attr.type,
      is_variant_axis: !!attr.is_variant_axis,
      is_required: !!attr.is_required,
      rank: attr.rank,
      all_values: [],
    })
  }
  for (const v of allValues as Array<{
    id: string
    name: string
    rank?: number
    attribute_id: string | null
  }>) {
    if (!v.attribute_id) continue
    const tmpl = attrTemplateById.get(v.attribute_id)
    if (!tmpl) continue
    tmpl.all_values.push({ id: v.id, name: v.name, rank: v.rank })
  }
  for (const tmpl of attrTemplateById.values()) {
    tmpl.all_values.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }

  for (const product of products) {
    if (!product) continue
    const productValueIds: string[] = (
      (product.attribute_values ?? []) as Array<{ id?: string }>
    )
      .map((v) => v?.id)
      .filter((id): id is string => typeof id === "string")
    const productScopedAttrIds: string[] = (
      (product.scoped_attributes ?? []) as Array<{ id?: string }>
    )
      .map((a) => a?.id)
      .filter((id): id is string => typeof id === "string")

    const attrsForProduct = new Map<string, AttrAccum>()

    for (const aid of productScopedAttrIds) {
      const tmpl = attrTemplateById.get(aid)
      if (tmpl)
        attrsForProduct.set(aid, {
          ...tmpl,
          all_values: [...tmpl.all_values],
          values: [],
        })
    }
    for (const vid of productValueIds) {
      const v = selectedValueById.get(vid)
      if (!v?.attribute_id) continue
      let attr = attrsForProduct.get(v.attribute_id)
      if (!attr) {
        const tmpl = attrTemplateById.get(v.attribute_id)
        if (!tmpl) continue
        attr = {
          ...tmpl,
          all_values: [...tmpl.all_values],
          values: [],
        }
        attrsForProduct.set(v.attribute_id, attr)
      }
      attr.values.push({ id: v.id, name: v.name, rank: v.rank })
    }

    for (const attr of attrsForProduct.values()) {
      attr.values.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    }

    product.attributes = [...attrsForProduct.values()].sort(
      (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    )
  }
}

type ProductAttributeValueRow = {
  id: string
  name: string
  attribute?: {
    id: string
    name?: string
    handle?: string | null
    type?: string
    is_variant_axis?: boolean
  } | null
}

type GroupedProductAttribute = {
  id: string
  name?: string
  handle?: string | null
  type?: string
  is_variant_axis?: boolean
  values: { id: string; name: string }[]
}

/**
 * Groups `product.attribute_values` (from a 2-hop graph fetch with
 * `attribute_values.attribute.*`) into one entry per attribute, each
 * carrying only the values selected on this product. Pass
 * `options.attributeId` to narrow the result to a single attribute for
 * detail endpoints.
 */
export function groupProductAttributeValues(
  attributeValues: ProductAttributeValueRow[] | undefined,
  options?: { attributeId?: string },
): GroupedProductAttribute[] {
  const byId = new Map<string, GroupedProductAttribute>()
  for (const v of attributeValues ?? []) {
    const attr = v.attribute
    if (!attr?.id) continue
    if (options?.attributeId && attr.id !== options.attributeId) continue
    let grouped = byId.get(attr.id)
    if (!grouped) {
      grouped = {
        id: attr.id,
        name: attr.name,
        handle: attr.handle ?? null,
        type: attr.type,
        is_variant_axis: !!attr.is_variant_axis,
        values: [],
      }
      byId.set(attr.id, grouped)
    }
    grouped.values.push({ id: v.id, name: v.name })
  }
  return Array.from(byId.values())
}
