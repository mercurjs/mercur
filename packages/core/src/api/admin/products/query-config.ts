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
  // 2.16's remote joiner rejects bare `*relation` wildcards and the
  // `type`/`tags`/`images` relations (`Cannot resolve alias path ""`), so they
  // are spelled out / excluded.
  "collection.id",
  "collection.title",
  "collection.handle",
  "categories.id",
  "categories.name",
  "categories.handle",
  // NOTE: native `options(.values)` and `variants.options` are intentionally
  // omitted — `product.options` populate crashes MikroORM `expandDotPaths` on
  // the 2.16 options-preview build. Axis options must be read from the
  // `product_option` side until that infra bug is resolved.
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.manage_inventory",
  "variants.allow_backorder",
  "variants.variant_rank",
  "product_attribute_values.id",
  "product_attribute_values.name",
  "product_attribute_values.rank",
  "product_attribute_values.attribute.id",
  "product_attribute_values.attribute.name",
  "product_attribute_values.attribute.handle",
  "product_attribute_values.attribute.type",
  "product_attribute_values.attribute.is_variant_axis",
  "product_attribute_values.attribute.is_required",
  "product_attribute_values.attribute.rank",
  "product_attribute_values.attribute.values.id",
  "product_attribute_values.attribute.values.name",
  "product_attribute_values.attribute.values.rank",
  "scoped_attributes.id",
  "scoped_attributes.name",
  "scoped_attributes.handle",
  "scoped_attributes.type",
  "scoped_attributes.is_variant_axis",
  "scoped_attributes.values.id",
  "scoped_attributes.values.name",
  "scoped_attributes.values.rank",
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
