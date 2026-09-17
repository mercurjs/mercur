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
// AllowedFieldFilter compares de-starred relation paths, so `*relation`
// entries in `allowed` never match and the relation is dropped.
export const vendorStoreAllowedFields = vendorStoreFields.map((field) =>
  field.startsWith("*") ? field.slice(1) : field
)

export const vendorStoreDisallowedFields = ["members"]

export const vendorStoreQueryConfig = {
  list: {
    defaults: vendorStoreFields,
    allowed: vendorStoreAllowedFields,
    disallowed: vendorStoreDisallowedFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorStoreFields,
    allowed: vendorStoreAllowedFields,
    disallowed: vendorStoreDisallowedFields,
    isList: false,
  },
}
