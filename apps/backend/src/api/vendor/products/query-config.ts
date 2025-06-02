export const vendorProductFields = [
  'id',
  'title',
  'subtitle',
  'status',
  'external_id',
  'description',
  'handle',
  'is_giftcard',
  'discountable',
  'thumbnail',
  'collection_id',
  'type_id',
  'weight',
  'length',
  'height',
  'width',
  'hs_code',
  'origin_country',
  'mid_code',
  'material',
  'metadata',
  'brand.name',
  '*type',
  '*collection',
  '*options',
  '*options.values',
  '*tags',
  '*images',
  '*variants',
  '*variants.prices',
  'variants.prices.price_rules.value',
  'variants.prices.price_rules.attribute',
  '*variants.options'
]

export const vendorProductQueryConfig = {
  list: {
    defaults: vendorProductFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductFields,
    isList: false
  }
}

export const defaultAdminProductsVariantFields = [
  "id",
  "product_id",
  "title",
  "sku",
  "allow_backorder",
  "manage_inventory",
  "hs_code",
  "origin_country",
  "mid_code",
  "material",
  "weight",
  "length",
  "height",
  "width",
  "created_at",
  "updated_at",
  "deleted_at",
  "metadata",
  "variant_rank",
  "ean",
  "upc",
  "barcode",
  "*prices",
  "prices.price_rules.value",
  "prices.price_rules.attribute",
  "*options",
]

export const vendorProductVariantQueryConfig = {
  list: {
    defaults: defaultAdminProductsVariantFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminProductsVariantFields,
    isList: false,
  }

}