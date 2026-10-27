import { defineLink } from "@medusajs/framework/utils"
import FulfillmentModule from "@medusajs/medusa/fulfillment"

import ShippingRuleModule from "../modules/shipping-rule"

export default defineLink(
  { linkable: FulfillmentModule.linkable.serviceZone, isList: true },
  ShippingRuleModule.linkable.shippingZone
)
