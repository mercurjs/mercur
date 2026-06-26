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
 *
 * NOTE: native `options` and `variants` are intentionally NOT requested — on
 * the 2.16 options-preview build the product → variants/options populate
 * crashes the remote joiner ("Cannot resolve alias path \"variants\"" /
 * `expandDotPaths`). `-variants` strips the variant subtree the query-config
 * defaults would otherwise pull in. Variant data is read from the
 * `/vendor/products/:id/variants` endpoint instead (variant section + the
 * active edit-request block). Axis options + `is_exclusive` are read from the
 * `product_option` side.
 */
export const PRODUCT_DETAIL_FIELDS = [
  "-variants",
  "*images",
  "*categories",
  "+additional_data",
  "*scoped_attributes",
  "+scoped_attributes.values.*",
  "+product_attribute_values.*",
  "+product_attribute_values.attribute.*",
  "+product_attribute_values.attribute.values.*",
].join(",")

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const

