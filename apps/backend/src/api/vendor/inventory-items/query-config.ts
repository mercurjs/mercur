export const vendorInventoryItemFields = [
  "id",
  "sku",
  "title",
  "description",
  "thumbnail",
  "origin_country",
  "hs_code",
  "requires_shipping",
  "mid_code",
  "material",
  "weight",
  "length",
  "height",
  "width",
  "metadata",
  "reserved_quantity",
  "stocked_quantity",
  "created_at",
  "updated_at",
  "*location_levels",
]

export const vendorInventoryItemQueryConfig = {
  list: {
    defaults: vendorInventoryItemFields,
    isList: true
  },
  retrieve: {
    defaults: vendorInventoryItemFields,
    isList: false
  }
}

export const vendorInventoryLevelFields = [
  'id',
  'inventory_item_id',
  'location_id',
  'available_quantity',
  'stocked_quantity',
  'reserved_quantity',
  'incoming_quantity',
  '*stock_locations',
  '*stock_locations.address'
]

export const vendorInventoryLevelQueryConfig = {
  list: {
    defaults: vendorInventoryLevelFields,
    isList: true
  },
  retrieve: {
    defaults: vendorInventoryLevelFields,
    isList: false
  }
}
