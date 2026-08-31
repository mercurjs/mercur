import { definePolicies } from "@medusajs/framework/utils"

import { generateResourcePolicies } from "../utils/generate-resource-policies"

const sellerResources = [
  "seller",
  "seller_member",
  "member_invite",
  "order_group",
]

export const sellerPolicies = definePolicies(
  generateResourcePolicies(sellerResources)
)
