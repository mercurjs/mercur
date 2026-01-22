export const vendorFulfillmentSetFields = [
  "id",
  "name",
  "type",
  "created_at",
  "updated_at",
  "deleted_at",
  "*service_zones",
  "*service_zones.geo_zones",
]

export const vendorFulfillmentSetQueryConfig = {
  retrieve: {
    defaults: vendorFulfillmentSetFields,
    isList: false,
  },
}

export const vendorServiceZoneQueryConfig = {
  retrieve: {
    defaults: [
      "id",
      "name",
      "type",
      "created_at",
      "updated_at",
      "deleted_at",
      "*geo_zones",
    ],
    isList: false,
  },
}
