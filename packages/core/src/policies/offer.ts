import { definePolicies } from "@medusajs/framework/utils"

import { generateResourcePolicies } from "../utils/generate-resource-policies"

export const offerPolicies = definePolicies(
  generateResourcePolicies(["offer"])
)
