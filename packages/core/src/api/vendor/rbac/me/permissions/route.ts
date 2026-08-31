import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  resolvePermissions,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Policy,
  WILDCARD,
} from "@medusajs/framework/utils"

type PolicyTuple = { resource: string; operation: string }

/**
 * The acting member's effective permissions for the current seller, as a flat
 * list of `resource:operation` strings with wildcards expanded.
 *
 * Roles come from `req.auth_context.app_metadata`, which `ensureSellerMiddleware`
 * populates from the member's `seller_member.role_id`. Reading them there rather
 * than from the member keeps this scoped to the seller the request is acting on —
 * one member can belong to several sellers with a different role in each.
 *
 * When the rbac flag is off `resolvePermissions` returns the whole universe, so
 * the panel sees an unrestricted policy rather than an empty one.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ permissions: string[] }>
) => {
  const roleIds = (req.auth_context?.app_metadata?.roles as string[]) ?? []

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const universe: PolicyTuple[] = []
  const seen = new Set<string>()

  const consider = (resource?: string, operation?: string) => {
    if (
      !resource ||
      !operation ||
      resource === WILDCARD ||
      operation === WILDCARD
    ) {
      return
    }

    const key = `${resource}:${operation}`

    if (seen.has(key)) {
      return
    }

    seen.add(key)
    universe.push({ resource, operation })
  }

  for (const definition of Object.values(Policy)) {
    consider(definition?.resource, definition?.operation)
  }

  // Covers policies persisted at runtime that the code registry doesn't know.
  const { data: persistedPolicies } = await query.graph({
    entity: "rbac_policy",
    fields: ["resource", "operation"],
  })

  for (const policy of persistedPolicies ?? []) {
    consider(policy?.resource, policy?.operation)
  }

  const granted = await resolvePermissions({
    roles: roleIds,
    universe,
    container: req.scope,
  })

  res.status(200).json({ permissions: Array.from(granted).sort() })
}
