export const PRODUCT_VARIANT_IDS_KEY = "product_variant_ids"

/**
 * Fields appended to Medusa defaults for product detail queries.
 * Uses `*` prefix to add relations without replacing Medusa's built-in defaults.
 */
export const PRODUCT_DETAIL_FIELDS = [
  "*variants.images",
  "*categories",
  "*brand",
  "+additional_data",
  "*variant_attributes",
  "*variant_attributes.values",
  "*custom_attributes",
  "*custom_attributes.values",
  "+attribute_values.*",
  "+attribute_values.attribute.*",
].join(",")

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const

