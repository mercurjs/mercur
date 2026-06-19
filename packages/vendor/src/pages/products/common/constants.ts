export const PRODUCT_VARIANT_IDS_KEY = "product_variant_ids"

/**
 * Fields appended to Medusa defaults for product detail queries.
 * Uses `*` prefix to add relations without replacing Medusa's built-in defaults.
 *
 * Mercur links surfaced here:
 *   - `scoped_attributes` — product-scoped inline attributes (read-only link)
 *   - `product_attribute_values` — product-level linked attribute values (the
 *     `product_attribute_value_link` pivot; SPEC-014 — NOT `attribute_values`,
 *     which is not a relation on `product`). The enricher reads
 *     `product_attribute_values.attribute(.values)` to build the unified
 *     `product.attributes[]` array (selected `values` + full `all_values`).
 *   - `options` — native variant-axis product options (incl. `is_exclusive`
 *     and their values) so axis attributes can be read off `product.options`.
 */
export const PRODUCT_DETAIL_FIELDS = [
  "*variants.images",
  // Variant identity used by the active edit-request block (MER-168).
  // Use `+` so these don't trigger Medusa's "replace defaults" rule
  // (any bare field strips title/description/subtitle from the product).
  "+variants.title",
  "+variants.sku",
  "*categories",
  "+additional_data",
  "*scoped_attributes",
  "+scoped_attributes.values.*",
  "+product_attribute_values.*",
  "+product_attribute_values.attribute.*",
  "+product_attribute_values.attribute.values.*",
  "+options.*",
  "+options.is_exclusive",
  "+options.values.*",
].join(",")

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const

