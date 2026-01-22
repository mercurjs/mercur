export const defaultVendorLocationLevelFields = [
  "id",
  "inventory_item_id",
  "location_id",
  "stocked_quantity",
  "reserved_quantity",
  "incoming_quantity",
  "available_quantity",
  "metadata",
  "created_at",
  "updated_at",
]

export const defaultVendorInventoryItemFields = [
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
    defaults: defaultVendorInventoryItemFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultVendorInventoryItemFields,
    isList: false,
  },
}

export const vendorLocationLevelQueryConfig = {
  list: {
    defaults: defaultVendorLocationLevelFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultVendorLocationLevelFields,
    isList: false,
  },
}
