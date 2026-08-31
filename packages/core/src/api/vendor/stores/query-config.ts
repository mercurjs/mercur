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

// `allowed` only strips select fields when the `rbac_filter_fields` feature flag
// is on; `disallowed` is stripped unconditionally.
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
