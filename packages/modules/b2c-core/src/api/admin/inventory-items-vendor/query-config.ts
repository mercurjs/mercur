
export const defaultAdminInventoryItemFields = [
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
  "seller.id",
  "seller.name",
]

export const adminInvQueryConfig = {
  list: {
    defaults: defaultAdminInventoryItemFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminInventoryItemFields,
    isList: false,
  },
}
