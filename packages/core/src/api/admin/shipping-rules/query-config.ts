export const defaultAdminShippingRuleFields = [
  "id",
  "shipping_zone_id",
  "shipping_method_id",
  "shipping_profile_id",
  "requirement",
  "price_type",
  "seller_can_edit_price",
  "transit_min_days",
  "transit_max_days",
  "seller_can_edit_transit",
  "created_at",
  "updated_at",
  "prices.id",
  "prices.currency_code",
  "prices.region_id",
  "prices.amount",
  "shipping_zone.id",
  "shipping_zone.name",
  "shipping_zone.code",
  "shipping_method.id",
  "shipping_method.name",
  "shipping_method.code",
  "shipping_method.provider_id",
]

export const adminShippingRuleQueryConfig = {
  list: {
    defaults: defaultAdminShippingRuleFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminShippingRuleFields,
    isList: false,
  },
}
