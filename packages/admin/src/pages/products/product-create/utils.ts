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

  const { variantAttributes, attributeValues } = normalizeFormAttributes(
    values.attributes ?? []
  )

  return {
    is_giftcard: false,
    tags: values?.tags?.length
      ? values.tags?.map((tag) => ({ id: tag }))
      : undefined,
    images,
    collection_id: values.collection_id || undefined,
    categories: values.category_id ? [{ id: values.category_id }] : undefined,
    type_id: values.type_id || undefined,
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
  regionsCurrencyMap: Record<string, string>
): any[] => {
  return variants.map((variant) => {
    const hasOptions = variant.attribute_values && Object.keys(variant.attribute_values).length > 0

    return {
      title: variant.title || (hasOptions ? Object.values(variant.attribute_values).join(" / ") : "Default variant"),
      attribute_values: hasOptions ? variant.attribute_values : undefined,
      sku: variant.sku || undefined,
      variant_rank: variant.variant_rank,
    }
  })
}

const normalizeFormAttributes = (
  attributes: NonNullable<ProductCreateSchemaType["attributes"]>
) => {
  const variantAttributes: any[] = []
  const attributeValues: Record<string, string | string[]> = {}

  for (const attr of attributes) {
    if (attr.use_for_variants) {
      // Variant axis attribute
      if (attr.attribute_id) {
        // Global attribute reference
        variantAttributes.push({
          attribute_id: attr.attribute_id,
          value_ids: Array.isArray(attr.values)
            ? attr.values
            : attr.values
              ? [attr.values]
              : undefined,
        })
      } else if (attr.is_custom && attr.title) {
        // Inline custom attribute
        variantAttributes.push({
          name: attr.title,
          type: attr.type ?? "single_select",
          values: Array.isArray(attr.values)
            ? attr.values
            : attr.values
              ? [attr.values]
              : [],
          is_variant_axis: true,
        })
      }
    } else {
      // Non-variant descriptive attribute — product-level values
      const key = attr.title
      if (!key) continue

      if (attr.values !== undefined && attr.values !== "") {
        attributeValues[key] = attr.values
      }
    }
  }

  return { variantAttributes, attributeValues }
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
