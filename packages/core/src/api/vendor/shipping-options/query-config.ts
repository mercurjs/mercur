export const vendorShippingOptionFields = [
  "id",
  "name",
  "price_type",
  "data",
  "provider_id",
  "metadata",
  "created_at",
  "updated_at",
  "*rules",
  "*type",
  "*prices",
  "*prices.price_rules",
  "*service_zone",
  "*shipping_profile",
  "*provider",
]

export const vendorShippingOptionQueryConfig = {
  list: {
    defaults: vendorShippingOptionFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorShippingOptionFields,
    isList: false,
  },
}

export const vendorShippingOptionRuleFields = [
  "id",
  "attribute",
  "operator",
  "value",
]

export const vendorShippingOptionRuleQueryConfig = {
  list: {
    defaults: vendorShippingOptionRuleFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorShippingOptionRuleFields,
    isList: false,
  },
}
