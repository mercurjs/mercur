// TODO: change this when RQ is fixed (address is not joined when *address)
export const LOCATION_LIST_FIELDS =
  "name,*sales_channels,*address,*fulfillment_sets,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.shipping_options,*fulfillment_sets.service_zones.shipping_options.shipping_profile"

export const LOCATION_DETAILS_FIELD =
  "name,*sales_channels,*address,fulfillment_sets.type,fulfillment_sets.name,*fulfillment_sets.service_zones.geo_zones,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.shipping_options,*fulfillment_sets.service_zones.shipping_options.rules,*fulfillment_sets.service_zones.shipping_options.shipping_profile,*fulfillment_providers"

export enum FulfillmentSetType {
  Shipping = "shipping",
  Pickup = "pickup",
}

export enum ShippingOptionPriceType {
  FlatRate = "flat",
  Calculated = "calculated",
}

export const GEO_ZONE_STACKED_MODAL_ID = "geo-zone"

export const CONDITIONAL_PRICES_STACKED_MODAL_ID = "conditional-prices"

export const ITEM_TOTAL_ATTRIBUTE = "item_total"
export const REGION_ID_ATTRIBUTE = "region_id"

export const LOC_CREATE_SHIPPING_OPTION_FIELDS =
  "*fulfillment_sets,*fulfillment_sets.service_zones,*fulfillment_sets.service_zones.shipping_options"
