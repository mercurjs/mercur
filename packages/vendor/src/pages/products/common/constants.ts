export const PRODUCT_VARIANT_IDS_KEY = "product_variant_ids"

/**
 * Fields appended to Medusa defaults for product detail queries.
 * Uses `*` prefix to add relations without replacing Medusa's built-in defaults.
 *
 * Mercur links surfaced here:
 *   - `scoped_attributes` — product-scoped inline attributes (read-only link)
 *   - `attribute_values`  — product-level linked attribute values; the
 *     enricher uses `attribute_values.attribute` to build the unified
 *     `product.attributes[]` array for the UI.
 */
export const PRODUCT_DETAIL_FIELDS = [
  "*variants.images",
  "*categories",
  "+additional_data",
  "*scoped_attributes",
  "+attribute_values.*",
  "+attribute_values.attribute.*",
].join(",")

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const

