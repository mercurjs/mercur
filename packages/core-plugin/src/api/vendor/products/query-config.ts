import { defaultAdminProductVariantFields } from "@medusajs/medusa/api/admin/product-variants/query-config"

export const vendorProductFields = [
  "id",
  "title",
  "subtitle",
  "status",
  "external_id",
  "description",
  "handle",
  "is_giftcard",
  "discountable",
  "thumbnail",
  "collection_id",
  "type_id",
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
  "*collection",
  "*options",
  "*options.values",
  "*tags",
  "*images",
  "*variants",
  "*variants.prices",
  "*variants.options",
  "*categories",
]

export const vendorProductQueryConfig = {
  list: {
    defaults: vendorProductFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorProductFields,
    isList: false,
  },
}

export const vendorProductVariantQueryConfig = {
  list: {
    defaults: defaultAdminProductVariantFields,
    isList: true,
    defaultLimit: 50,
  },
  retrieve: {
    defaults: defaultAdminProductVariantFields,
    isList: false,
  },
}
