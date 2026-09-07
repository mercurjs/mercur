export const vendorStoreFields = [
  "id",
  "name",
  "*supported_currencies",
  "*supported_currencies.currency",
  "default_sales_channel_id",
  "default_region_id",
  "default_location_id",
  "metadata",
  "created_at",
  "updated_at",
]

// Both lists are stripped unconditionally. `allowed` used to depend on the
// `rbac_filter_fields` feature flag; since Medusa 2.20 a requested field outside
// it is always dropped, silently, before the query runs.
export const vendorStoreDisallowedFields = ["members"]

export const vendorStoreQueryConfig = {
  list: {
    defaults: vendorStoreFields,
    allowed: vendorStoreFields,
    disallowed: vendorStoreDisallowedFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorStoreFields,
    allowed: vendorStoreFields,
    disallowed: vendorStoreDisallowedFields,
    isList: false,
  },
}
