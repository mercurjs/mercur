// Mirrors admin's `query-config.ts` — same default field set so the
// generated SDK route map (which types vendor.reservations against
// admin's route module) sees the same shape coming back.
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
