export const adminProductFields = [
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
  "deleted_at",
  "metadata",
  "*type",
  "*collection",
  "*tags",
  "*images",
  "*categories",
  "*options",
  "*options.values",
  "*variants",
  "*variants.options",
  // Linked product-attribute value ids (Module Link alias). The GET
  // handler enriches these into `product.attributes` via separate
  // queries against the product-attribute module.
  "attribute_values.id",
]

export const adminProductRetrieveFields = [...adminProductFields]

export const adminProductQueryConfig = {
  list: {
    defaults: adminProductFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: adminProductRetrieveFields,
    isList: false,
  },
}

export const adminProductVariantFields = [
  "id",
  "title",
  "sku",
  "ean",
  "upc",
  "isbn",
  "asin",
  "gtin",
  "barcode",
  "hs_code",
  "mid_code",
  "variant_rank",
  "weight",
  "length",
  "height",
  "width",
  "origin_country",
  "material",
  "metadata",
  "created_at",
  "updated_at",
  "product_id",
  "manage_inventory",
  "allow_backorder",
  "*options",
  "*attribute_values",
  "*attribute_values.attribute",
]

export const adminProductVariantQueryConfig = {
  list: {
    defaults: adminProductVariantFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: adminProductVariantFields,
    isList: false,
  },
}
