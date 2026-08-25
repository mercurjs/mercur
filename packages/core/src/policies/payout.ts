import { definePolicies } from "@medusajs/framework/utils"

import { generateResourcePolicies } from "../utils/generate-resource-policies"

export const payoutPolicies = definePolicies(
  generateResourcePolicies(["payout", "payout_account"])
)
