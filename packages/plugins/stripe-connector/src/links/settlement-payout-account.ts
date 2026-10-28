import { defineLink } from "@medusajs/framework/utils"
import PayoutModule from "@mercurjs/core/modules/payout"

import StripeConnectorModule from "../modules/stripe-connector"

export default defineLink(
  { linkable: StripeConnectorModule.linkable.settlement, field: "account_id" },
  PayoutModule.linkable.payoutAccount,
  { readOnly: true }
)
