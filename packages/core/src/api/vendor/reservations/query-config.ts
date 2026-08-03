const defaultVendorInventoryItemFields = [
  "id",
  "sku",
  "origin_country",
  "hs_code",
  "requires_shipping",
  "mid_code",
  "material",
  "weight",
  "length",
  "height",
  "width",
  "title",
  "description",
  "thumbnail",
  "metadata",
]

export const defaultVendorReservationFields = [
  "id",
  "location_id",
  "inventory_item_id",
  "quantity",
  "line_item_id",
  "description",
  "metadata",
  "created_at",
  "updated_at",
  ...defaultVendorInventoryItemFields.map((f) => `inventory_item.${f}`),
  // Product column: inventory is offer-scoped in Mercur, so the product is
  // reached through the offer (offer-product-link alias `product`).
  "inventory_item.offers.id",
  "inventory_item.offers.product.id",
  "inventory_item.offers.product.title",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultVendorReservationFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  isList: true,
}

export const vendorReservationQueryConfig = {
  list: listTransformQueryConfig,
  retrieve: retrieveTransformQueryConfig,
}
