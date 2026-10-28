import { defineLink } from "@medusajs/framework/utils"
import PayoutModule from "@mercurjs/core/modules/payout"

import StripeConnectorModule from "../modules/stripe-connector"

export default defineLink(
  { linkable: StripeConnectorModule.linkable.settlementLine, field: "payout_id" },
  PayoutModule.linkable.payout,
  { readOnly: true }
)
