/**
 * Resource names used in route `policies` declarations. Mercur-owned resources
 * are declared in `src/policies/*`; the rest come from Medusa's own catalog.
 *
 * Keep the values in sync with those catalogs — an unknown resource name is
 * not a type error, it silently never matches a granted policy.
 */
export const PolicyResource = {
  // Mercur
  seller: "seller",
  seller_member: "seller_member",
  member_invite: "member_invite",
  order_group: "order_group",
  offer: "offer",
  commission_rule: "commission_rule",
  commission_rate: "commission_rate",
  commission_line: "commission_line",
  payout: "payout",
  payout_account: "payout_account",
  product_attribute: "product_attribute",
  product_attribute_value: "product_attribute_value",
  product_change: "product_change",
  review: "review",

  // Medusa
  product: "product",
  product_variant: "product_variant",
  product_option: "product_option",
  product_tag: "product_tag",
  product_type: "product_type",
  product_category: "product_category",
  product_collection: "product_collection",
  order: "order",
  order_change: "order_change",
  order_claim: "order_claim",
  order_exchange: "order_exchange",
  return: "return",
  return_reason: "return_reason",
  refund_reason: "refund_reason",
  customer: "customer",
  customer_group: "customer_group",
  inventory_item: "inventory_item",
  reservation_item: "reservation_item",
  stock_location: "stock_location",
  price_list: "price_list",
  price_preference: "price_preference",
  currency: "currency",
  promotion: "promotion",
  campaign: "campaign",
  region: "region",
  sales_channel: "sales_channel",
  store: "store",
  payment: "payment",
  shipping_option: "shipping_option",
  shipping_option_type: "shipping_option_type",
  shipping_profile: "shipping_profile",
  fulfillment: "fulfillment",
  fulfillment_provider: "fulfillment_provider",
  fulfillment_set: "fulfillment_set",
  file: "file",
} as const

export type PolicyResourceName =
  (typeof PolicyResource)[keyof typeof PolicyResource]
