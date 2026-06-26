export const PRODUCT_VARIANT_IDS_KEY = "product_variant_ids"

// `-variants`: the 2.16 options-preview joiner crashes on product →
// variants/options populate; variants are read from /vendor/products/:id/variants.
// `images` is spelled out (not `*images`): the query-config server defaults omit
// it, and the 2.16 joiner returns nothing for a bare `*relation` wildcard.
export const PRODUCT_DETAIL_FIELDS = [
  "-variants",
  "images.id",
  "images.url",
  "images.rank",
  "*categories",
  "+additional_data",
  "*scoped_attributes",
  "+scoped_attributes.values.*",
  "+product_attribute_values.*",
  "+product_attribute_values.attribute.*",
  "+product_attribute_values.attribute.values.*",
].join(",")

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const

