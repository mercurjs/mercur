import {
  definePolicies,
  PolicyDefinition,
  toPascalCase,
} from "@medusajs/framework/utils"

// todo: update resoure operations
const resourceOperations: [string, string[]][] = [
  ["seller", ["read", "create", "update", "delete"]],
  ["seller_member", ["read", "create", "update", "delete"]],
]

const policies: PolicyDefinition[] = []
for (const [resource, operations] of resourceOperations) {
  for (const operation of operations) {
    policies.push({
      name: toPascalCase(operation) + toPascalCase(resource),
      resource,
      operation,
      description: `${toPascalCase(operation)} ${resource.replace(/_/g, " ")}`,
    })
  }
}

export const sellerPolicies = definePolicies(policies)
