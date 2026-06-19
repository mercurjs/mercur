/**
 * Fields appended to Medusa defaults for product detail queries.
 * Uses `*` prefix to add relations without replacing Medusa's built-in defaults.
 *
 * Mercur links surfaced here:
 *   - `sellers`         — product_seller link
 *   - `scoped_attributes` — product-scoped inline attributes (read-only link)
 *   - `product_attribute_values` — product-level linked attribute values (the
 *     `product_attribute_value_link` pivot; SPEC-014 — NOT `attribute_values`,
 *     which is not a relation on `product`). The enricher reads
 *     `product_attribute_values.attribute(.values)` to build the unified
 *     `product.attributes[]` array (selected `values` + full `all_values`).
 *   - `options` — native variant-axis product options (incl. `is_exclusive`
 *     and their values) so axis attributes can be read off `product.options`.
 */
export const PRODUCT_DETAIL_FIELDS =
  "*categories,*sellers,-variants,*scoped_attributes,*scoped_attributes.values,*product_attribute_values,*product_attribute_values.attribute,*product_attribute_values.attribute.values,*options,*options.is_exclusive,*options.values"

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const
