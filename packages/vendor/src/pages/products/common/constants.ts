export const PRODUCT_VARIANT_IDS_KEY = "product_variant_ids"

export const PRODUCT_DETAIL_FIELDS = [
  "-variants",
  "+images.id",
  "+images.url",
  "+images.rank",
  "*categories",
  "+additional_data",
  "*scoped_attributes",
  "+scoped_attributes.values.*",
  "+product_attribute_values.*",
  "+product_attribute_values.attribute.*",
  "+product_attribute_values.attribute.values.*",
].join(",")

export const PRODUCT_DETAIL_QUERY = { fields: PRODUCT_DETAIL_FIELDS } as const

