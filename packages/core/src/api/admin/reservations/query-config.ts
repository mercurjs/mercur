const defaultAdminReservationInventoryItemFields = [
  "id",
  "sku",
  "title",
  "description",
  "thumbnail",
  "requires_shipping",
  "origin_country",
  "hs_code",
  "mid_code",
  "material",
  "weight",
  "length",
  "height",
  "width",
  "metadata",
]

// The reservation list/detail needs the owning store and the product behind
// the inventory item. Both are module links off the inventory item:
//   inventory_item -> seller            (inventory-item-seller-link)
//   inventory_item -> variants -> product (product_variant_inventory_item)
export const defaultAdminReservationFields = [
  "id",
  "location_id",
  "inventory_item_id",
  "quantity",
  "line_item_id",
  "description",
  "metadata",
  "created_at",
  "updated_at",
  ...defaultAdminReservationInventoryItemFields.map(
    (f) => `inventory_item.${f}`
  ),
  "inventory_item.seller.id",
  "inventory_item.seller.name",
  "inventory_item.variants.id",
  "inventory_item.variants.title",
  "inventory_item.variants.product.id",
  "inventory_item.variants.product.title",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminReservationFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
