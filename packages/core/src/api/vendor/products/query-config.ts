export const vendorProductFields = [
  "id",
  "title",
  "subtitle",
  "status",
  "is_active",
  "is_restricted",
  "external_id",
  "description",
  "handle",
  "is_giftcard",
  "discountable",
  "thumbnail",
  "collection_id",
  "type_id",
  "brand_id",
  "weight",
  "length",
  "height",
  "width",
  "hs_code",
  "origin_country",
  "mid_code",
  "material",
  "created_at",
  "updated_at",
  "metadata",
  "*type",
  "*brand",
  "*collection",
  "*tags",
  "*images",
  "*categories",
  "*variants",
  "*variant_attributes",
  "*variant_attributes.values",
]

export const vendorProductRetrieveFields = [
  ...vendorProductFields,
  "*changes",
]

export const vendorProductQueryConfig = {
  list: {
    defaults: vendorProductFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: vendorProductRetrieveFields,
    isList: false,
  },
}
