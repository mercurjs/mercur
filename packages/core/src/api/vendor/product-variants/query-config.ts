export const vendorProductVariantFields = [
  "id",
  "title",
  "sku",
  "barcode",
  "ean",
  "upc",
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
  "metadata",
  "variant_rank",
  "product_id",
  "created_at",
  "updated_at",
  "*product",
  "*prices",
  "*options",
]

export const vendorProductVariantQueryConfig = {
  list: {
    defaults: vendorProductVariantFields,
    isList: true,
    defaultLimit: 50,
  },
  retrieve: {
    defaults: vendorProductVariantFields,
    isList: false,
  },
}
