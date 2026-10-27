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
