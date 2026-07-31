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
// the inventory item. Both are Mercur module links off the inventory item:
//   inventory_item -> seller                          (inventory-item-seller-link)
//   inventory_item -> offers -> product_variant -> product
//     (offer-inventory-item-link + offer-variant-link). Inventory is
//     offer-scoped in Mercur, so the product is reached through the offer,
//     not the native product_variant_inventory_item link.
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
  "inventory_item.offers.id",
  "inventory_item.offers.product_variant.id",
  "inventory_item.offers.product_variant.title",
  "inventory_item.offers.product_variant.product.id",
  "inventory_item.offers.product_variant.product.title",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminReservationFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}
