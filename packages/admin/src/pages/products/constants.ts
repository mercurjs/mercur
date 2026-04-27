/**
 * Fields appended to Medusa defaults for product detail queries.
 * Uses `*` prefix to add relations without replacing Medusa's built-in defaults.
 *
 * Missing from Medusa defaults: *categories
 * Mercur custom links: *seller
 */
export const PRODUCT_DETAIL_FIELDS = "*categories,*brand,-variants,*variant_attributes,*variant_attributes.values,*custom_attributes,*custom_attributes.values,*attribute_values,*attribute_values.attribute"

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const
