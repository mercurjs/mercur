import { definePolicies } from "@medusajs/framework/utils"

import { generateResourcePolicies } from "../utils/generate-resource-policies"

export const productAttributePolicies = definePolicies(
  generateResourcePolicies(["product_attribute", "product_attribute_value"])
)
