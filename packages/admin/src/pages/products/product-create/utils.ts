import { HttpTypes } from "@medusajs/types"
import { ProductCreateSchemaType } from "./types"

export const normalizeProductFormValues = (
  values: ProductCreateSchemaType & {
    status: HttpTypes.AdminProductStatus
    regionsCurrencyMap: Record<string, string>
  }
): HttpTypes.AdminCreateProduct => {
  const thumbnail = values.media?.find((media) => media.isThumbnail)?.url
  const images = values.media
    ?.filter((media) => !media.isThumbnail)
    .map((media) => ({ url: media.url }))

  const { variantAttributes, productAttributes, attributeValues } =
    normalizeFormAttributes(values.attributes ?? [])

  return {
    is_giftcard: false,
    status: values.status,
    tags: values?.tags?.length
      ? values.tags?.map((tag) => ({ id: tag }))
      : undefined,
    images,
    collection_id: values.collection_id || undefined,
    categories: values.category_id ? [{ id: values.category_id }] : undefined,
    type_id: values.type_id || undefined,
    seller_ids: values.seller_id ? [values.seller_id] : undefined,
    handle: values.handle?.trim(),
    origin_country: values.origin_country || undefined,
    material: values.material || undefined,
    mid_code: values.mid_code || undefined,
    hs_code: values.hs_code || undefined,
    thumbnail,
    title: values.title.trim(),
    subtitle: values.subtitle?.trim(),
    description: values.description?.trim(),
    discountable: values.discountable,
    width: values.width ? parseFloat(values.width) : undefined,
    length: values.length ? parseFloat(values.length) : undefined,
    height: values.height ? parseFloat(values.height) : undefined,
    weight: values.weight ? parseFloat(values.weight) : undefined,
    variant_attributes: variantAttributes.length
      ? variantAttributes
      : undefined,
    product_attributes: productAttributes.length
      ? productAttributes
      : undefined,
    attribute_values: Object.keys(attributeValues).length
      ? attributeValues
      : undefined,
    variants: normalizeVariants(
      values.variants.filter((variant) => variant.should_create),
      values.regionsCurrencyMap
    ),
  } as any
}

export const normalizeVariants = (
  variants: ProductCreateSchemaType["variants"],
  _regionsCurrencyMap: Record<string, string>
): any[] => {
  return variants.map((variant) => {
    const attrVals = variant.attribute_values
    const hasAttrVals = attrVals && Object.keys(attrVals).length > 0

    return {
      title: variant.title || (hasAttrVals ? Object.values(attrVals).join(" / ") : "Default variant"),
      attribute_values: hasAttrVals ? attrVals : undefined,
      sku: variant.sku || undefined,
      variant_rank: variant.variant_rank,
    }
  })
}

const normalizeFormAttributes = (
  attributes: NonNullable<ProductCreateSchemaType["attributes"]>
) => {
  const variantAttributes: any[] = []
  const productAttributes: any[] = []
  const attributeValues: Record<string, string | string[]> = {}

  for (const attr of attributes) {
    if (attr.use_for_variants) {
      // Variant axis attribute
      if (attr.attribute_id) {
        // Global attribute reference — resolve value names to IDs
        const valueNames = Array.isArray(attr.values)
          ? attr.values
          : attr.values
            ? [attr.values]
            : []
        const nameToId = new Map(
          (attr.available_values ?? []).map((v) => [v.name, v.id])
        )
        const valueIds = valueNames
          .map((name) => nameToId.get(name))
          .filter(Boolean) as string[]

        variantAttributes.push({
          attribute_id: attr.attribute_id,
          value_ids: valueIds.length ? valueIds : undefined,
        })
      } else if (attr.is_custom && attr.title) {
        // Inline custom attribute
        variantAttributes.push({
          name: attr.title,
          type: attr.type ?? "multi_select",
          values: Array.isArray(attr.values)
            ? attr.values
            : attr.values
              ? [attr.values]
              : [],
          is_variant_axis: true,
        })
      }
    } else {
      // Non-variant descriptive attribute
      const key = attr.title
      if (!key) continue

      if (attr.is_custom) {
        // Custom non-variant attr — create via product_attributes
        const vals = Array.isArray(attr.values)
          ? attr.values
          : attr.values
            ? [attr.values]
            : []
        if (vals.length) {
          productAttributes.push({
            name: attr.title,
            type: attr.type ?? "text",
            values: vals,
            is_variant_axis: false,
          })
        }
      } else if (attr.attribute_id) {
        // Existing non-variant attr
        const vals = Array.isArray(attr.values)
          ? attr.values
          : attr.values
            ? [attr.values]
            : []
        if (!vals.length || vals.every((v) => !v)) continue

        const type = attr.type as string | undefined
        const hasPresetValues =
          type === "single_select" || type === "multi_select"

        if (hasPresetValues) {
          // Select types — resolve by name via attribute_values
          const nameToId = new Map(
            (attr.available_values ?? []).map((v) => [v.name, v.id])
          )
          const valueIds = vals
            .map((name) => nameToId.get(name))
            .filter(Boolean) as string[]

          if (valueIds.length) {
            productAttributes.push({
              attribute_id: attr.attribute_id,
              value_ids: valueIds,
            })
          }
        } else {
          // Text/unit/toggle — upsert values by name via product_attributes
          productAttributes.push({
            attribute_id: attr.attribute_id,
            values: vals,
          })
        }
      }
    }
  }

  return { variantAttributes, productAttributes, attributeValues }
}

export const decorateVariantsWithDefaultValues = (
  variants: ProductCreateSchemaType["variants"]
) => {
  return variants.map((variant) => ({
    ...variant,
    title: variant.title || "",
    sku: variant.sku || "",
    manage_inventory: variant.manage_inventory || false,
    allow_backorder: variant.allow_backorder || false,
    inventory_kit: variant.inventory_kit || false,
  }))
}

// --- Variant generation from attributes ---

const getPermutations = (
  data: { title: string; values: string[] }[]
): Record<string, string>[] => {
  if (data.length === 0) return []
  if (data.length === 1) {
    return data[0].values.map((value) => ({ [data[0].title]: value }))
  }

  const [first, ...rest] = data
  return first.values.flatMap((value) =>
    getPermutations(rest).map((perm) => ({ [first.title]: value, ...perm }))
  )
}

export const generateVariantsFromAttributes = (
  attributes: NonNullable<ProductCreateSchemaType["attributes"]>,
  currentVariants: ProductCreateSchemaType["variants"]
): ProductCreateSchemaType["variants"] => {
  const variantAxes = attributes
    .filter((attr) => attr.use_for_variants)
    .map((attr) => ({
      title: attr.title,
      values: Array.isArray(attr.values)
        ? attr.values
        : attr.values
          ? [attr.values]
          : [],
    }))
    .filter((axis) => axis.title && axis.values.length > 0)

  if (variantAxes.length === 0) {
    // No variant axes — ensure a default variant exists
    const hasDefault = currentVariants.some((v) => v.is_default)
    if (hasDefault && currentVariants.length > 0) {
      return currentVariants
    }
    return decorateVariantsWithDefaultValues([
      {
        title: "Default variant",
        should_create: true,
        variant_rank: 0,
        attribute_values: {},
        inventory: [{ inventory_item_id: "", required_quantity: "" }],
        is_default: true,
      },
    ])
  }

  const permutations = getPermutations(variantAxes)

  // Preserve existing variants that still match a permutation
  const newVariants = currentVariants.reduce((acc, variant) => {
    const attrVals = variant.attribute_values
    if (!attrVals || Object.keys(attrVals).length === 0) return acc

    const match = permutations.find((perm) =>
      Object.keys(attrVals).every((key) => attrVals[key] === perm[key])
    )
    if (match) {
      acc.push({
        ...variant,
        title: Object.values(match).join(" / "),
        attribute_values: match,
        is_default: false,
      })
    }
    return acc
  }, [] as typeof currentVariants)

  // Add new permutations not yet in the list
  const usedSet = new Set(
    newVariants.map((v) => JSON.stringify(v.attribute_values))
  )
  for (const perm of permutations) {
    if (!usedSet.has(JSON.stringify(perm))) {
      newVariants.push({
        title: Object.values(perm).join(" / "),
        attribute_values: perm,
        should_create: true,
        variant_rank: newVariants.length,
        inventory: [{ inventory_item_id: "", required_quantity: "" }],
      })
    }
  }

  return newVariants
}
