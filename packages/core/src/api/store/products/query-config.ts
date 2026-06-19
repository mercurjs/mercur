export const defaultStoreProductFields = [
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
  "*variants",
  "*variants.options",
  "*options",
  "*options.values",
  // Linked product-attribute value ids — the GET handler enriches
  // these into `product.attributes` via separate queries against the
  // product-attribute module. The product-side alias for the
  // `product_attribute_value_link` pivot is `product_attribute_values`
  // (SPEC-014 — NOT `attribute_values`). Cross-module chained populate
  // (e.g. `*product_attribute_values.attribute.values`) crashes
  // MikroORM's `expandDotPaths`, so we keep the joiner request single-hop.
  "product_attribute_values.id",
]

export const storeProductQueryConfig = {
  list: {
    defaults: defaultStoreProductFields,
    defaultLimit: 50,
    isList: true,
  },
  retrieve: {
    defaults: defaultStoreProductFields,
    isList: false,
  },
}
