import { PolicyDefinition, toPascalCase } from "@medusajs/framework/utils"

export const DEFAULT_POLICY_OPERATIONS = [
  "read",
  "create",
  "update",
  "delete",
] as const

/**
 * Expands resources into one policy per operation, matching the naming Medusa
 * uses for its own catalog (`ReadProduct`, `product:read`).
 */
export function generateResourcePolicies(
  resources: string[],
  operations: readonly string[] = DEFAULT_POLICY_OPERATIONS
): PolicyDefinition[] {
  const policies: PolicyDefinition[] = []

  for (const resource of resources) {
    for (const operation of operations) {
      policies.push({
        name: toPascalCase(operation) + toPascalCase(resource),
        resource,
        operation,
        description: `${toPascalCase(operation)} ${resource.replace(/_/g, " ")}`,
      })
    }
  }

  return policies
}
