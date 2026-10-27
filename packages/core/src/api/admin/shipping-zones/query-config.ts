export const defaultAdminShippingZoneFields = [
  "id",
  "name",
  "code",
  "is_active",
  "metadata",
  "created_at",
  "updated_at",
  "geo_zones.id",
  "geo_zones.type",
  "geo_zones.country_code",
  "geo_zones.province_code",
]

export const adminShippingZoneQueryConfig = {
  list: {
    defaults: defaultAdminShippingZoneFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminShippingZoneFields,
    isList: false,
  },
}
