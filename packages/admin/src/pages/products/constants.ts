/**
 * Fields appended to Medusa defaults for product detail queries.
 * Uses `*` prefix to add relations without replacing Medusa's built-in defaults.
 *
 * Missing from Medusa defaults: *categories
 * Mercur custom links: *seller
 */
export const PRODUCT_DETAIL_FIELDS = "*seller,*categories,*shipping_profile,-variants"

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const
