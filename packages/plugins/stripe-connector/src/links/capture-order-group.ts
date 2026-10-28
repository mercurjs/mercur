import { defineLink } from "@medusajs/framework/utils"
import SellerModule from "@mercurjs/core/modules/seller"

import StripeConnectorModule from "../modules/stripe-connector"

export default defineLink(
  { linkable: StripeConnectorModule.linkable.stripeCapture, field: "order_group_id" },
  SellerModule.linkable.orderGroup,
  { readOnly: true }
)
