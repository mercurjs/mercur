import { HttpTypes } from "@medusajs/types"
import { AttributeType, ProductAttributeBatchAdd } from "@mercurjs/types"
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

  const hasAxis = (values.attributes ?? []).some(
    (a) => a.use_for_variants && toValueArray(a.values).length > 0
  )

  const attributes = normalizeFormAttributes(values.attributes ?? [])

  // Mirror Medusa's default-option seeding: a product with no real variant axis
  // still needs one option + a default variant, modeled here as a synthetic
  // inline axis attribute that flows through the standard inline-axis path.
  if (!hasAxis) {
    attributes.push({
      title: "Default Option",
      type: AttributeType.MULTI_SELECT,
      values: ["Default"],
      is_variant_axis: true,
    })
  }

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
    seller_ids:
      !values.globally_available && values.seller_ids?.length
        ? values.seller_ids
        : undefined,
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
    attributes: attributes.length ? attributes : undefined,
    variants: normalizeVariants(
      values.variants.filter((variant) => variant.should_create),
      hasAxis,
      values.regionsCurrencyMap
    ),
  } as any
}

export const normalizeVariants = (
  variants: ProductCreateSchemaType["variants"],
  hasAxis: boolean,
  _regionsCurrencyMap: Record<string, string>
): any[] => {
  return variants.map((variant) => {
    const opts = variant.options
    const hasOpts = opts && Object.keys(opts).length > 0

    return {
      title: variant.title || (hasOpts ? Object.values(opts).join(" / ") : "Default variant"),
      options: hasOpts ? opts : hasAxis ? undefined : { "Default Option": "Default" },
      sku: variant.sku || undefined,
      variant_rank: variant.variant_rank,
    }
  })
}

const toValueArray = (values: string | string[] | undefined): string[] =>
  Array.isArray(values) ? values.filter(Boolean) : values ? [values] : []

/**
 * SPEC-014: collapse the form's attribute rows into the unified
 * `attributes[]` create input (`ProductAttributeBatchAdd`). Axis vs. non-axis
 * is derived from `use_for_variants`; existing refs go in by `id`, custom rows
 * by `title` (inline product-scoped). Select types pass `value_ids` (resolved
 * by name), text/unit/toggle pass a single `value` scalar.
 */
const normalizeFormAttributes = (
  attributes: NonNullable<ProductCreateSchemaType["attributes"]>
): ProductAttributeBatchAdd[] => {
  const result: ProductAttributeBatchAdd[] = []

  for (const attr of attributes) {
    const vals = toValueArray(attr.values)
    const type = attr.type as string | undefined
    const isSelect = type === "single_select" || type === "multi_select"

    if (attr.attribute_id) {
      // Existing catalog attribute referenced by id.
      if (isSelect || attr.use_for_variants) {
        // Select / axis: resolve chosen value names to ids.
        const nameToId = new Map(
          (attr.available_values ?? []).map((v) => [v.name, v.id])
        )
        const valueIds = vals
          .map((name) => nameToId.get(name))
          .filter(Boolean) as string[]

        // A variant axis without chosen values is meaningless (stock Medusa
        // would synthesise a valueless option and reject the default variant),
        // so skip the ref entirely and let the product fall through.
        if (!valueIds.length) continue

        result.push({ id: attr.attribute_id, value_ids: valueIds })
      } else {
        // Text / unit / toggle: a single free-form scalar.
        if (!vals.length || !vals[0]) continue
        result.push({
          id: attr.attribute_id,
          value: type === "toggle" ? vals[0] === "true" : vals[0],
        })
      }
    } else if (attr.is_custom && attr.title) {
      // Inline (product-scoped) attribute created from a custom row.
      if (!vals.length) continue

      if (attr.use_for_variants) {
        result.push({
          title: attr.title,
          type: (type as AttributeType) ?? AttributeType.MULTI_SELECT,
          values: vals,
          is_variant_axis: true,
        })
      } else if (isSelect) {
        result.push({
          title: attr.title,
          type: type as AttributeType,
          values: vals,
        })
      } else {
        result.push({
          title: attr.title,
          type: (type as AttributeType) ?? AttributeType.TEXT,
          value: type === "toggle" ? vals[0] === "true" : vals[0],
        })
      }
    }
  }

  return result
}

export const decorateVariantsWithDefaultValues = (
  variants: ProductCreateSchemaType["variants"]
) => {
  return variants.map((variant) => ({
    ...variant,
    title: variant.title || "",
    sku: variant.sku || "",
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
        options: {},
        is_default: true,
      },
    ])
  }

  const permutations = getPermutations(variantAxes)

  // Preserve existing variants that still match a permutation
  const newVariants = currentVariants.reduce((acc, variant) => {
    const opts = variant.options
    if (!opts || Object.keys(opts).length === 0) return acc

    const match = permutations.find((perm) =>
      Object.keys(opts).every((key) => opts[key] === perm[key])
    )
    if (match) {
      acc.push({
        ...variant,
        title: Object.values(match).join(" / "),
        options: match,
        is_default: false,
      })
    }
    return acc
  }, [] as typeof currentVariants)

  // Add new permutations not yet in the list
  const usedSet = new Set(
    newVariants.map((v) => JSON.stringify(v.options))
  )
  for (const perm of permutations) {
    if (!usedSet.has(JSON.stringify(perm))) {
      newVariants.push({
        title: Object.values(perm).join(" / "),
        options: perm,
        should_create: true,
        variant_rank: newVariants.length,
      })
    }
  }

  return newVariants
}
