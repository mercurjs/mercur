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

// The product media gallery and editor only need the image relation on top of
// the route's base fields. `images` is added with `+` because the query-config
// server defaults omit it; a bare `*images` wildcard returns nothing on the 2.16
// joiner, so the subfields are spelled out.
export const PRODUCT_MEDIA_FIELDS = [
  "+images.id",
  "+images.url",
  "+images.rank",
].join(",")

export const PRODUCT_MEDIA_QUERY = { fields: PRODUCT_MEDIA_FIELDS } as const

