import { definePolicies } from "@medusajs/framework/utils"

import { generateResourcePolicies } from "../utils/generate-resource-policies"

const commissionResources = [
  "commission_rule",
  "commission_rate",
  "commission_line",
]

export const commissionPolicies = definePolicies(
  generateResourcePolicies(commissionResources)
)
