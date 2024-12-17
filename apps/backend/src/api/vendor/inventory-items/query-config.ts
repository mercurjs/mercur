export const vendorInventoryItemFields = [
  'id',
  'title',
  'description',
  'sku',
  'hs_code',
  'origin_country',
  'mid_code',
  'material',
  'weight',
  'length',
  'height',
  'width',
  'requires_shipping',
  'thumbnail',
  'metadata'
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
