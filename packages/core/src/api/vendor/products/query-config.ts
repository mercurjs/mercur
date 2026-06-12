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

export const vendorProductRetrieveFields = [...vendorProductFields]

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

export const vendorProductVariantFields = [
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
  "thumbnail",
  "*options",
  "images.id",
  "images.url",
  "images.rank",
  "images.variants.id",
]

export const vendorProductVariantQueryConfig = {
  list: {
    defaults: vendorProductVariantFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: vendorProductVariantFields,
    isList: false,
  },
}
